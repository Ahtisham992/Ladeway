import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runTests() {
  console.log('--- STARTING CONFIG CRUD E2E TESTS ---');

  // 0. Login as admin
  console.log('\n[0] Logging in as admin...');
  const loginRes = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@logicstics.com', password: 'password' })
  });
  if (!loginRes.ok) throw new Error(`Login failed: ${await loginRes.text()}`);
  const { access_token } = await loginRes.json();
  
  const headers = { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  };
  
  // 1. Setup - Create a temporary config for testing
  console.log('\n[1] Creating test config...');
  const createRes = await fetch('http://localhost:3001/industry-configs', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      industryName: 'Test Industry',
      personaName: 'Test Persona',
      personaRole: 'Tester',
      greeting: 'Hello test',
      tone: 'friendly',
      fieldsJson: [{ key: 'test_field', type: 'text', label: 'Test', required: true, extractionHint: 'test' }],
      scoringRulesJson: [],
      isActive: true
    })
  });
  
  if (!createRes.ok) throw new Error(`Create failed: ${await createRes.text()}`);
  const config = await createRes.json();
  let currentConfigId = config.id;
  console.log(`Created Config ID: ${currentConfigId}`);

  // 2. Setup - Create a dummy conversation to block deletion
  console.log('\n[2] Creating dummy conversation to block deletion...');
  const tenant = await prisma.tenant.findFirst();
  await prisma.conversation.create({
    data: {
      tenantId: tenant!.id,
      configId: currentConfigId,
      status: 'GREETING'
    }
  });

  // 3. Test DELETE with existing conversations -> 409 Conflict
  console.log('\n[3] Testing DELETE with existing conversations (Expecting 409)...');
  const deleteRes = await fetch(`http://localhost:3001/industry-configs/${currentConfigId}`, { method: 'DELETE', headers });
  if (deleteRes.status === 409) {
    console.log('SUCCESS: DELETE rejected with 409 Conflict.');
  } else {
    throw new Error(`DELETE failed: Expected 409, got ${deleteRes.status}`);
  }

  // 4. Test PUT with changed greeting -> updates in place, same ID
  console.log('\n[4] Testing PUT with only greeting changed (Expecting in-place update)...');
  const put1Res = await fetch(`http://localhost:3001/industry-configs/${currentConfigId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      personaName: 'Test Persona',
      personaRole: 'Tester',
      greeting: 'Hello changed test',
      tone: 'friendly'
    })
  });
  if (!put1Res.ok) throw new Error(`PUT1 failed: ${await put1Res.text()}`);
  const put1 = await put1Res.json();
  if (put1.versioned === false && put1.id === currentConfigId) {
    console.log('SUCCESS: Updated in place, ID unchanged.');
  } else {
    throw new Error(`PUT1 failed: Expected in-place update, got versioned=${put1.versioned}, ID=${put1.id}`);
  }

  // 5. Test PUT with changed fieldsJson -> creates new row, new ID
  console.log('\n[5] Testing PUT with fieldsJson changed (Expecting new version)...');
  const put2Res = await fetch(`http://localhost:3001/industry-configs/${currentConfigId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      personaName: 'Test Persona',
      personaRole: 'Tester',
      greeting: 'Hello changed test',
      tone: 'friendly',
      fieldsJson: [{ key: 'new_test_field', type: 'text', label: 'Test', required: true, extractionHint: 'test' }]
    })
  });
  if (!put2Res.ok) throw new Error(`PUT2 failed: ${await put2Res.text()}`);
  const put2 = await put2Res.json();
  if (put2.versioned === true && put2.id !== currentConfigId) {
    console.log(`SUCCESS: Created new version. New ID: ${put2.id}`);
    
    // Verify old config is inactive
    const oldConfig = await prisma.industryConfig.findUnique({ where: { id: currentConfigId } });
    if (oldConfig?.isActive === false) {
      console.log('SUCCESS: Old config deactivated.');
    } else {
      throw new Error('Old config was not deactivated.');
    }
    
    currentConfigId = put2.id;
  } else {
    throw new Error(`PUT2 failed: Expected new version, got versioned=${put2.versioned}, ID=${put2.id}`);
  }

  // 6. Test PATCH /status -> toggles isActive
  console.log('\n[6] Testing PATCH /status to deactivate...');
  const patchRes = await fetch(`http://localhost:3001/industry-configs/${currentConfigId}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ isActive: false })
  });
  if (!patchRes.ok) throw new Error(`PATCH failed: ${await patchRes.text()}`);
  const patchBody = await patchRes.json();
  if (patchBody.isActive === false) {
    console.log('SUCCESS: Config deactivated via PATCH.');
  } else {
    throw new Error('PATCH failed to deactivate config.');
  }

  // 7. Test POST /conversations/start with inactive config -> 404
  console.log('\n[7] Testing /conversations/start with inactive config (Expecting 404)...');
  const startRes = await fetch('http://localhost:3001/conversations/start', {
    method: 'POST',
    headers,
    body: JSON.stringify({ configId: currentConfigId })
  });
  if (startRes.status === 404) {
    console.log('SUCCESS: Start conversation rejected with 404.');
  } else {
    throw new Error(`START failed: Expected 404, got ${startRes.status}`);
  }

  // 8. Test GET /preview -> returns AI response, zero DB records
  console.log('\n[8] Testing GET /preview...');
  // Reactivate first for preview
  await fetch(`http://localhost:3001/industry-configs/${currentConfigId}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ isActive: true })
  });
  
  const initialConvCount = await prisma.conversation.count();
  
  const previewRes = await fetch(`http://localhost:3001/industry-configs/${currentConfigId}/preview?message=Hi+there`, { headers });
  const previewBody = await previewRes.json();
  
  if (previewBody.response && previewBody.configId === currentConfigId) {
    console.log(`SUCCESS: Received preview response: "${previewBody.response}"`);
  } else {
    throw new Error('Preview failed to return valid response.');
  }
  
  const finalConvCount = await prisma.conversation.count();
  if (initialConvCount === finalConvCount) {
    console.log('SUCCESS: Zero DB records created during preview.');
  } else {
    throw new Error('Preview created DB records unexpectedly!');
  }

  console.log('\n--- ALL TESTS PASSED SUCCESSFULLY ---');
  process.exit(0);
}

runTests().catch(err => {
  console.error('\nFAILURE:', err.message);
  process.exit(1);
});
