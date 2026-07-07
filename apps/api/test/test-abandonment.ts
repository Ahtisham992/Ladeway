import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AbandonmentCronService } from '../src/qualification/abandonment-cron.service';
import { SessionService } from '../src/session/session.service';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runTest() {
  console.log('--- STARTING ABANDONMENT TEST ---');

  const app = await NestFactory.createApplicationContext(AppModule);
  const cronService = app.get(AbandonmentCronService);
  const sessionService = app.get(SessionService);

  const config = await prisma.industryConfig.findFirst({
    where: { industryName: 'Legal Services', isActive: true },
    orderBy: { createdAt: 'desc' }
  });

  if (!config) {
    console.error('No active Legal Services config found!');
    process.exit(1);
  }

  // 1. Create a dummy conversation that is 25 hours old (stale)
  const conversation = await prisma.conversation.create({
    data: {
      tenantId: config.tenantId,
      configId: config.id,
      status: 'QUALIFYING',
      startedAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
    }
  });

  console.log(`Created stale conversation: ${conversation.id}`);
  console.log(`Conversation startedAt: ${conversation.startedAt}`);
  
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  console.log(`Cutoff for cron is: ${cutoff}`);

  // Create messages to represent partial capture (has_existing_attorney and case_type)
  await prisma.message.createMany({
    data: [
      { conversationId: conversation.id, sender: 'ai', content: 'What type of legal issue are you facing?' },
      { conversationId: conversation.id, sender: 'user', content: 'I have a personal injury case, I need help.' },
      { conversationId: conversation.id, sender: 'ai', content: 'Do you already have an attorney representing you?' },
      { conversationId: conversation.id, sender: 'user', content: 'No, I do not have a lawyer yet.' }
    ]
  });

  // Create a Redis session representing this partial state
  // We need at least 50% fields. Legal Services has 5 required fields.
  // We captured 2 fields here, wait! 2 / 5 is 40%. We need 3 fields to reach 50%? 3 / 5 is 60%.
  // Let's add one more field to the message: "yesterday in New York"
  await prisma.message.create({
    data: { conversationId: conversation.id, sender: 'user', content: 'This happened yesterday in New York.' }
  });

  // Set the redis session to have some captured fields so we can verify if it's there
  await sessionService.createSession(conversation.sessionToken, conversation.id, config.id, config.tenantId);
  await sessionService.updateSession(conversation.sessionToken, {
    capturedFields: {
      case_type: 'personal injury',
      has_existing_attorney: 'no',
      jurisdiction: 'New York',
      incident_date: 'yesterday'
    },
    missingFields: ['injury_severity']
  });

  console.log('Running abandonment cron...');
  await cronService.handleAbandonedConversations();

  // Verify the lead is created and marked as ABANDONED
  const updatedConv = await prisma.conversation.findUnique({
    where: { id: conversation.id },
    include: { lead: true }
  });

  console.log(`\n--- FINAL DATABASE VERIFICATION ---`);
  console.log(`Status: ${updatedConv?.status}`);
  
  if (updatedConv?.lead) {
    console.log(`\nLead Created:`);
    console.log(`- Status: ${updatedConv.lead.status}`);
    console.log(`- Tier: ${updatedConv.lead.tier}, Score: ${updatedConv.lead.score}`);
    console.log(`- Summary: ${updatedConv.lead.summary}`);
  } else {
    console.log(`\nNO LEAD FOUND!`);
  }

  if (updatedConv?.status === 'ABANDONED' && updatedConv?.lead?.status === 'ABANDONED' && updatedConv.lead.summary.includes('[PARTIAL]')) {
    console.log('\nSUCCESS! Abandonment test passed.');
  } else {
    console.error('\nFAILURE! Lead was not created or not marked as ABANDONED correctly.');
    process.exit(1);
  }
}

runTest().catch(console.error);
