# Ladeway

**AI-Powered Conversational Qualification Platform**

A multi-tenant, industry-agnostic SaaS platform that uses AI to qualify leads through natural conversation. Any business — logistics, real estate, insurance, legal — can configure an AI agent with a custom persona, define qualification fields, set scoring rules, and go live with a branded chat interface.

## Architecture

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS → Vercel
- **Backend:** NestJS + TypeScript → Railway (persistent server for SSE)
- **Database:** PostgreSQL via Supabase + Prisma ORM (Row-Level Security)
- **Cache:** Redis via Upstash
- **AI Inference:** Self-hosted Llama 3 via Ollama
- **Shared Types:** `packages/types` (shared between frontend and backend)

## Monorepo Structure

```
ladeway/
├── apps/
│   ├── web/        → Next.js 14 frontend
│   └── api/        → NestJS backend
├── packages/
│   └── types/      → Shared TypeScript interfaces
├── prisma/         → schema.prisma + seed.ts
├── turbo.json
└── package.json
```

## Getting Started

```bash
# Install dependencies
npm install

# Start both apps in development
npm run dev

# Type check all packages
npm run type-check

# Lint all packages
npm run lint
```

## Environment Variables

See `apps/api/.env.example` and `apps/web/.env.example` for required environment variables.

## License

Proprietary — Ladeway © 2026
