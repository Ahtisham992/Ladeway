import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { SessionService } from '../session/session.service';
import { ConversationStatus } from '../session/types/session.types';
import { ExtractorService } from '../ai/extractor.service';
import { LeadService } from '../lead/lead.service';

@Injectable()
export class AbandonmentCronService {
  private readonly logger = new Logger(AbandonmentCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
    private readonly extractor: ExtractorService,
    private readonly leadService: LeadService,
  ) {}

  /**
   * Runs every hour. Finds conversations with no activity in 24 hours
   * that are still in an active state, marks them ABANDONED, and cleans
   * up their Redis sessions.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleAbandonedConversations(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const staleConversations = await this.prisma.$system.conversation.findMany({
      where: {
        startedAt: { lt: cutoff },
        status: {
          notIn: [
            ConversationStatus.CLOSED,
            ConversationStatus.TRANSFERRED,
            ConversationStatus.ABANDONED,
          ],
        },
      },
      select: {
        id: true,
        sessionToken: true,
        configId: true,
      },
    });

    if (staleConversations.length === 0) {
      return;
    }

    this.logger.log(
      `Found ${staleConversations.length} stale conversation(s) to mark as ABANDONED`,
    );

    for (const conv of staleConversations) {
      // Update PostgreSQL status
      await this.prisma.$system.conversation.update({
        where: { id: conv.id },
        data: {
          status: ConversationStatus.ABANDONED,
          completedAt: new Date(),
        },
      });

      // Trigger partial extraction if ≥50% of fields were captured
      const config = await this.prisma.$system.industryConfig.findUnique({ where: { id: conv.configId } });
      const session = await this.sessionService.getSession(conv.sessionToken);
      
      if (config && session) {
        const fieldsJson = config.fieldsJson as any[];
        const totalFields = fieldsJson.filter(f => f.required).length;
        const capturedFieldsCount = Object.keys(session.capturedFields).length;
        
        if (totalFields > 0 && (capturedFieldsCount / totalFields) >= 0.5) {
          this.logger.log(`Triggering partial extraction for ABANDONED conversation ${conv.id}`);
          
          const history = await this.prisma.$system.message.findMany({
            where: { conversationId: conv.id },
            orderBy: { timestamp: 'asc' },
          });
          
          const messages = history.map(m => ({
            role: m.sender === 'ai' ? 'assistant' : 'user' as any,
            content: m.content,
          }));

          const extractionResult = await this.extractor.extract(config as any, session, messages);
          
          const newExtractedData = [];
          for (const [key, field] of Object.entries(extractionResult)) {
            if (field.value !== null) {
              newExtractedData.push({
                conversationId: session.conversationId,
                fieldKey: key,
                fieldValue: field.value,
                confidence: field.confidence
              });
            }
          }

          if (newExtractedData.length > 0) {
            await this.prisma.$system.extractedData.createMany({ data: newExtractedData });
          }
          
          try {
            await this.leadService.createLeadFromConversation(conv.id);
          } catch (err: any) {
            this.logger.error(`Failed to create lead for abandoned conversation ${conv.id}`, err.stack);
          }
        }
      }

      // Clean up Redis session AFTER extraction is done
      await this.sessionService.deleteSession(conv.sessionToken);

      this.logger.log(`Marked conversation ${conv.id} as ABANDONED`);
    }

    this.logger.log(
      `Abandonment sweep complete: ${staleConversations.length} conversation(s) processed`,
    );
  }
}
