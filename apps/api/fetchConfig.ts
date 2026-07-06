import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const config = await prisma.industryConfig.findFirst({
    where: { industryName: 'Logistics / Moving' }
  });
  console.log('CONFIG_ID=' + config?.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
