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

const conversations: Record<string, string[]> = {
  'Logistics / Moving': [
    'Hi, I need to move a full 3-bedroom house from New York to London on May 1st.',
    'My name is John Doe, my email is john@test.com, and my phone is 555-1234. That is everything, thank you.'
  ],
  'Real Estate': [
    'Hi, I want to rent a 3-bedroom house in London.',
    'My budget is around $3000 per month. I am looking to move in about two months. I have pre-approval ready. My name is John Doe, email is john@test.com, phone is 555-1234. That is everything.'
  ],
  'Legal Services': [
    'Hi, I was involved in a car accident personal injury yesterday in New York and it is quite severe.',
    'I do not have a lawyer yet. My name is John Doe, email is john@test.com, phone is 555-1234. That is everything.'
  ]
};

async function runTest() {
  console.log('--- STARTING ALL CONFIGS E2E TEST ---');

  const allConfigs = await prisma.industryConfig.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
  const seenIndustries = new Set<string>();
  const configs = [];
  for (const config of allConfigs) {
    if (!seenIndustries.has(config.industryName)) {
      seenIndustries.add(config.industryName);
      configs.push(config);
    }
  }

  for (const config of configs) {
    console.log(`\n========================================`);
    console.log(`Testing Config: ${config.industryName} (ID: ${config.id})`);
    console.log(`========================================\n`);

    const convs = conversations[config.industryName];
    if (!convs) {
      console.warn(`No test conversation defined for ${config.industryName}`);
      continue;
    }

    // Start Conversation
    const startRes = await fetch(`${API_URL}/conversations/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configId: config.id }),
    });
    
    if (!startRes.ok) {
      console.error(`Failed to start ${config.industryName}`);
      continue;
    }

    const { conversationId, sessionToken, greeting } = await startRes.json();
    console.log(`[AI] ${greeting}\n`);

    for (const msg of convs) {
      console.log(`[USER] ${msg}`);
      const res = await fetch(`${API_URL}/conversations/${conversationId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken, message: msg }),
      });

      if (!res.ok) {
        console.error(`Failed to send message: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.error(`Response: ${text}`);
        continue;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6);
            if (dataStr === '[DONE]') continue;
            try {
              const data = JSON.parse(dataStr);
              if (data.content) aiResponse += data.content;
            } catch (e) {}
          }
        }
      }
      console.log(`[AI] ${aiResponse}\n`);
    }

    console.log(`Waiting 15 seconds for async lead creation...`);
    await delay(15000);

    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { extractedData: true, lead: true },
    });

    if (!conv) {
      console.error('Conversation not found!');
      continue;
    }

    console.log(`\n--- DATABASE VERIFICATION for ${config.industryName} ---`);
    console.log(`Status: ${conv.status}`);
    console.log(`ExtractedData rows: ${conv.extractedData.length}`);
    for (const d of conv.extractedData) {
      console.log(`- ${d.fieldKey}: ${d.fieldValue} (Conf: ${d.confidence})`);
    }

    if (conv.lead) {
      console.log(`\nLead Created:`);
      console.log(`- Tier: ${conv.lead.tier}, Score: ${conv.lead.score}`);
      console.log(`- Summary: ${conv.lead.summary}`);
    } else {
      console.log(`\nNO LEAD FOUND!`);
    }

    console.log(`Waiting 5 seconds before testing next config...`);
    await delay(5000);
  }
}

runTest().catch(console.error).finally(() => prisma.$disconnect());
