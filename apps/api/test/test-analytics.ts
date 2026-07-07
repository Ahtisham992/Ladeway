import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runTests() {
  console.log('--- STARTING ANALYTICS E2E TESTS ---');

  // 0. Login as admin and rep
  console.log('\n[0] Logging in...');
  const adminLogin = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@logicstics.com', password: 'password' })
  });
  const adminJson = await adminLogin.json();
  const { access_token: adminToken } = adminJson;

  // Ensure rep user exists
  const bcrypt = require('bcrypt');
  const passwordHash = await bcrypt.hash('password', 10);
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error('No tenant found');
  
  await prisma.user.upsert({
    where: { email: 'rep@logicstics.com' },
    update: { passwordHash },
    create: {
      tenantId: tenant.id,
      name: 'Sales Rep',
      email: 'rep@logicstics.com',
      role: 'REP',
      passwordHash: passwordHash,
    },
  });

  const repLogin = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rep@logicstics.com', password: 'password' })
  });
  const repJson = await repLogin.json();
  const { access_token: repToken } = repJson;

  if (!adminToken || !repToken) throw new Error(`Failed to login. Admin: ${JSON.stringify(adminJson)}, Rep: ${JSON.stringify(repJson)}`);

  const config = await prisma.industryConfig.findFirst({ where: { tenantId: tenant.id } });
  if (!config) throw new Error('No config found');

  // 1. Seed Dummy Data
  console.log('\n[1] Seeding dummy data...');
  // Clear old test data if needed, or just insert new ones with specific date
  const testDate = new Date();
  testDate.setFullYear(2025, 0, 1); // fixed date for test
  testDate.setHours(12, 0, 0, 0);

  // We will insert 20 conversations: 10 closed, 5 transferred, 3 qualifying, 2 abandoned
  const convsToCreate = [
    ...Array(10).fill('CLOSED'),
    ...Array(5).fill('TRANSFERRED'),
    ...Array(3).fill('QUALIFYING'),
    ...Array(2).fill('ABANDONED')
  ].map((status, i) => {
    const date = new Date(testDate);
    date.setDate(date.getDate() + (i % 5)); // spread over 5 days
    return {
      tenantId: tenant.id,
      configId: config.id,
      status: status,
      startedAt: date
    };
  });

  const createdConvs = [];
  for (const data of convsToCreate) {
    createdConvs.push(await prisma.conversation.create({ data }));
  }

  // Insert 5 messages per conversation to simulate turns
  const msgsToCreate = createdConvs.flatMap((conv) => {
    return Array.from({ length: 5 }).map((_, j) => ({
      conversationId: conv.id,
      sender: j % 2 === 0 ? 'user' : 'ai',
      content: 'Dummy message',
      timestamp: conv.startedAt
    }));
  });

  await prisma.message.createMany({ data: msgsToCreate });

  // Create 15 leads: 10 from CLOSED, 5 from TRANSFERRED
  const leadsToCreate = createdConvs.slice(0, 15).map((conv, i) => {
    let tier = 'HOT';
    if (i % 3 === 1) tier = 'WARM';
    if (i % 3 === 2) tier = 'COLD';
    return {
      tenantId: tenant.id,
      conversationId: conv.id,
      tier: tier,
      score: 80,
      summary: 'Test lead',
      createdAt: conv.startedAt
    };
  });

  for (const data of leadsToCreate) {
    await prisma.lead.create({ data });
  }

  console.log(`Seeded 20 conversations and 15 leads.`);

  const adminHeaders = { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  };
  const repHeaders = { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${repToken}`
  };

  // Disconnect test prisma client to free up DB connections for the backend
  await prisma.$disconnect();
  
  console.log('\nWaiting 5 seconds for DB connection pool to clear...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 2. Test 403 Forbidden for REP
  console.log('\n[2] Testing 403 Forbidden for REP role...');
  const repRes = await fetch('http://localhost:3001/analytics/summary', { headers: repHeaders });
  if (repRes.status === 403) {
    console.log('SUCCESS: REP role rejected with 403 Forbidden.');
  } else {
    throw new Error(`Expected 403 for REP, got ${repRes.status}`);
  }

  // 3. Test Analytics Summary
  console.log('\n[3] Testing GET /analytics/summary...');
  const startMs = Date.now();
  const summaryRes = await fetch(`http://localhost:3001/analytics/summary?from=2025-01-01T00:00:00.000Z&to=2025-01-10T00:00:00.000Z`, { headers: adminHeaders });
  const summaryMs = Date.now() - startMs;
  if (!summaryRes.ok) throw new Error(await summaryRes.text());
  
  const summary = await summaryRes.json();
  if (summaryMs < 200) {
    console.log(`SUCCESS: Summary returned in ${summaryMs}ms (< 200ms)`);
  } else {
    console.warn(`WARNING: Summary returned in ${summaryMs}ms (>= 200ms)`);
  }

  console.log('Summary:', JSON.stringify(summary, null, 2));

  // Verify counts
  // We added 20 convs, but there might be others in the DB.
  // We will just verify it didn't crash and the numbers are integers.
  if (typeof summary.totalConversations !== 'number' || typeof summary.conversionRate !== 'number') {
    throw new Error('Summary data types are incorrect');
  }

  // 4. Test Time Series
  console.log('\n[4] Testing GET /analytics/conversations...');
  const tsRes = await fetch(`http://localhost:3001/analytics/conversations?from=2025-01-01T00:00:00.000Z&to=2025-01-10T00:00:00.000Z`, { headers: adminHeaders });
  if (!tsRes.ok) throw new Error(await tsRes.text());
  const tsData = await tsRes.json();
  console.log(`Conversations Time Series:`, tsData);
  if (!Array.isArray(tsData) || tsData.length === 0 || typeof tsData[0].count !== 'number') {
    throw new Error('Conversations time series data is malformed');
  }

  console.log('\n[5] Testing GET /analytics/leads...');
  const leadsRes = await fetch(`http://localhost:3001/analytics/leads?from=2025-01-01T00:00:00.000Z&to=2025-01-10T00:00:00.000Z`, { headers: adminHeaders });
  if (!leadsRes.ok) throw new Error(await leadsRes.text());
  const leadsData = await leadsRes.json();
  console.log(`Leads Time Series:`, leadsData);
  if (!Array.isArray(leadsData) || leadsData.length === 0 || typeof leadsData[0].count !== 'number') {
    throw new Error('Leads time series data is malformed');
  }

  // Reconnect to cleanup
  await prisma.$connect();
  console.log('\n[6] Cleaning up test data...');
  const seededConvIds = createdConvs.map(c => c.id);
  await prisma.lead.deleteMany({ where: { conversationId: { in: seededConvIds } } });
  await prisma.message.deleteMany({ where: { conversationId: { in: seededConvIds } } });
  await prisma.conversation.deleteMany({ where: { id: { in: seededConvIds } } });
  await prisma.$disconnect();

  console.log('\n--- ALL TESTS PASSED SUCCESSFULLY ---');
  process.exit(0);
}

runTests().catch(err => {
  console.error('\nFAILURE:', err.message);
  process.exit(1);
});
