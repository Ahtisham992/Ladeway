import { Injectable } from '@nestjs/common';
import { ConversationSession } from '../session/types/session.types';
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
    
    const missingFieldsMap = fieldsJson
      .filter(f => session.missingFields.includes(f.key))
      .map(f => `"${f.key}": ${f.label} — hint: ${f.extractionHint}`)
      .join('\n');

    const conversationContext = recentMessages
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    const systemContent = `Analyze this conversation and extract the following fields.

REQUIRED OUTPUT FORMAT — follow exactly:
{
  "field_key": { "value": "extracted value or null", "confidence": 0.0-1.0 },
  "another_field": { "value": null, "confidence": 0 }
}

RULES:
- Return ONLY the JSON object. No explanation. No markdown. No code fences.
- Start with { and end with }
- Return null value with confidence 0 if a field was not mentioned
- Confidence guide: 0.9+ = explicitly stated, 0.7 = clearly implied, 0.5 = uncertain

FIELDS TO EXTRACT:
${missingFieldsMap}

CONVERSATION:
${conversationContext}`;

    return [
      {
        role: 'user',
        content: systemContent,
      }
    ];
  }

  assembleLeadSummaryPrompt(
    config: IndustryConfig,
    extractedData: { fieldKey: string; fieldValue: string | null }[]
  ): LLMMessage[] {
    const dataContext = extractedData
      .filter(d => d.fieldValue !== null)
      .map(d => `${d.fieldKey}: ${d.fieldValue}`)
      .join('\n');

    const systemContent = `Generate ONE single sentence summarizing this lead.
Maximum 20 words. No bullet points. No line breaks.
Format: "[Contact type] inquiry from [location/context], [key detail], timeline [timeline]."
Example: "Residential move from New York to London, full household goods, timeline March 2026."

Return ONLY the summary sentence. Nothing else.

Extracted Data:
${dataContext}`;

    return [
      {
        role: 'user',
        content: systemContent,
      }
    ];
  }
}
