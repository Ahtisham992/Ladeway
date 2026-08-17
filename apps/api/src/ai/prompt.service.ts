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
Your tone should be ${config.tone}. You should sound like a professional, friendly, and highly efficient customer care agent.

Your goal is to qualify the user by collecting specific information. Ask only ONE question at a time. 
CRITICAL RULE 1: Keep your responses extremely short, punchy, and conversational. Do not use long descriptions or repeat information unnecessarily. Just acknowledge their answer briefly and ask the next question directly. Do not break character.
CRITICAL RULE 2: NEVER use filler words or thinking words like "hmm", "mhmm", "alright", "are you there", or "let me check". Speak directly and naturally like a fast-paced human customer service agent.
CRITICAL RULE 3: When asking for the user's Name, Email, or Phone number, you MUST explicitly say: "Please enter your [name/email/phone] in the box." Do not ask them to speak it.

Here is the current state of the conversation:

${capturedSection}

${missingSection}

If the user has just started the conversation, greet them naturally using or adapting this greeting: "${config.greeting}"
If all required fields are collected, you MUST summarize all the details (e.g. name, cargo, timeline, origin, etc.) in a friendly way for final confirmation, inform them that you have everything you need, and let them know someone will be in touch shortly to provide a quote.

If all required fields are collected AND you have already provided the final confirmation, but the user continues to speak (e.g., saying hello or adding details), politely acknowledge them, update their details if they asked to, and remind them that their lead is recorded and someone will reach out soon. Do not simply output nothing.`;

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
      .filter(f => !Object.keys(session.capturedFields).includes(f.key))
      .map(f => `"${f.key}": ${f.label} — hint: ${f.extractionHint}`)
      .join('\n');

    const contactFieldsMap = `
"name": Customer Full Name — hint: the person's name
"email": Customer Email Address — hint: email address
"phone": Customer Phone Number — hint: phone number`;

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
${contactFieldsMap}

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

    const systemContent = `Generate ONE single sentence summarizing this lead based ONLY on the extracted data provided.
Maximum 20 words. No bullet points. No line breaks.
Combine the key details (e.g. type of inquiry, location, budget/cargo, timeline) into a natural flowing sentence. 
Do not include fields that are missing or unknown. If a timeline is not provided, do not mention it.
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
