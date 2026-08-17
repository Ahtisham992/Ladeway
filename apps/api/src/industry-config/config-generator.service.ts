import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Groq } from 'groq-sdk';

export interface GenerateConfigRequest {
  description: string;
}

@Injectable()
export class ConfigGeneratorService {
  private readonly logger = new Logger(ConfigGeneratorService.name);
  private groq: Groq;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      this.logger.warn('GROQ_API_KEY is missing. AI generation will fail.');
    }
    this.groq = new Groq({ apiKey });
  }

  async generateConfig(description: string): Promise<any> {
    try {
      this.logger.log(`Generating config for: "${description.substring(0, 50)}..."`);
      
      const prompt = `You are an expert conversational AI architect for a SaaS platform called Ladeway.
Your task is to take a user's description of their business and automatically generate a complete JSON configuration for their AI voice/chat agent.

The output MUST be a valid JSON object matching this exact TypeScript schema:
{
  "industryName": "string",
  "personaName": "string (A friendly human name)",
  "personaRole": "string (e.g. Sales Representative, Support Agent)",
  "greeting": "string (The first thing the AI says when a user connects. Make it professional and include the persona name)",
  "tone": "professional" | "friendly" | "formal",
  "fieldsJson": [
    {
      "key": "string (camelCase, e.g. 'budget', 'timeline')",
      "label": "string (Human readable, e.g. 'Estimated Budget')",
      "type": "text" | "number" | "date" | "enum",
      "required": boolean,
      "extractionHint": "string (Instructions for the LLM on how to extract this field from chat)",
      "options": ["array of strings (only if type is 'enum')"]
    }
  ],
  "scoringRulesJson": [
    {
      "field": "string (Must match a key from fieldsJson)",
      "condition": "present" | "equals" | "greater_than" | "less_than" | "in",
      "value": "any (The value to compare against. If condition is 'present', value is null/empty string)",
      "weight": "number (Between 0 and 1, representing the importance of this rule)"
    }
  ]
}

BUSINESS DESCRIPTION:
"${description}"

INSTRUCTIONS:
1. Extract the most logical qualification fields the business would need.
2. For numeric fields (like budget), use "number". For multiple choice, use "enum" and provide "options".
3. Create 3-5 logical scoring rules based on the fields to score lead quality.
4. Output ONLY valid JSON. No markdown, no explanations.`;

      const response = await this.groq.chat.completions.create({
        messages: [
          { role: 'user', content: prompt }
        ],
        model: 'llama3-8b-8192',
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from Groq');
      }

      const json = JSON.parse(content);
      this.logger.log('Successfully generated JSON config');
      return json;
    } catch (error: any) {
      this.logger.error(`Failed to generate config: ${error.message}`, error.stack);
      throw new HttpException('Failed to generate configuration from AI', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
