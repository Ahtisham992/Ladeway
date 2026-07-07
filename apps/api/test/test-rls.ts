import 'dotenv/config';
import { PrismaService } from '../src/database/prisma.service';
import { tenantContext } from '../src/tenant/tenant.context';
import * as assert from 'assert';

async function run() {
  console.log('Testing Tenant Isolation (RLS)...');
  const prisma = new PrismaService();
  
  const tenantA = await prisma.tenant.create({
    data: { name: 'Tenant A', subdomain: 'a' }
  });
  const tenantAId = tenantA.id;

  const tenantB = await prisma.tenant.create({
    data: { name: 'Tenant B', subdomain: 'b' }
  });
  const tenantBId = tenantB.id;

  try {
    // Create data for Tenant A within Tenant A context
    await tenantContext.run(tenantAId, async () => {
      await prisma.industryConfig.create({
        data: {
          tenantId: tenantAId,
          industryName: 'Logistics',
          personaName: 'Agent A',
          personaRole: 'Sales',
          greeting: 'Hello A',
          tone: 'professional',
          fieldsJson: [],
          scoringRulesJson: []
        }
      });
    });

    // Create data for Tenant B within Tenant B context
    await tenantContext.run(tenantBId, async () => {
      await prisma.industryConfig.create({
        data: {
          tenantId: tenantBId,
          industryName: 'Real Estate',
          personaName: 'Agent B',
          personaRole: 'Sales',
          greeting: 'Hello B',
          tone: 'friendly',
          fieldsJson: [],
          scoringRulesJson: []
        }
      });
    });

    // Test Tenant A Context
    await tenantContext.run(tenantAId, async () => {
      const configs = await prisma.industryConfig.findMany({
        where: { tenantId: { in: [tenantAId, tenantBId] } }
      });
      assert.strictEqual(configs.length, 1);
      assert.strictEqual(configs[0].tenantId, tenantAId);
      console.log('✅ Context A only returned A data');
    });

    // Test Tenant B Context
    await tenantContext.run(tenantBId, async () => {
      const configs = await prisma.industryConfig.findMany({
        where: { tenantId: { in: [tenantAId, tenantBId] } }
      });
      assert.strictEqual(configs.length, 1);
      assert.strictEqual(configs[0].tenantId, tenantBId);
      console.log('✅ Context B only returned B data');
    });

    // Test No Context (RLS should block it!)
    // When no context is set, `app.current_tenant_id` is either empty or not set.
    // The policy checks `"tenantId" = current_setting('app.current_tenant_id', true)`
    const configs = await prisma.industryConfig.findMany({
        where: { tenantId: { in: [tenantAId, tenantBId] } }
    });
    assert.strictEqual(configs.length, 0);
    console.log('✅ No Context returned 0 rows! RLS works.');
    
  } finally {
    // Cleanup
    await tenantContext.run(tenantAId, async () => {
        await prisma.industryConfig.deleteMany({ where: { tenantId: tenantAId } });
    });
    await tenantContext.run(tenantBId, async () => {
        await prisma.industryConfig.deleteMany({ where: { tenantId: tenantBId } });
    });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantAId, tenantBId] } } });
    console.log('Cleanup completed.');
  }
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
