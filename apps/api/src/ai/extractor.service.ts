import { Injectable, Logger } from '@nestjs/common';
import { LLMRouterService } from './llm-router.service';
import { PromptService, LLMMessage } from './prompt.service';
import { ExtractedField, ExtractionResult } from './types/extractor.types';
import { IndustryConfig } from '@prisma/client';
import { ConversationSession } from '../session/types/session.types';

@Injectable()
export class ExtractorService {
  private readonly logger = new Logger(ExtractorService.name);

  constructor(
    private readonly llmRouter: LLMRouterService,
    private readonly promptService: PromptService,
  ) {}

  async extract(
    config: IndustryConfig,
    session: ConversationSession,
    messages: LLMMessage[],
    retryCount = 0
  ): Promise<ExtractionResult> {
    try {
      const prompt = this.promptService.assembleExtractionPrompt(config, session, messages);
      
      const stream = await this.llmRouter.stream(prompt);
      let response = '';
      for await (const chunk of stream) {
        response += chunk;
      }

      this.logger.warn(`Raw LLM Extraction Output: ${response}`);
      
      return this.parseAndValidate(response, config, session);
    } catch (error) {
      if (retryCount < 1 && (error instanceof SyntaxError || (error as Error).message.includes('JSON'))) {
        this.logger.warn('Failed to parse JSON, retrying once...', error);
        return this.extract(config, session, messages, retryCount + 1);
      }
      this.logger.error('Extraction failed completely', error);
      throw error;
    }
  }

  private parseAndValidate(raw: string, config: IndustryConfig, session: ConversationSession): ExtractionResult {
    let cleanStr = raw;
    
    // Find the first { and last } to extract just the JSON object
    const startIdx = cleanStr.indexOf('{');
    const endIdx = cleanStr.lastIndexOf('}');
    
    if (startIdx !== -1 && endIdx !== -1 && endIdx >= startIdx) {
      cleanStr = cleanStr.substring(startIdx, endIdx + 1);
    }

    const parsed = JSON.parse(cleanStr);
    const result: ExtractionResult = {};

    const fieldsJson = config.fieldsJson as any[];
    for (const field of fieldsJson) {
      if (field.key in parsed) {
        result[field.key] = this.parseField(parsed[field.key]);
      }
    }

    const contactMapping: Record<string, string[]> = {
      'name': ['name', 'full_name', 'customer_name'],
      'email': ['email', 'email_address'],
      'phone': ['phone', 'phone_number', 'mobile']
    };

    for (const [canonicalKey, aliases] of Object.entries(contactMapping)) {
      for (const alias of aliases) {
        if (alias in parsed && parsed[alias] !== null) {
          result[canonicalKey] = this.parseField(parsed[alias]);
          break;
        }
      }
    }

    return result;
  }

  private parseField(raw: unknown): ExtractedField {
    if (raw === null || raw === undefined) {
      return { value: null, confidence: 0 };
    }
    // Handle nested format: { value: "...", confidence: 0.9 }
    if (typeof raw === 'object' && 'value' in raw) {
      return {
        value: (raw as any).value ?? null,
        confidence: typeof (raw as any).confidence === 'number' ? (raw as any).confidence : 0.8
      };
    }
    // Handle flat string format (fallback)
    if (typeof raw === 'string') {
      return { value: raw, confidence: 0.8 };
    }
    return { value: null, confidence: 0 };
  }
}
