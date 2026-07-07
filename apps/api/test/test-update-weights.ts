import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const configs = await prisma.industryConfig.findMany();
  for (const config of configs) {
    if (config.industryName === 'Logistics / Moving') {
      await prisma.industryConfig.update({
        where: { id: config.id },
        data: {
          scoringRulesJson: [
            {
              field: 'timeline',
              condition: 'present',
              weight: 0.5,
              tier: 'HOT',
            },
          ]
        }
      });
      console.log('Updated Logistics config');
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
