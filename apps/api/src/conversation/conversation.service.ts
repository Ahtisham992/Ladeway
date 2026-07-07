import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SessionService } from '../session/session.service';
import { IndustryConfigService } from '../industry-config/industry-config.service';
import { PromptService } from '../ai/prompt.service';
import { LLMRouterService } from '../ai/llm-router.service';
import { QualificationEngineService } from '../qualification/qualification-engine.service';
import { ExtractorService } from '../ai/extractor.service';
import { LeadService } from '../lead/lead.service';
import { StartConversationResponse } from './types/conversation.types';
import { ConversationStatus } from '../session/types/session.types';
import { QualificationAction } from '../qualification/types/qualification.types';
import { tenantContext } from '../tenant/tenant.context';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
    private readonly configService: IndustryConfigService,
    private readonly promptService: PromptService,
    private readonly llmRouter: LLMRouterService,
    private readonly qualificationEngine: QualificationEngineService,
    private readonly extractor: ExtractorService,
    private readonly leadService: LeadService,
  ) {}

  async startConversation(configId: string): Promise<StartConversationResponse> {
    const config = await this.configService.getActiveConfig(configId) as any;
    
    const fieldsJson = config.fieldsJson as any[];
    const missingFields = fieldsJson
      .filter(f => f.required)
      .map(f => f.key);

    // Using $system (bypasses RLS) because this is a PUBLIC endpoint.
    // Authentication here is via sessionToken (a secure random CUID),
    // not JWT. The tenantId is sourced from the verified IndustryConfig
    // record, not from user input. This is safe because:
    // 1. sessionToken is a cryptographically random CUID — not guessable
    // 2. conversationId is a CUID — not guessable  
    // 3. We never expose other tenants' data — queries are scoped by
    //    conversationId or sessionToken which are inherently tenant-scoped.
    const conversation = await this.prisma.$system.conversation.create({
      data: {
        tenantId: config.tenantId,
        configId: config.id,
        status: ConversationStatus.QUALIFYING,
      },
    });

    // Create session in Redis
    await this.sessionService.createSession(
      conversation.sessionToken,
      conversation.id,
      config.id,
      config.tenantId
    );

    // Set missing fields immediately
    await this.sessionService.updateSession(conversation.sessionToken, {
      missingFields,
      status: ConversationStatus.QUALIFYING,
      turnCount: 1,
    });

    // Persist the AI greeting
    await this.prisma.$system.message.create({
      data: {
        conversationId: conversation.id,
        sender: 'ai',
        content: config.greeting,
      },
    });

    return {
      conversationId: conversation.id,
      sessionToken: conversation.sessionToken,
      greeting: config.greeting,
    };
  }

  async *sendMessage(sessionToken: string, userMessage: string): AsyncIterable<string> {
    const session = await this.sessionService.getSession(sessionToken);
    if (!session) {
      throw new NotFoundException('Session expired or invalid');
    }

    const config = await this.configService.getActiveConfig(session.configId) as any;

    // Persist user message
    await this.prisma.$system.message.create({
      data: {
        conversationId: session.conversationId,
        sender: 'user',
        content: userMessage,
      },
    });

    // Load history (last 20 messages, ascending)
    const history = await this.prisma.$system.message.findMany({
      where: { conversationId: session.conversationId },
      orderBy: { timestamp: 'asc' },
      take: -20,
    });

    const messages = history.map(m => ({
      role: m.sender === 'ai' ? 'assistant' : 'user' as any,
      content: m.content,
    }));

    const prompt = this.promptService.assembleConversationPrompt(config, session, messages);

    let fullResponse = '';
    
    // Stream response
    for await (const token of this.llmRouter.stream(prompt)) {
      fullResponse += token;
      yield token;
    }

    // Post-stream logic
    await this.prisma.$system.message.create({
      data: {
        conversationId: session.conversationId,
        sender: 'ai',
        content: fullResponse,
      },
    });
    
    messages.push({ role: 'assistant', content: fullResponse });

    // Determine next state
    let nextAction = this.qualificationEngine.getNextAction(session, config, userMessage);
    let newStatus = session.status;
    let currentSession = session;

    if (nextAction === QualificationAction.TRIGGER_EXTRACTION) {
      this.logger.log(`Triggering extraction for session ${sessionToken}`);
      
      const extractionResult = await this.extractor.extract(config, currentSession, messages);
      
      const extractedValues: Record<string, string> = {};
      const newExtractedData = [];
      const newMissingFields = [...currentSession.missingFields];
      
      for (const [key, field] of Object.entries(extractionResult)) {
        if (field.value !== null) {
          extractedValues[key] = field.value;
          newExtractedData.push({
            conversationId: currentSession.conversationId,
            fieldKey: key,
            fieldValue: field.value,
            confidence: field.confidence
          });
          
          if (field.confidence >= 0.6) {
            const index = newMissingFields.indexOf(key);
            if (index !== -1) {
              newMissingFields.splice(index, 1);
            }
          }
        }
      }

      if (newExtractedData.length > 0) {
        await this.prisma.$system.extractedData.createMany({
          data: newExtractedData
        });
        
        const mergedCapturedFields = { ...currentSession.capturedFields, ...extractedValues };
        
        await this.sessionService.updateSession(sessionToken, {
          capturedFields: mergedCapturedFields,
          missingFields: newMissingFields
        });
        
        const updatedSession = await this.sessionService.getSession(sessionToken);
        if (updatedSession) {
          currentSession = updatedSession;
        }

        nextAction = this.qualificationEngine.getNextAction(currentSession, config, userMessage);
      }
    }

    if (nextAction === QualificationAction.TRIGGER_TRANSFER) {
      newStatus = ConversationStatus.TRANSFERRED;
    } else if (nextAction === QualificationAction.CLOSE_CONVERSATION) {
      newStatus = ConversationStatus.CLOSED;
    }

    const updatedSession = await this.sessionService.updateSession(sessionToken, {
      turnCount: currentSession.turnCount + 1,
      status: newStatus,
    });

    // If terminal state, update the DB record too
    if (newStatus === ConversationStatus.CLOSED || newStatus === ConversationStatus.TRANSFERRED) {
      await this.prisma.$system.conversation.update({
        where: { id: session.conversationId },
        data: {
          status: newStatus,
          completedAt: new Date(),
        },
      });
      
      // Phase 12: Trigger Lead Creation asynchronously
      this.leadService.createLeadFromConversation(session.conversationId).catch(err => {
        this.logger.error(`Failed to create lead for conversation ${session.conversationId}`, err.stack);
      });
    }

    // Yield a final JSON chunk so the controller can send the `event: done` with state
    yield JSON.stringify({
      _done: true,
      status: updatedSession!.status,
      turnCount: updatedSession!.turnCount,
    });
  }
}
