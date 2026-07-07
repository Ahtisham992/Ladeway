import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExtractorService } from '../src/ai/extractor.service';
import { IndustryConfig } from '@prisma/client';
import { ConversationSession, ConversationStatus } from '../src/session/types/session.types';
import { LLMMessage } from '../src/ai/prompt.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const extractorService = app.get(ExtractorService);

  const mockConfig = {
    id: 'mock-config-1',
    tenantId: 'tenant-1',
    industryName: 'Logistics / Moving',
    personaName: 'Alexandra',
    personaRole: 'Logistics Coordinator',
    greeting: 'Hello, I am Alexandra.',
    tone: 'professional',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    scoringRulesJson: [],
    fieldsJson: [
      {
        key: 'origin',
        label: 'Origin City',
        type: 'text',
        required: true,
        extractionHint: 'The city or location the customer is moving from',
      },
      {
        key: 'destination',
        label: 'Destination',
        type: 'text',
        required: true,
        extractionHint: 'The city or country the customer is moving to',
      },
      {
        key: 'timeline',
        label: 'Timeline',
        type: 'text',
        required: true,
        extractionHint: 'When the customer wants to move',
      },
    ]
  } as unknown as IndustryConfig;

  const mockSession: ConversationSession = {
    conversationId: 'conv-1',
    configId: 'mock-config-1',
    tenantId: 'tenant-1',
    status: ConversationStatus.QUALIFYING,
    capturedFields: {},
    missingFields: ['origin', 'destination', 'timeline'],
    turnCount: 2,
    lastActivityAt: new Date().toISOString(),
  };

  const mockMessages: LLMMessage[] = [
    { role: 'assistant', content: 'Hello! I can help you with your move. Where are you moving from?' },
    { role: 'user', content: 'Hi, I need to move from New York to London next month.' },
  ];

  console.log('--- RUNNING EXTRACTION ---');
  try {
    const result = await extractorService.extract(mockConfig, mockSession, mockMessages);
    console.log('EXTRACTION RESULT:');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('EXTRACTION ERROR:', err);
  }

  await app.close();
}

bootstrap();
