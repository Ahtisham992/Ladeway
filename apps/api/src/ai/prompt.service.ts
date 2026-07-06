import { Injectable } from '@nestjs/common';
import { ConversationSession } from '../session/types/session.types';
import { QualificationField } from '@ladeway/types';
import { IndustryConfig } from '@prisma/client';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class PromptService {
  assembleConversationPrompt(
    config: IndustryConfig,
    session: ConversationSession,
    messages: LLMMessage[]
  ): LLMMessage[] {
    const fieldsJson = config.fieldsJson as any[];
    
    const capturedSection = Object.keys(session.capturedFields).length > 0
      ? `ALREADY CAPTURED:\n${Object.entries(session.capturedFields)
          .map(([k, v]) => `✓ ${k}: ${v}`)
          .join('\n')}`
      : 'ALREADY CAPTURED: Nothing yet — this is the start of the conversation.';

    const missingSection = session.missingFields.length > 0
      ? `STILL NEEDED:\n${session.missingFields.map(f => `○ ${f}`).join('\n')}`
      : 'STILL NEEDED: None. All required information has been collected.';

    const systemContent = `You are ${config.personaName}, a ${config.personaRole} working in the ${config.industryName} industry.
Your tone should be ${config.tone}.

Your goal is to qualify the user by collecting specific information. Ask only ONE question at a time. Do not overwhelm the user. Do not break character.

Here is the current state of the conversation:

${capturedSection}

${missingSection}

If the user has just started the conversation, greet them naturally using or adapting this greeting: "${config.greeting}"
If all required fields are collected, gracefully inform the user that you have everything you need and someone will be in touch.`;

    const systemMessage: LLMMessage = {
      role: 'system',
      content: systemContent,
    };

    return [systemMessage, ...messages];
  }

  assembleExtractionPrompt(
    config: IndustryConfig,
    session: ConversationSession,
    recentMessages: LLMMessage[]
  ): LLMMessage[] {
    const fieldsJson = config.fieldsJson as any[];
    
    // Create instructions mapping missing fields to their extraction hints
    const missingFieldsMap = fieldsJson
      .filter(f => session.missingFields.includes(f.key))
      .map(f => `"${f.key}": ${f.extractionHint}`)
      .join('\n  ');

    const conversationContext = recentMessages
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    const systemContent = `Analyze the following conversation snippet and extract any newly provided structured data.

Fields to look for based on what is currently missing:
{
  ${missingFieldsMap}
}

CRITICAL: Your response must be ONLY a valid JSON object.
No explanation. No markdown code fences. No preamble.
Start your response with { and end with }.

If a field was not mentioned in the conversation, return null for that field.

Example output format:
{
  "field_key": "extracted_value"
}

Conversation Snippet:
${conversationContext}`;

    return [
      {
        role: 'user',
        content: systemContent,
      }
    ];
  }
}
