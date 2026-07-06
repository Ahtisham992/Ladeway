import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { SessionService } from '../session/session.service';
import { ConversationStatus } from '../session/types/session.types';

@Injectable()
export class AbandonmentCronService {
  private readonly logger = new Logger(AbandonmentCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Runs every hour. Finds conversations with no activity in 24 hours
   * that are still in an active state, marks them ABANDONED, and cleans
   * up their Redis sessions.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleAbandonedConversations(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const staleConversations = await this.prisma.conversation.findMany({
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
      await this.prisma.conversation.update({
        where: { id: conv.id },
        data: {
          status: ConversationStatus.ABANDONED,
          completedAt: new Date(),
        },
      });

      // Clean up Redis session
      await this.sessionService.deleteSession(conv.sessionToken);

      // TODO: Phase 11 — trigger partial extraction if ≥50% of fields were captured

      this.logger.log(`Marked conversation ${conv.id} as ABANDONED`);
    }

    this.logger.log(
      `Abandonment sweep complete: ${staleConversations.length} conversation(s) processed`,
    );
  }
}
