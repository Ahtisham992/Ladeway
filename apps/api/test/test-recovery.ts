import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('--- STARTING RECOVERY E2E TEST ---');

  const config = await prisma.industryConfig.findFirst({
    where: { industryName: 'Real Estate', isActive: true },
    orderBy: { createdAt: 'desc' }
  });

  if (!config) {
    console.error('No active Real Estate config found!');
    process.exit(1);
  }

  console.log(`Using Config ID: ${config.id}`);

  // 1. Start conversation
  let res = await fetch(`${API_URL}/conversations/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ configId: config.id }),
  });

  if (!res.ok) {
    console.error('Failed to start conversation');
    process.exit(1);
  }

  const { conversationId, sessionToken, greeting } = await res.json();
  console.log(`[AI] ${greeting}\n`);

  // 2. Complete 1 turn
  const msg1 = 'Hi, I want to rent a 3-bedroom house in London.';
  console.log(`[USER] ${msg1}`);
  
  res = await fetch(`${API_URL}/conversations/${conversationId}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionToken, message: msg1 }),
  });

  if (!res.ok) {
    console.error('Failed to send message');
    process.exit(1);
  }

  const reader1 = res.body!.getReader();
  const decoder1 = new TextDecoder();
  let aiResponse1 = '';

  while (true) {
    const { done, value } = await reader1.read();
    if (done) break;

    const chunk = decoder1.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(Boolean);

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.substring(6);
        if (dataStr === '[DONE]') continue;
        try {
          const data = JSON.parse(dataStr);
          if (data.content) aiResponse1 += data.content;
        } catch (e) {}
      }
    }
  }

  console.log(`[AI] ${aiResponse1}\n`);

  // Wait briefly for background DB updates
  await delay(2000);

  // 3. Manually delete the Redis session key to simulate expiry
  console.log('--- SIMULATING REDIS EXPIRY (DELETING SESSION) ---');
  const { Redis } = require('@upstash/redis');
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  await redis.del(`session:${sessionToken}`);

  console.log('Session deleted from Redis. Verifying it is gone...');
  const verifyDeleted = await redis.get(`session:${sessionToken}`);
  if (verifyDeleted) {
    console.error('Failed to delete Redis session');
    process.exit(1);
  }

  // 4. Send another message to trigger recovery
  const msg2 = 'My budget is around $3000 per month. I am looking to move in about two months. I have pre-approval ready. My name is John Doe, email is john@test.com, phone is 555-1234. That is everything.';
  console.log(`[USER] ${msg2}`);
  console.log(`[SYSTEM] Attempting to send message with expired session...`);

  res = await fetch(`${API_URL}/conversations/${conversationId}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionToken, message: msg2 }),
  });

  if (!res.ok) {
    console.error(`Failed to send message: ${res.status}`);
    const err = await res.text();
    console.error(err);
    process.exit(1);
  }

  const reader2 = res.body!.getReader();
  const decoder2 = new TextDecoder();
  let aiResponse2 = '';

  while (true) {
    const { done, value } = await reader2.read();
    if (done) break;

    const chunk = decoder2.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(Boolean);

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.substring(6);
        if (dataStr === '[DONE]') continue;
        try {
          const data = JSON.parse(dataStr);
          if (data.content) aiResponse2 += data.content;
        } catch (e) {}
      }
    }
  }

  console.log(`[AI] ${aiResponse2}\n`);

  // Verify conversation is contextually aware
  // The AI should close the conversation if it recovered the history because msg2 provides the remaining details.
  console.log('Waiting 15 seconds for async extraction and lead creation...');
  await delay(15000);

  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { extractedData: true, lead: true },
  });

  console.log(`\n--- FINAL DATABASE VERIFICATION ---`);
  console.log(`Status: ${conv?.status}`);
  console.log(`ExtractedData rows: ${conv?.extractedData.length}`);
  if (conv?.extractedData) {
    conv.extractedData.forEach(d => {
      console.log(`- ${d.fieldKey}: ${d.fieldValue} (Conf: ${d.confidence})`);
    });
  }

  if (conv?.lead) {
    console.log(`\nLead Created:`);
    console.log(`- Tier: ${conv.lead.tier}, Score: ${conv.lead.score}`);
    console.log(`- Summary: ${conv.lead.summary}`);
  } else {
    console.log(`\nNO LEAD FOUND!`);
  }

  if (conv?.status === 'CLOSED' && conv?.lead) {
    console.log('\nSUCCESS! Recovery test passed.');
  } else {
    console.error('\nFAILURE! Conversation did not complete successfully after recovery.');
    process.exit(1);
  }
}

runTest().catch(console.error);
