import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExtractorService } from '../src/ai/extractor.service';
import { ConversationSession, ConversationStatus } from '../src/session/types/session.types';
import { LLMMessage } from '../src/ai/prompt.service';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const extractorService = app.get(ExtractorService);

  const config = await prisma.industryConfig.findFirst({
    where: { industryName: 'Real Estate', isActive: true },
    orderBy: { createdAt: 'desc' }
  });

  if (!config) {
    console.error('No config found!');
    return;
  }

  const mockSession: ConversationSession = {
    conversationId: 'conv-1',
    configId: config.id,
    tenantId: config.tenantId,
    status: ConversationStatus.QUALIFYING,
    capturedFields: {},
    missingFields: (config.fieldsJson as any[]).map(f => f.key),
    turnCount: 2,
    lastActivityAt: new Date().toISOString(),
  };

  const mockMessages: LLMMessage[] = [
    { role: 'assistant', content: 'Hello! I can help you find your next home. Are you looking to buy or rent?' },
    { role: 'user', content: 'Hi, I want to rent a 3-bedroom house in London.' },
    { role: 'assistant', content: 'What is your budget?' },
    { role: 'user', content: 'My budget is around $3000 per month. I am looking to move in about two months. I have pre-approval ready. My name is John Doe, email is john@test.com, phone is 555-1234. That is everything.' }
  ];

  console.log('--- RUNNING EXTRACTION ---');
  try {
    const result = await extractorService.extract(config, mockSession, mockMessages);
    console.log('EXTRACTION RESULT:');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('EXTRACTION ERROR:', err);
  }

  await app.close();
}

bootstrap();
