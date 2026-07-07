import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
async function main() {
  const leads = await prisma.lead.findMany({ include: { conversation: { include: { config: true } } } });
  for (const lead of leads) {
    console.log(`Lead: ${lead.contactName}, Tier: ${lead.tier}, Score: ${lead.score}, Industry: ${(lead.conversation as any).config.industryName}, Summary: ${lead.summary}`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
