import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  const pool = new Pool({ connectionString: "postgresql://postgres.hescxdfzlyzhqcykckmq:ladeway*2005@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres" });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  const configs = await prisma.industryConfig.findMany({
    orderBy: { createdAt: 'desc' }
  });

  console.log(`There are ${configs.length} total configs.`);
  configs.forEach(c => console.log(`${c.id}: ${c.industryName} (active: ${c.isActive})`));

  await prisma.$disconnect();
}

main().catch(console.error);
