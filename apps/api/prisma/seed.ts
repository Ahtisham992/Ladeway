import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Create test tenant
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'logicstics' },
    update: {},
    create: {
      name: 'Logicstics',
      subdomain: 'logicstics',
      plan: 'enterprise',
    },
  });

  // Create test admin user
  await prisma.user.upsert({
    where: { email: 'admin@logicstics.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Neal Elbaum',
      email: 'admin@logicstics.com',
      role: 'ADMIN',
      // In production, this must be a bcrypt hash. For seed purposes, a dummy hash is used.
      passwordHash: '$2b$12$A8l8I3/q/5E/N3G1z4v5Y.H8Hw4e6y8G2G/1r2w3q4e5t6y7u8i9o',
    },
  });

  // Logistics Config
  await prisma.industryConfig.create({
    data: {
      tenantId: tenant.id,
      industryName: 'Logistics / Moving',
      personaName: 'Alexandra',
      personaRole: 'Logistics Coordinator',
      greeting: "Hi there! I'm Alexandra with Logicstics. I can help you get an accurate quote for your move. To start, are you moving a home or an office?",
      tone: 'professional',
      fieldsJson: [
        {
          key: 'move_type',
          label: 'Move Type',
          type: 'enum',
          required: true,
          options: ['residential', 'commercial'],
          extractionHint: 'Whether the move is for a home (residential) or office (commercial)',
        },
        {
          key: 'origin',
          label: 'Origin',
          type: 'text',
          required: true,
          extractionHint: 'The city and state/country they are moving from',
        },
        {
          key: 'destination',
          label: 'Destination',
          type: 'text',
          required: true,
          extractionHint: 'The city and state/country they are moving to',
        },
        {
          key: 'timeline',
          label: 'Timeline',
          type: 'text',
          required: true,
          extractionHint: 'When they want to move (e.g., next month, specific date, flexible)',
        },
        {
          key: 'cargo',
          label: 'Cargo Description',
          type: 'text',
          required: true,
          extractionHint: 'Roughly how much they are moving (e.g., 3 bedroom house, a few boxes)',
        },
      ],
      scoringRulesJson: [
        {
          field: 'timeline',
          condition: 'present',
          weight: 50,
          tier: 'HOT',
        },
      ],
    },
  });

  // Real Estate Config
  await prisma.industryConfig.create({
    data: {
      tenantId: tenant.id,
      industryName: 'Real Estate',
      personaName: 'James',
      personaRole: 'Property Advisor',
      greeting: "Hello! I'm James, a property advisor. I can help you find your next home. Are you currently looking to buy or rent?",
      tone: 'friendly',
      fieldsJson: [
        {
          key: 'transaction_type',
          label: 'Transaction Type',
          type: 'enum',
          required: true,
          options: ['buy', 'rent'],
          extractionHint: 'Whether they want to buy or rent',
        },
        {
          key: 'property_type',
          label: 'Property Type',
          type: 'text',
          required: true,
          extractionHint: 'Type of property (e.g., apartment, house, condo)',
        },
        {
          key: 'budget',
          label: 'Budget Range',
          type: 'text',
          required: true,
          extractionHint: 'Their maximum budget or price range',
        },
        {
          key: 'location',
          label: 'Preferred Location',
          type: 'text',
          required: true,
          extractionHint: 'Neighborhood, city, or area they want to live in',
        },
      ],
      scoringRulesJson: [
        {
          field: 'transaction_type',
          condition: 'equals',
          value: 'buy',
          weight: 60,
        },
      ],
    },
  });

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
