import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runTest() {
  console.log('--- STARTING ESCALATION E2E TEST ---');
  
  const config = await prisma.industryConfig.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }
  });

  if (!config) {
    console.error('No active Logistics config found!');
    process.exit(1);
  }

  console.log(`Using Config ID: ${config.id}`);

  // 1. Start Conversation
  let response = await fetch(`http://localhost:3001/conversations/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ configId: config.id })
  });

  const startData = await response.json();
  const sessionToken = startData.sessionToken;
  console.log(`[AI] ${startData.greeting}\n`);

  // 2. Send Message 1
  const msg1 = "Hi, I need to move a small 1-bedroom apartment from NYC to Boston next week.";
  console.log(`[USER] ${msg1}`);
  
  response = await fetch(`http://localhost:3001/conversations/${startData.conversationId}/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sessionToken, message: msg1 })
  });

  if (!response.body) throw new Error('No response body');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let aiResponse1 = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
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

  // 3. Trigger Escalation
  const msg2 = "I'd rather talk to someone about this, can you transfer me?";
  console.log(`[USER] ${msg2}`);

  response = await fetch(`http://localhost:3001/conversations/${startData.conversationId}/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sessionToken, message: msg2 })
  });

  const reader2 = response.body!.getReader();
  let aiResponse2 = '';

  while (true) {
    const { done, value } = await reader2.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.substring(6);
        if (dataStr === '[DONE]') continue;
        try {
          const data = JSON.parse(dataStr);
          if (data.content) aiResponse2 += data.content;
          if (data.status) {
            console.log(`\nEvent done received. Status: ${data.status}`);
          }
        } catch (e) {}
      }
    }
  }
  
  console.log(`[AI] ${aiResponse2}\n`);

  console.log('Waiting 15 seconds for async extraction and lead creation...\n');
  await new Promise(r => setTimeout(r, 15000));

  // 4. Verify Database
  const conversation = await prisma.conversation.findUnique({
    where: { id: startData.conversationId },
    include: { extractedData: true, lead: true }
  });

  console.log(`--- FINAL DATABASE VERIFICATION ---`);
  console.log(`Status: ${conversation?.status}`);
  
  if (conversation?.extractedData && conversation.extractedData.length > 0) {
    console.log(`ExtractedData rows: ${conversation.extractedData.length}`);
    conversation.extractedData.forEach(d => {
      console.log(`- ${d.fieldKey}: ${d.fieldValue} (Conf: ${d.confidence})`);
    });
  } else {
    console.log('No data extracted.');
  }

  if (conversation?.lead) {
    console.log(`\nLead Created:`);
    console.log(`- Status: ${conversation.lead.status}`);
    console.log(`- Tier: ${conversation.lead.tier}, Score: ${conversation.lead.score}`);
    console.log(`- Summary: ${conversation.lead.summary}`);
  } else {
    console.log(`\nNO LEAD FOUND!`);
  }

  if (
    conversation?.status === 'TRANSFERRED' && 
    conversation?.lead?.status === 'TRANSFERRED' &&
    aiResponse2.includes("I've noted your request to speak with a team member")
  ) {
    console.log('\nSUCCESS! Escalation test passed.');
  } else {
    console.error('\nFAILURE! Conversation did not escalate correctly.');
    process.exit(1);
  }
}

runTest().catch(console.error);
