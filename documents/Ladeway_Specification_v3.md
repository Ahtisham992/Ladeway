# LADEWAY
## AI-Powered Conversational Qualification Platform
### Comprehensive Project Specification — v3 (Proper Frontend / Backend Architecture)
*Prepared by Muhammad Ahtisham · Architecture Exercise · For Logicstics · Neal Elbaum*

> **The name:** "Lading" is the oldest word in commercial shipping — a bill of lading records what is moving and where since the earliest days of freight. Ladeway captures that same structured information through conversation, for any industry, before a deal even exists.

---

## Table of Contents

1. Executive Summary
2. Confirmed Brief — What Neal Said & What It Means
3. Product Vision & Positioning
4. Core Modules — Full Feature Breakdown
5. Industry-Agnostic Design — The Central Architectural Decision
6. System Architecture (Full Stack — Frontend + Backend)
7. Frontend Architecture (Next.js 14)
8. Backend Architecture (NestJS)
9. The AI Conversation Engine — Deep Dive
10. Prompt Engineering Architecture
11. Data Model — Full Schema
12. Technology Stack & Justification
13. API Design
14. Security & Multi-Tenancy
15. Non-Functional Requirements
16. Design System & UI Direction
17. Monorepo Folder Structure
18. Deployment Architecture
19. How This Maps Directly to the Brief

---

## 1. Executive Summary

Ladeway is a **multi-tenant, industry-agnostic AI conversational qualification platform**. Any business — logistics, real estate, insurance, legal, healthcare — can configure an AI agent with a custom persona, define the fields it needs to extract from a conversation, set its own scoring rules, and go live with a branded chat interface. The AI conducts a natural conversation with a prospective customer, extracts structured data from that conversation, scores the lead, and surfaces it to the sales team in a clean dashboard.

The platform is engineered as a production-grade, full-stack SaaS product from the first line of code:
- A **Next.js 14** frontend handling all customer-facing and internal UI surfaces
- A **NestJS** backend providing a structured, modular REST + SSE API
- A **PostgreSQL** database with Row-Level Security enforcing multi-tenant isolation at the database layer
- A **self-hosted Llama 3** model (Oracle Cloud, already live) providing zero-cost AI inference behind a provider-agnostic router

Logicstics is the first tenant and design partner. The architecture is built for many tenants from the first migration.

---

## 2. Confirmed Brief — What Neal Said & What It Means

| What Neal Said | Architectural Implication |
|---|---|
| "Not specifically for moving/logistics — want to sell to other industries" | `IndustryConfig` is a first-class database entity. Every qualification field, persona, tone, and scoring rule is data — not code. Zero industry-specific logic in the engine |
| "Ability to tailor to other industries" | A non-developer admin can create a new industry config through the console UI without touching code or deploying anything |
| "Chat/conversational interface on the web" | Natural multi-turn conversation via a clean, embeddable chat widget. One question at a time. No form-like rigidity |
| "AI that functions the way it should" | Conversation quality is the primary evaluation criterion — natural flow, intelligent follow-up, accurate structured extraction |
| "Not looking for a working product" | Architecture is production-grade throughout. Feature completeness is scoped to the core qualification engine for this exercise |
| "At least the voice/chat functionality" | Chat is the primary deliverable. The backend architecture separates voice as a future channel layer — it can be added without rebuilding the engine |

---

## 3. Product Vision & Positioning

### 3.1 The Problem

Every business receives inbound inquiries where a prospective customer sends a vague message, fills out a generic contact form, or calls and says "I'm interested." Before a sales rep can do anything useful, they need to qualify the lead — understand what exactly the customer needs, their timeline, budget, and intent. This qualification step is:

- Repetitive — the same 5-6 questions, every time, for every inquiry
- Slow — email back-and-forth takes hours or days
- Inconsistent — different reps ask different questions in different orders
- Unscalable — as inquiry volume grows, qualification labour grows with it

### 3.2 The Solution

Ladeway replaces the blank contact form with an AI conversation. The customer types naturally; the AI listens, asks smart follow-up questions based on what it still needs to know, and by the end of the conversation has extracted every piece of information the sales team needs to qualify and prioritise the lead. The output is not a raw transcript — it is a structured, scored, summarised lead record, ready to act on immediately.

### 3.3 Why Industry-Agnostic Is the Moat

Most AI qualification tools are built for one vertical. Ladeway's competitive position is the configuration layer — the same underlying engine serves any industry because the qualification fields, AI persona, scoring rules, and tone are all data, not code. A logistics company and a real estate brokerage and an insurance agency run on the same engine, configured differently, paying for the same subscription tier.

---

## 4. Core Modules — Full Feature Breakdown

### 4.1 Conversational AI Qualification Engine
The heart of the platform. An AI agent conducts a natural, multi-turn conversation, continuously assessing what information is still missing, and asking appropriate follow-up questions until all required fields are captured. The conversation does not feel like a form — it feels like a knowledgeable professional assistant.

### 4.2 Industry Configuration System
A complete industry configuration lives in a database record. It defines the AI's persona and role, required qualification fields and their types, conversational tone, greeting, and scoring model. A new industry is a new database record — not a new deployment, not a code change.

### 4.3 Structured Data Extraction Engine
A dedicated extraction step at the end of a conversation parses the full transcript and produces clean, typed, structured data. Extracted fields map directly to what was defined in the industry configuration. This is a second, smaller LLM call — separate from the conversation engine — so extraction logic is clean, testable, and independent.

### 4.4 Lead Scoring Engine
A configurable rule evaluator that assesses extracted data against scoring rules defined in the industry config and produces a tier (Hot / Warm / Cold) and a numeric confidence score. The scoring engine has no industry-specific logic — rules from the config fully determine the score.

### 4.5 Embeddable Chat Widget
A production-quality, embeddable JavaScript widget deployable on any website via a single script tag. Themed with the tenant's brand colours and persona name. Fully responsive and mobile-first.

### 4.6 Admin Configuration Console
A non-technical UI where a business operator creates and manages industry configurations: persona, fields, tone, greeting, scoring rules, and preview — without touching code.

### 4.7 Sales Rep Dashboard
A CRM-style interface where reps view qualified leads, access full conversation transcripts, manage pipeline status, and track performance.

### 4.8 Multi-Tenant SaaS Architecture
Complete data isolation between tenants at the database layer. Each company's conversations, leads, and configs are invisible to every other company — enforced in the database via Row-Level Security, not just application code.

### 4.9 Analytics & Reporting
Company-wide metrics: conversation volume, conversion rate, lead tier distribution, average conversation length. Exportable reports for leadership review.

---

## 5. Industry-Agnostic Design — The Central Architectural Decision

This is the most important decision in the entire system. It is what turns a one-company tool into a sellable SaaS product.

### 5.1 The Wrong Approach

```typescript
// ❌ Hardcoded — cannot be sold to other industries
const SYSTEM_PROMPT = `You are a logistics assistant qualifying moving inquiries.
Ask about: origin, destination, move type, cargo, timeline.`;

const REQUIRED_FIELDS = ['origin', 'destination', 'move_type', 'cargo', 'timeline'];
```

This requires a new deployment for every new industry. It is not a SaaS product.

### 5.2 The Right Approach — Configuration as Data

```typescript
// ✅ Industry-agnostic — engine reads everything from config at runtime
interface IndustryConfig {
  id: string;
  tenantId: string;
  industryName: string;
  personaName: string;         // "Alexandra" vs "James"
  personaRole: string;         // "Logistics Coordinator" vs "Property Advisor"
  greeting: string;
  tone: 'professional' | 'friendly' | 'formal';
  qualificationFields: QualificationField[];
  scoringRules: ScoringRule[];
}

interface QualificationField {
  key: string;            // "origin" | "property_type" | "coverage_amount"
  label: string;          // "Origin City" | "Property Type" | "Coverage Amount"
  type: 'text' | 'number' | 'date' | 'enum';
  required: boolean;
  options?: string[];     // For enum fields
  extractionHint: string; // Guides the extractor: "city the customer is moving from"
}

interface ScoringRule {
  field: string;
  condition: 'present' | 'equals' | 'greater_than' | 'less_than' | 'in';
  value?: string | number | string[];
  weight: number;
  tier?: 'HOT' | 'WARM' | 'COLD'; // Override tier if this rule fires
}
```

With this design, adding support for a new industry means inserting a new `IndustryConfig` row. The AI engine, extraction pipeline, and scoring engine are completely industry-agnostic at the code level.

### 5.3 Two-Industry Demo

To demonstrate this concretely in the prototype:

**Config 1 — Logistics (Logicstics)**
- Persona: "Alexandra, Logistics Coordinator at Logicstics"
- Fields: origin city, destination country, move type (residential/commercial), cargo description, preferred timeline
- Scoring: Hot = international + within 30 days; Warm = flexible timeline; Cold = incomplete

**Config 2 — Real Estate**
- Persona: "James, Property Advisor"
- Fields: property type, location preference, budget range, purchase timeline, pre-approval status
- Scoring: Hot = pre-approved + within 60 days; Warm = actively browsing; Cold = exploratory

Same codebase. Same engine. Same extraction pipeline. Same scoring logic. Zero conditional industry code.

---

## 6. System Architecture (Full Stack)

![System Architecture](diagrams_v4/arch.png)

*Figure 1 — Full System Architecture: Next.js Frontend + NestJS Backend*

### 6.1 Why a Separate Backend — Not Just Next.js API Routes

This is a deliberate architectural decision, not a default choice:

| Concern | Next.js API Routes | NestJS Backend |
|---|---|---|
| Serverless timeouts | 10-second max on Vercel — breaks mid-stream AI responses | Persistent server process — no timeout limit |
| SSE / Streaming | Unreliable on serverless | Native, reliable persistent connections |
| Module structure | Flat files — no enforced architecture | Enforced module/service/controller pattern |
| Scalability | Each route scales independently as a function | Services scale as units of related logic |
| Background jobs | Not possible in serverless | Native support |
| Code organisation | Hard to maintain at scale | Dependency injection, clear boundaries |

The NestJS backend is the right choice for a platform where the core feature — streaming AI responses over SSE — requires a persistent server process.

### 6.2 Layer Descriptions

**Client Layer** — every human-facing surface: embeddable chat widget, demo landing page, sales rep dashboard, admin configuration console.

**Frontend (Next.js 14 — Vercel)** — handles all UI rendering, client-side state, and acts as a thin proxy to the backend for authenticated requests. Does not contain business logic.

**Backend (NestJS — Railway)** — owns all business logic. Structured into NestJS modules (see Section 8). Exposes a REST + SSE API. All database access goes through this layer.

**AI / Intelligence Layer** — four components living inside the NestJS AIModule: LLM Router, Prompt Engineering Layer, Structured Data Extractor, Lead Scoring Engine.

**Data Layer** — PostgreSQL on Supabase (system of record, with RLS); Redis on Upstash (real-time conversation state).

---

## 7. Frontend Architecture (Next.js 14)

### 7.1 Responsibilities
The frontend is deliberately thin — it renders UI and manages client-side state. It does not contain qualification logic, AI calls, or database queries.

### 7.2 Route Structure

```
app/
├── page.tsx                        → Demo landing page (two industry demos)
├── chat/[configId]/page.tsx        → Standalone chat page (embeddable)
├── login/page.tsx                  → Sales rep / admin login
├── dashboard/
│   ├── layout.tsx                  → Auth-protected layout
│   ├── page.tsx                    → Lead pipeline view
│   ├── leads/[id]/page.tsx         → Lead detail + transcript
│   └── analytics/page.tsx         → Performance metrics
└── admin/
    ├── configs/page.tsx            → Industry config list
    └── configs/[id]/page.tsx       → Config editor + preview
```

### 7.3 Key Frontend Decisions

**Server Components for data-heavy views.** The lead dashboard and analytics pages use React Server Components — data is fetched on the server, no client-side waterfall, fast initial load.

**Client Components for interactive surfaces.** The chat widget and config editor are Client Components — they need real-time interactivity and SSE consumption.

**SSE consumption.** The chat widget uses the browser's native `EventSource` API to consume the streaming AI response from the NestJS backend token by token.

**No business logic in the frontend.** All qualification logic, prompt assembly, and scoring live exclusively in the NestJS backend. The frontend sends messages and renders responses — nothing more.

---

## 8. Backend Architecture (NestJS)

![NestJS Module Structure](diagrams_v4/nestmodules.png)

*Figure 2 — NestJS Module Architecture*

### 8.1 Module Breakdown

**AppModule** — root module, imports all feature modules, configures global middleware.

**AuthModule** — JWT strategy, guards, and decorators. Issues tokens containing `{ userId, tenantId, role }`. Every protected controller uses the `@UseGuards(JwtAuthGuard)` decorator.

**TenantModule** — tenant registration, subdomain resolution, and the Prisma RLS middleware that sets `app.current_tenant_id` on every database connection.

**ConfigModule (IndustryConfig)** — CRUD for IndustryConfig records. Validates the `fields_json` and `scoring_rules_json` arrays against Zod schemas at write time — never at query time.

**ConversationModule** — the most complex module. Manages conversation lifecycle, session state in Redis, message persistence, and SSE streaming. Orchestrates calls to AIModule and QualificationModule.

**AIModule** — three services:
- `LLMRouterService` — provider-agnostic LLM interface
- `PromptService` — assembles system prompts from IndustryConfig + conversation state
- `ExtractorService` — extracts structured JSON from conversation transcripts

**QualificationModule** — two services:
- `QualificationEngineService` — state machine controlling conversation lifecycle
- `ScoringService` — evaluates extracted data against scoring rules

**LeadModule** — CRUD for Lead and LeadAssignment records. Pipeline status management.

**AnalyticsModule** — aggregation queries producing dashboard metrics.

**DatabaseModule** — Prisma client singleton with the RLS middleware applied globally.

**CacheModule** — Redis client wrapper (Upstash) with typed get/set helpers for conversation state.

### 8.2 Request Lifecycle

```
HTTP Request
    → Global middleware (logging, CORS)
    → JwtAuthGuard (validates token, attaches { userId, tenantId, role } to request)
    → TenantMiddleware (sets app.current_tenant_id on DB connection → triggers RLS)
    → Controller (routes to correct service method)
    → Service (business logic)
    → PrismaService (database query — automatically scoped by RLS)
    → Response
```

---

## 9. The AI Conversation Engine — Deep Dive

![Conversation Flow](diagrams_v4/convflow.png)

*Figure 3 — End-to-End Conversation Flow (NestJS Backend)*

### 9.1 Conversation State Machine

```typescript
enum ConversationStatus {
  GREETING    = 'GREETING',    // Session started, greeting sent
  QUALIFYING  = 'QUALIFYING',  // Actively gathering required fields
  EXTRACTING  = 'EXTRACTING',  // All fields captured — running extraction
  SCORED      = 'SCORED',      // Lead created and scored
  CLOSED      = 'CLOSED',      // Conversation complete
  TRANSFERRED = 'TRANSFERRED', // Customer requested human
  ABANDONED   = 'ABANDONED',   // Inactivity timeout
}
```

### 9.2 The Qualification Loop (Per Turn)

1. `POST /conversations/:id/message` received
2. `ConversationModule` validates sessionToken, loads state from Redis
3. `QualificationEngineService.getNextAction()` determines: which fields are still missing?
4. `PromptService.assemble()` builds the full prompt
5. `LLMRouterService.stream()` sends to Ollama, returns `AsyncIterable<string>`
6. `ConversationController` streams tokens back to client via SSE
7. On stream completion: persist both messages to PostgreSQL, update Redis state
8. `QualificationEngineService` re-evaluates: all required fields present in conversation?
9. If no → await next message
10. If yes → trigger `ExtractorService.extract()` → `ScoringService.score()` → create Lead

### 9.3 What Makes the Conversation Feel Natural

**One question per turn.** The system prompt explicitly instructs the model: ask exactly one question per response, even when multiple fields are still missing. Asking several questions at once is a form, not a conversation.

**Acknowledge before asking.** The prompt instructs the model to briefly acknowledge what it just learned before asking the next question. This is a prompted behaviour, not implicit.

**No repetition.** The current field capture state is injected into every prompt: "Fields already captured: origin=New York, destination=London. Fields still needed: move_type, cargo." The model never asks for information it already has.

**Graceful escalation.** Intent detection for "I want to speak to a person" triggers an immediate `TRANSFERRED` state transition with a warm closing message — no robotic loop.

---

## 10. Prompt Engineering Architecture

![Prompt Engineering Architecture](diagrams_v4/promptarch.png)

*Figure 4 — Prompt Assembly & Extraction Flow*

### 10.1 System Prompt Template (Assembled Dynamically)

```
You are {personaName}, {personaRole}.

Your goal is to qualify a prospective customer's inquiry through a natural,
{tone} conversation. You need to gather the following information:

REQUIRED FIELDS:
{qualificationFields.map(f => `- ${f.label}: ${f.extractionHint}`).join('\n')}

CONVERSATION RULES:
- Ask exactly ONE question per response. Never ask multiple questions.
- Briefly acknowledge what the customer just told you before asking your next question.
- If asked a question about your services, answer it helpfully, then return to qualification.
- If the customer asks to speak with a human, acknowledge warmly and close the conversation.
- Never reveal that you are an AI unless directly asked.
- Do not ask for information already captured below.

CURRENT CAPTURE STATE:
{capturedFields.map(f => `✓ ${f.label}: ${f.value}`).join('\n')}

STILL NEEDED:
{missingFields.map(f => `○ ${f.label}`).join('\n')}

When all required fields are captured, thank the customer warmly and confirm
that a member of the team will be in touch.
```

### 10.2 Extraction Prompt (Separate LLM Call)

```
Extract the following fields from this conversation transcript.
Return ONLY a valid JSON object. No explanation. No markdown.
If a field is not present in the conversation, return null for that field.

Fields to extract:
{qualificationFields.map(f =>
  `"${f.key}": ${f.type} — ${f.label} (hint: ${f.extractionHint})`
).join('\n')}

Conversation transcript:
{messages.map(m => `${m.sender.toUpperCase()}: ${m.content}`).join('\n')}
```

### 10.3 Why Two Separate LLM Calls

The conversation call and the extraction call have fundamentally different jobs:
- The **conversation call** must sound natural, acknowledge the customer, ask good questions — creative and contextual
- The **extraction call** must output precise, parseable JSON — deterministic and structured

Combining these into one call produces worse results on both axes. Separation of concerns applies to prompting, not just code.

---

## 11. Data Model — Full Schema

![Entity Relationship Diagram](diagrams_v4/er.png)

*Figure 5 — Full Entity Relationship Diagram*

### 11.1 Complete Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Tenant {
  id            String           @id @default(cuid())
  name          String
  subdomain     String           @unique
  plan          String           @default("starter")
  apiKey        String           @unique @default(cuid())
  createdAt     DateTime         @default(now())
  users         User[]
  configs       IndustryConfig[]
  conversations Conversation[]
  leads         Lead[]
}

model IndustryConfig {
  id               String         @id @default(cuid())
  tenantId         String
  tenant           Tenant         @relation(fields: [tenantId], references: [id])
  industryName     String
  personaName      String
  personaRole      String
  greeting         String
  tone             String         @default("professional")
  fieldsJson       Json           // QualificationField[]
  scoringRulesJson Json           // ScoringRule[]
  isActive         Boolean        @default(true)
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  conversations    Conversation[]

  @@index([tenantId])
}

model User {
  id           String           @id @default(cuid())
  tenantId     String
  tenant       Tenant           @relation(fields: [tenantId], references: [id])
  name         String
  email        String           @unique
  role         String           @default("REP")  // ADMIN | REP
  passwordHash String
  lastLogin    DateTime?
  assignments  LeadAssignment[]

  @@index([tenantId])
}

model Conversation {
  id            String          @id @default(cuid())
  tenantId      String
  tenant        Tenant          @relation(fields: [tenantId], references: [id])
  configId      String
  config        IndustryConfig  @relation(fields: [configId], references: [id])
  sessionToken  String          @unique @default(cuid())
  status        String          @default("GREETING")
  channel       String          @default("chat")
  startedAt     DateTime        @default(now())
  completedAt   DateTime?
  messages      Message[]
  extractedData ExtractedData[]
  lead          Lead?

  @@index([tenantId])
  @@index([configId])
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender         String       // 'user' | 'ai'
  content        String
  tokenCount     Int?
  timestamp      DateTime     @default(now())

  @@index([conversationId])
}

model ExtractedData {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  fieldKey       String
  fieldValue     String?
  confidence     Float
  extractedAt    DateTime     @default(now())

  @@index([conversationId])
}

model Lead {
  id             String           @id @default(cuid())
  conversationId String           @unique
  conversation   Conversation     @relation(fields: [conversationId], references: [id])
  tenantId       String
  tenant         Tenant           @relation(fields: [tenantId], references: [id])
  contactName    String?
  contactEmail   String?
  contactPhone   String?
  score          Float
  tier           String           // 'HOT' | 'WARM' | 'COLD'
  status         String           @default("NEW")
  summary        String
  createdAt      DateTime         @default(now())
  assignments    LeadAssignment[]

  @@index([tenantId])
  @@index([tier])
  @@index([status])
}

model LeadAssignment {
  id         String   @id @default(cuid())
  leadId     String
  lead       Lead     @relation(fields: [leadId], references: [id])
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  assignedAt DateTime @default(now())
  notes      String?
  status     String   @default("ACTIVE")

  @@index([leadId])
  @@index([userId])
}
```

### 11.2 Row-Level Security (PostgreSQL)

```sql
-- Applied to every tenant-scoped table
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON conversations
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Repeated for: industry_configs, users, leads, messages,
-- extracted_data, lead_assignments
```

The NestJS `TenantMiddleware` sets `app.current_tenant_id` on every database connection before any query executes. Cross-tenant data leakage is impossible even if application code contains a bug omitting a `WHERE tenant_id =` clause.

---

## 12. Technology Stack & Justification

| Layer | Technology | Version | Why |
|---|---|---|---|
| Frontend | Next.js | 14 (App Router) | SSR for performance, RSC for data-heavy views, excellent DX |
| Frontend Language | TypeScript | 5.x | Type safety across the entire frontend — catches bugs at compile time |
| Styling | Tailwind CSS | 3.x | Utility-first, enforces design system consistency |
| Backend Framework | NestJS | 10.x | Structured module/service/controller pattern, DI, ideal for domain-driven service boundaries |
| Backend Language | TypeScript | 5.x | Shared types between frontend and backend via monorepo packages |
| Real-time | NestJS SSE | native | Persistent streaming for AI responses — serverless not viable here |
| ORM | Prisma | 5.x | Type-safe DB access, migrations in version control, excellent NestJS integration |
| Database | PostgreSQL (Supabase) | 15.x | Relational integrity + RLS for tenant isolation |
| Cache | Redis (Upstash) | — | Sub-millisecond conversation state — required for real-time chat responsiveness |
| AI Inference | Llama 3 via Ollama | — | Self-hosted at `140.245.49.219:11434` — zero per-token cost, already live |
| Validation | Zod | 3.x | Runtime schema validation on all API inputs and IndustryConfig records |
| Auth | JWT (NestJS Passport) | — | Stateless, scalable, tenant-aware tokens |
| Monorepo | Turborepo | — | Shared types, lint, and build across frontend and backend |
| Frontend Deploy | Vercel | — | Zero-config Next.js deployment |
| Backend Deploy | Railway | — | Persistent Node.js server — supports SSE, no serverless timeout |
| CI/CD | GitHub Actions | — | Lint, type-check, and deploy on every merge to main |

---

## 13. API Design

### 13.1 Base URLs

```
Frontend:  https://ladeway.vercel.app
Backend:   https://api.ladeway.railway.app
```

### 13.2 Core Endpoints

```
# Conversations (public — customer-facing, auth via sessionToken)
POST   /conversations/start
       Body: { configId: string }
       Returns: { conversationId, sessionToken, greeting }

POST   /conversations/:id/message
       Headers: X-Session-Token: <token>
       Body: { content: string }
       Returns: SSE stream — event: token, data: "word"
                             event: done, data: { status, capturedFields }

GET    /conversations/:id/state
       Headers: X-Session-Token: <token>
       Returns: { status, capturedFields, missingFields }

# Leads (protected — JWT required)
GET    /leads?status=NEW&tier=HOT&page=1&limit=20
GET    /leads/:id
PATCH  /leads/:id    Body: { status?, assignedTo? }

# Industry Configs (protected — ADMIN role)
GET    /configs
POST   /configs      Body: IndustryConfig
GET    /configs/:id
PUT    /configs/:id  Body: Partial<IndustryConfig>
DELETE /configs/:id

# Analytics (protected — ADMIN role)
GET    /analytics/summary
GET    /analytics/conversations?from=2026-01-01&to=2026-07-11
GET    /analytics/leads

# Auth
POST   /auth/login   Body: { email, password }
                     Returns: { accessToken, user }
POST   /auth/refresh Body: { refreshToken }
POST   /auth/logout

# Health
GET    /health
GET    /health/ai    Returns: { status, model, latency_ms }
```

### 13.3 SSE Streaming Protocol

```
event: token
data: "Hello"

event: token
data: " there"

event: token
data: ","

event: done
data: {"status":"QUALIFYING","capturedFields":{},"missingFields":["origin","destination"]}

event: error
data: {"message":"AI service temporarily unavailable"}
```

---

## 14. Security & Multi-Tenancy

### 14.1 Authentication Flow

```
1. POST /auth/login → NestJS validates credentials → returns JWT
2. JWT payload: { sub: userId, tenantId, role, iat, exp }
3. Every protected request: Authorization: Bearer <token>
4. JwtAuthGuard validates signature and expiry
5. TenantMiddleware extracts tenantId → sets app.current_tenant_id on DB connection
6. RLS policies silently scope all queries to that tenant
```

### 14.2 Security Measures

- Passwords hashed with bcrypt (cost factor 12)
- JWT access tokens expire in 15 minutes; refresh tokens expire in 7 days
- All secrets in environment variables — zero hardcoded credentials
- Input validation on every endpoint via Zod — no raw user input reaches the database
- Rate limiting on conversation endpoints (10 messages/minute per session) to prevent AI cost abuse
- CORS configured to allow only verified origins
- `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security` headers on all responses
- Audit logging for sensitive admin actions (config changes, team member changes)

---

## 15. Non-Functional Requirements

| Requirement | Target | Approach |
|---|---|---|
| AI first token latency | < 3 seconds | SSE streaming starts immediately; Ollama benchmarked at ~1.5s first token |
| Conversation state consistency | Zero lost messages | Redis for in-flight state; PostgreSQL as durable backup after each turn |
| Tenant isolation | Zero cross-tenant leakage | PostgreSQL RLS at the DB layer, not application code |
| Uptime / graceful degradation | AI unavailable = graceful fallback | Retry with backoff; fallback message if all retries fail |
| Mobile responsiveness | Full functionality at 375px | Chat widget built mobile-first |
| API response time (non-streaming) | < 200ms p95 | Indexed queries; Redis for hot data |

---

## 16. Design System & UI Direction

Premium, classic, enterprise — deliberately not a flashy AI product demo.

| Element | Specification |
|---|---|
| Primary | Deep navy `#1F4E79` |
| Secondary | Slate grey `#64748B` |
| Background | Warm off-white `#FAFAF9` |
| Accent | Muted brass `#B45309` — used sparingly |
| Success / Hot | Deep green `#15803D` |
| Warning / Warm | Amber `#B45309` |
| Neutral / Cold | Slate `#64748B` |
| Font | Inter — bold headings, regular body |
| Chat bubbles | Two-column minimal layout — no avatars, no emojis |
| Dashboard | Information-dense CRM layout — sortable tables, status badges |
| Spacing | Generous — premium products breathe |
| Motion | 150ms ease transitions only |

---

## 17. Monorepo Folder Structure

```
ladeway/                              ← Turborepo root
├── apps/
│   ├── web/                          ← Next.js 14 frontend (Vercel)
│   │   ├── app/
│   │   │   ├── page.tsx              → Demo landing page
│   │   │   ├── chat/[configId]/
│   │   │   │   └── page.tsx          → Embeddable chat page
│   │   │   ├── login/page.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── layout.tsx        → Auth-protected layout
│   │   │   │   ├── page.tsx          → Lead pipeline
│   │   │   │   ├── leads/[id]/page.tsx
│   │   │   │   └── analytics/page.tsx
│   │   │   └── admin/
│   │   │       └── configs/
│   │   │           ├── page.tsx
│   │   │           └── [id]/page.tsx
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   ├── ChatWidget.tsx
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   └── TypingIndicator.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── LeadTable.tsx
│   │   │   │   ├── LeadCard.tsx
│   │   │   │   └── LeadDetail.tsx
│   │   │   └── ui/                   → Shared design system components
│   │   └── lib/
│   │       ├── api.ts                → Backend API client
│   │       └── auth.ts               → NextAuth config
│   │
│   └── api/                          ← NestJS backend (Railway)
│       └── src/
│           ├── main.ts               → Bootstrap, CORS, global pipes
│           ├── app.module.ts         → Root module
│           ├── auth/
│           │   ├── auth.module.ts
│           │   ├── auth.service.ts
│           │   ├── jwt.strategy.ts
│           │   └── guards/
│           ├── tenant/
│           │   ├── tenant.module.ts
│           │   ├── tenant.service.ts
│           │   └── tenant.middleware.ts  → Sets RLS context
│           ├── config/               → IndustryConfig module
│           │   ├── config.module.ts
│           │   ├── config.service.ts
│           │   └── config.controller.ts
│           ├── conversation/
│           │   ├── conversation.module.ts
│           │   ├── conversation.service.ts
│           │   ├── conversation.controller.ts  → SSE endpoint
│           │   └── session.service.ts          → Redis session management
│           ├── ai/
│           │   ├── ai.module.ts
│           │   ├── llm-router.service.ts
│           │   ├── prompt.service.ts
│           │   └── extractor.service.ts
│           ├── qualification/
│           │   ├── qualification.module.ts
│           │   ├── engine.service.ts
│           │   └── scoring.service.ts
│           ├── lead/
│           │   ├── lead.module.ts
│           │   ├── lead.service.ts
│           │   └── lead.controller.ts
│           ├── analytics/
│           │   ├── analytics.module.ts
│           │   ├── analytics.service.ts
│           │   └── analytics.controller.ts
│           └── database/
│               ├── database.module.ts
│               └── prisma.service.ts
│
├── packages/
│   └── types/                        ← Shared TypeScript interfaces
│       ├── src/
│       │   ├── industry-config.ts    → QualificationField, ScoringRule, IndustryConfig
│       │   ├── conversation.ts       → ConversationStatus, Message
│       │   ├── lead.ts               → Lead, LeadTier
│       │   └── index.ts
│       └── package.json
│
├── prisma/                           ← Shared schema (used by api/)
│   ├── schema.prisma
│   └── seed.ts
│
├── turbo.json
└── package.json
```

---

## 18. Deployment Architecture

![Deployment Architecture](diagrams_v4/deployment.png)

*Figure 6 — Production Deployment Architecture*

| Component | Platform | URL | Notes |
|---|---|---|---|
| Next.js Frontend | Vercel | `ladeway.vercel.app` | Zero-config deployment, CDN-distributed |
| NestJS Backend | Railway | `api.ladeway.railway.app` | Persistent Node.js process — required for SSE |
| PostgreSQL | Supabase | Connection string via env | Managed Postgres, RLS enabled |
| Redis | Upstash | Connection string via env | Serverless Redis, TLS enforced |
| Llama 3 / Ollama | Oracle Cloud | `140.245.49.219:11434` | Self-hosted, already live, zero cost |

### CI/CD Pipeline (GitHub Actions)

```
On push to main:
1. Install dependencies (Turborepo cache)
2. Type-check (tsc --noEmit) — web and api
3. Lint (ESLint)
4. Run integration tests
5. Deploy api → Railway
6. Deploy web → Vercel
```

---

## 19. How This Maps Directly to the Brief

| Neal's Exact Words | How This Specification Addresses It |
|---|---|
| "Web-based customer-facing application" | Embeddable chat widget + standalone chat page, deployable on any website |
| "Not specifically for moving/logistics" | IndustryConfig is a database record — Section 5 details this as the central architectural decision with TypeScript interfaces |
| "Want to sell the software to other industries" | Multi-tenant SaaS from day one — Logicstics is tenant #1, not the only tenant the architecture was designed for |
| "Ability to tailor to other industries" | Admin console allows non-technical configuration of new industries without code changes |
| "Chat/conversational interface" | Natural multi-turn conversation, SSE streaming, one question at a time — Section 9 |
| "AI that functions the way it should" | Sections 9 and 10 detail the conversation engine, state machine, and prompt architecture — natural, non-robotic, accurate extraction |
| "Not looking for a working product" | Architecture is production-grade. Feature completeness is scoped to the qualification core |
| "At least the voice/chat functionality" | Chat is the primary deliverable. The architecture separates voice as a future channel addition — same engine, new input layer |

---

*End of Project Specification — v3*
*Muhammad Ahtisham · Ladeway · Architecture Exercise*
