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
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('ladeway-api.conversation');

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
    
    if (!config || !config.isActive) {
      throw new NotFoundException('Configuration not found or inactive');
    }
    
    const fieldsJson = config.fieldsJson as any[];
    const missingFields = fieldsJson
      .filter(f => f.required)
      .map(f => f.key);

    // We no longer hardcode contact fields into missingFields.
    // If the admin wants them to be required to close the chat, they must add them as required custom fields.

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
      configSnapshot: {
        fieldsJson: config.fieldsJson,
        scoringRulesJson: config.scoringRulesJson
      }
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
    let session = await this.sessionService.getSession(sessionToken);
    
    if (!session) {
      session = await this.recoverSession(sessionToken);
      if (!session) {
        throw new NotFoundException('Session expired and could not be recovered');
      }
    }

    const config = await this.configService.getActiveConfig(session.configId) as any;
    
    if (session.configSnapshot) {
      config.fieldsJson = session.configSnapshot.fieldsJson;
      config.scoringRulesJson = session.configSnapshot.scoringRulesJson;
    }

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

    let nextAction = this.qualificationEngine.getNextAction(session, config, userMessage);
    let fullResponse = '';
    
    if (nextAction === QualificationAction.TRIGGER_TRANSFER) {
      fullResponse = "I've noted your request to speak with a team member. I'm transferring your conversation now, and someone will be in touch shortly.";
      const words = fullResponse.split(' ');
      for (const word of words) {
        yield word + (word === words[words.length - 1] ? '' : ' ');
        await new Promise(r => setTimeout(r, 20));
      }
    } else {
      const pipelineSpan = tracer.startSpan('ai_pipeline');
      try {
        const promptSpan = tracer.startSpan('assemble_prompt');
        const prompt = this.promptService.assembleConversationPrompt(config, session, messages);
        promptSpan.end();
        
        let llmTokens = 0;
        const llmSpan = tracer.startSpan('llm_inference_stream');
        try {
          for await (const token of this.llmRouter.stream(prompt)) {
            fullResponse += token;
            llmTokens++;
            yield token;
          }
          llmSpan.setAttribute('tokens_generated', llmTokens);
        } catch (error: any) {
          this.logger.error(`AI Streaming Error: ${error.message}`, error.stack);
          llmSpan.recordException(error);
          throw new Error('AI service temporarily unavailable. Please try again.');
        } finally {
          llmSpan.end();
        }
      } finally {
        pipelineSpan.end();
      }
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

    let newStatus = session.status;
    let currentSession = session;

    // We run extraction on TRIGGER_EXTRACTION and TRIGGER_TRANSFER
    if (nextAction === QualificationAction.TRIGGER_EXTRACTION || nextAction === QualificationAction.TRIGGER_TRANSFER) {
      this.logger.log(`Triggering extraction for session ${sessionToken} with action ${nextAction}`);
      
      const extractSpan = tracer.startSpan('extraction_parser');
      let extractionResult: Record<string, any> = {};
      try {
        extractionResult = await this.extractor.extract(config, currentSession, messages);
      } finally {
        extractSpan.end();
      }
      
      const extractedValues: Record<string, string> = {};
      const newExtractedData = [];
      const newMissingFields = [...currentSession.missingFields];
      
      for (const [key, field] of Object.entries(extractionResult)) {
        if (field.value !== null && field.value !== undefined) {
          // If the extracted value is literally the string "null" (which LLMs sometimes output), ignore it
          if (typeof field.value === 'string' && field.value.toLowerCase() === 'null') {
            continue;
          }

          extractedValues[key] = field.value;
          newExtractedData.push({
            conversationId: currentSession.conversationId,
            fieldKey: key,
            fieldValue: field.value,
            confidence: field.confidence
          });
          
          if (field.confidence >= 0.4) {
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

        // Only re-evaluate if it was TRIGGER_EXTRACTION, as we might have completed all fields
        if (nextAction === QualificationAction.TRIGGER_EXTRACTION) {
          nextAction = this.qualificationEngine.getNextAction(currentSession, config, userMessage);
        }
      }
    }

    if (nextAction === QualificationAction.TRIGGER_TRANSFER) {
      newStatus = ConversationStatus.TRANSFERRED;
    } else if (nextAction === QualificationAction.CLOSE_CONVERSATION) {
      newStatus = ConversationStatus.SCORED;
    }

    const updatedSession = await this.sessionService.updateSession(sessionToken, {
      turnCount: currentSession.turnCount + 1,
      status: newStatus,
    });

    // If terminal state, update the DB record too
    let finalLead: any = null;
    let confirmationMessage = undefined;

    if (newStatus === ConversationStatus.SCORED || newStatus === ConversationStatus.TRANSFERRED || newStatus === ConversationStatus.CLOSED) {
      await this.prisma.$system.conversation.update({
        where: { id: session.conversationId },
        data: {
          status: newStatus,
          completedAt: new Date(),
        },
      });
      
      try {
        if (newStatus === ConversationStatus.SCORED) {
          // Trigger delayed lead generation (5 minutes)
          this.logger.log(`Scheduling delayed lead generation for conversation ${session.conversationId} in 5 minutes`);
          setTimeout(async () => {
            try {
              await this.leadService.createLeadFromConversation(session.conversationId);
              this.logger.log(`Successfully executed delayed lead generation for conversation ${session.conversationId}`);
            } catch (err: any) {
              this.logger.error(`Failed to create delayed lead for conversation ${session.conversationId}`, err.stack);
            }
          }, 5 * 60 * 1000); // 5 minutes
          
          confirmationMessage = `Thank you — I have everything I need! I will finalize your details in about 5 minutes, so let me know now if you'd like to change anything. Otherwise, a member of our team will be in touch with you shortly.`;
        } else {
          // Immediately generate for transferred or closed calls (optional)
          await this.leadService.createLeadFromConversation(session.conversationId);
        }
      } catch (err: any) {
        this.logger.error(`Failed to handle lead generation for conversation ${session.conversationId}`, err.stack);
      }
    }

    // Yield a final JSON chunk so the controller can send the `event: done` with state
    yield JSON.stringify({
      _done: true,
      status: updatedSession!.status,
      turnCount: updatedSession!.turnCount,
      confirmationMessage,
      conversationId: session.conversationId,
      tier: finalLead?.tier || undefined
    });
  }

  private async recoverSession(sessionToken: string): Promise<any | null> {
    // Find conversation in PostgreSQL by sessionToken
    const conversation = await this.prisma.$system.conversation.findUnique({
      where: { sessionToken },
      include: { config: true, messages: { orderBy: { timestamp: 'asc' } } }
    });
    
    if (!conversation || ['CLOSED','TRANSFERRED','ABANDONED'].includes(conversation.status)) {
      return null;
    }

    const messages = conversation.messages.map(m => ({
      role: m.sender === 'ai' ? 'assistant' : 'user',
      content: m.content
    }));

    // Re-derive captured fields from message history
    const extractionResult = await this.extractor.extract(
      conversation.config as any,
      {
        conversationId: conversation.id,
        tenantId: conversation.tenantId,
        configId: conversation.configId,
        status: conversation.status as ConversationStatus,
        capturedFields: {},
        missingFields: (conversation.config.fieldsJson as any[]).map(f => f.key),
        turnCount: Math.floor(conversation.messages.length / 2) + 1,
        lastActivityAt: new Date().toISOString()
      },
      messages as any
    );
    
    const allFields = conversation.config.fieldsJson as any[];
    const requiredFields = allFields.filter(f => f.required).map(f => f.key);
    const capturedKeys = Object.keys(extractionResult).filter(k => extractionResult[k]?.value);
    
    const recoveredSession = {
      conversationId: conversation.id,
      tenantId: conversation.tenantId,
      configId: conversation.configId,
      status: conversation.status as ConversationStatus,
      capturedFields: Object.fromEntries(
        capturedKeys.map(k => [k, extractionResult[k].value as string])
      ),
      missingFields: requiredFields.filter(k => !capturedKeys.includes(k)),
      turnCount: Math.floor(conversation.messages.length / 2) + 1,
      lastActivityAt: new Date().toISOString()
    };
    
    // Re-store in Redis with fresh 24h TTL
    await this.sessionService.createSession(
      sessionToken,
      conversation.id,
      conversation.configId,
      conversation.tenantId
    );
    // Since createSession initializes empty fields, we must update it with the recovered data
    await this.sessionService.updateSession(sessionToken, recoveredSession);
    
    return recoveredSession;
  }
}
