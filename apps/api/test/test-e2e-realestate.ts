import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const API_URL = 'http://localhost:3001';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('--- STARTING REAL ESTATE E2E TEST ---');

  // 1. Find an active config
  const config = await prisma.industryConfig.findFirst({
    where: { isActive: true, industryName: 'Real Estate' },
    orderBy: { createdAt: 'desc' },
  });

  if (!config) {
    console.error('No active IndustryConfig found.');
    process.exit(1);
  }
  console.log(`Using Config ID: ${config.id} (${config.industryName})`);

  // 2. Start Conversation
  console.log('\n[USER] Starting conversation...');
  let res = await fetch(`${API_URL}/conversations/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ configId: config.id }),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Failed to start conversation:', errorText);
    process.exit(1);
  }

  const startData = await res.json();
  const sessionToken = startData.sessionToken;
  const conversationId = startData.conversationId;
  console.log(`[AI] ${startData.greeting}`);

  // 3. Send Messages
  const messages = [
    "Hi, I want to rent a 3-bedroom house in London.",
    "My budget is around $3000 per month. I'm looking to move in about two months. I have pre-approval ready. My name is John Doe, email is john@test.com, phone is 555-1234. That is everything."
  ];

  for (const userMsg of messages) {
    console.log(`\n[USER] ${userMsg}`);
    
    const response = await fetch(`${API_URL}/conversations/${conversationId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken, message: userMsg }),
    });

    if (!response.body) {
      console.error('No response body');
      break;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let aiResponse = '';
    let isClosed = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(Boolean);

      for (const line of lines) {
        if (line.startsWith('event: token')) {
          continue; // skip event line
        }
        if (line.startsWith('event: done')) {
          continue; // skip event line
        }
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.substring(6));
          if (data.content) {
            aiResponse += data.content;
          }
          if (data.status === 'CLOSED') {
            isClosed = true;
          }
        }
      }
    }

    console.log(`[AI] ${aiResponse}`);

    if (isClosed) {
      console.log('\n=== CONVERSATION CLOSED ===');
      break;
    }
  }

  // 4. Wait for async lead creation to finish
  console.log('Waiting 3 seconds for async lead creation...');
  await delay(3000);

  // 5. Verify Database Tables
  console.log('\n--- DATABASE VERIFICATION ---');

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });
  console.log(`\n1. Conversation Table:\nStatus: ${conversation?.status}, CompletedAt: ${conversation?.completedAt}`);

  const msgs = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { timestamp: 'asc' },
  });
  console.log(`\n2. Messages Table: (${msgs.length} rows)`);
  msgs.forEach(m => console.log(`- [${m.sender}] ${m.content}`));

  const extracted = await prisma.extractedData.findMany({
    where: { conversationId },
  });
  console.log(`\n3. ExtractedData Table: (${extracted.length} rows)`);
  extracted.forEach(e => console.log(`- ${e.fieldKey}: ${e.fieldValue} (Conf: ${e.confidence})`));

  const lead = await prisma.lead.findUnique({
    where: { conversationId },
  });
  console.log(`\n4. Leads Table:`);
  if (lead) {
    console.log(`- Name: ${lead.contactName}`);
    console.log(`- Email: ${lead.contactEmail}`);
    console.log(`- Phone: ${lead.contactPhone}`);
    console.log(`- Score: ${lead.score}`);
    console.log(`- Tier: ${lead.tier}`);
    console.log(`- Summary: ${lead.summary}`);
  } else {
    console.log(`- NO LEAD FOUND!`);
  }

  console.log('\n--- E2E TEST COMPLETE ---');
  await prisma.$disconnect();
}

runTest().catch(console.error);
