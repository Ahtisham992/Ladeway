# LADEWAY — 30-PHASE IMPLEMENTATION PLAN v3
## Full Build Roadmap — Next.js Frontend + NestJS Backend
*Companion to the Project Specification v3 · Confirmed Brief: Neal Elbaum, Logicstics*

---

## How to Read This Plan

Each phase has one clear goal, a set of concrete tasks, and a **Definition of Done** — a specific, observable outcome that must be true before the next phase begins. No phase ends with "mostly done" or "good enough for now."

Phases are sequenced by technical dependency. The dependency map at the end shows exactly what blocks what.

The **Stage 2 milestone** (end of Phase 12) is the primary exercise deliverable — a fully working AI qualification conversation. Every subsequent phase builds the product surface and SaaS infrastructure around that proven core.

---

## Stage Overview

| Stage | Phases | Theme | Milestone |
|---|---|---|---|
| 1 | 1–5 | Monorepo, Infrastructure & Data Layer | Both apps running, DB live, Ollama connected |
| 2 | 6–12 | NestJS AI Conversation Engine | Working end-to-end AI qualification in the API |
| 3 | 13–17 | Industry-Agnostic Config & Resilience | Two industries on one engine, edge cases handled |
| 4 | 18–22 | Next.js Chat Interface & Streaming | Production-quality customer-facing chat |
| 5 | 23–27 | Dashboard, Admin Console & Analytics | Full product loop from chat to lead to dashboard |
| 6 | 28–30 | Security, Performance & Deployment | Live, deployed, demo-ready at public URL |

---

# STAGE 1 — Monorepo, Infrastructure & Data Layer

## Phase 1 — Monorepo Setup & Tooling

**Goal:** A single repository containing both the Next.js frontend and NestJS backend, with shared types, consistent tooling, and a one-command local development setup.

**Tasks:**
- Initialize Turborepo: `npx create-turbo@latest ladeway`
- Configure workspace structure: `apps/web` (Next.js), `apps/api` (NestJS), `packages/types` (shared TypeScript interfaces)
- Initialize Next.js in `apps/web`: `npx create-next-app@latest . --typescript --tailwind --app`
- Initialize NestJS in `apps/api`: `npx @nestjs/cli new . --package-manager npm`
- Configure shared `packages/types` with the core interfaces from the Specification: `IndustryConfig`, `QualificationField`, `ScoringRule`, `ConversationStatus`, `LeadTier`
- Configure TypeScript `paths` in both apps to import from `@ladeway/types`
- Set up ESLint and Prettier with shared configs across both apps
- Configure Husky + lint-staged: type-check and lint run on every commit
- Write a root `package.json` script: `npm run dev` starts both apps concurrently

**Definition of done:** `npm run dev` from the root starts both the Next.js dev server (port 3000) and the NestJS API (port 3001) simultaneously; `npm run type-check` passes across all three packages with zero errors.

---

## Phase 2 — Database Schema, Prisma & Migrations

**Goal:** The complete data model is live in the database, all migrations are tracked in version control, and the Prisma client is correctly configured for use in NestJS.

**Tasks:**
- Create a free Supabase project; copy the connection string (pooler for serverless, direct for migrations)
- Configure Prisma in `apps/api`: `npx prisma init`
- Implement the complete `schema.prisma` from the Specification Section 11 — all 8 models with all relations, indexes, and cascade rules
- Run first migration: `npx prisma migrate dev --name init`
- Verify all 8 tables and their foreign keys in the Supabase table editor
- Create the NestJS `DatabaseModule` with the `PrismaService` singleton (prevents connection pool exhaustion in a persistent server)
- Write `prisma/seed.ts` with two complete `IndustryConfig` records (logistics and real estate) and one test `User` per tenant

**Definition of done:** `npx prisma studio` shows all 8 tables correctly; running `npx prisma db seed` inserts both industry configs and test users without errors; `PrismaService` is injectable across all NestJS modules.

---

## Phase 3 — Row-Level Security & Multi-Tenant Isolation

**Goal:** Tenant data isolation is enforced at the database layer — not application code — before any real data enters the system.

**Tasks:**
- Write and apply RLS policies to all tenant-scoped tables: `conversations`, `messages`, `extracted_data`, `leads`, `lead_assignments`, `industry_configs`, `users`
- Implement the NestJS `TenantMiddleware` that sets `app.current_tenant_id` on the Prisma connection before every query executes
- Apply `TenantMiddleware` globally in `AppModule` for all routes except public conversation endpoints (which use `sessionToken` instead of JWT for tenant resolution)
- Write a cross-tenant isolation test: query Tenant B's data while authenticated as Tenant A — verify zero rows returned even with no application-level `WHERE` clause

**Definition of done:** The cross-tenant isolation test passes; a deliberately buggy query omitting `WHERE tenantId =` returns zero rows for the wrong tenant; the middleware runs on every protected request without error.

---

## Phase 4 — Authentication & Authorization (NestJS)

**Goal:** Every request to protected endpoints is correctly authenticated, and every action is authorized for the requesting user's role and tenant.

**Tasks:**
- Install and configure `@nestjs/passport`, `passport-jwt`, `@nestjs/jwt`
- Implement `AuthModule` with `AuthService` (login, token generation) and `JwtStrategy` (token validation)
- JWT payload: `{ sub: userId, tenantId, role, iat, exp }` — all four fields present on every token
- Implement `JwtAuthGuard` and `RolesGuard` as reusable NestJS guards
- Implement `@Roles('ADMIN')` and `@Roles('REP')` decorators
- Implement `AuthController` with `POST /auth/login`, `POST /auth/logout`
- Hash all passwords with bcrypt (cost factor 12) in `AuthService`
- Write the login page in Next.js (`apps/web/app/login/page.tsx`) that POSTs to the NestJS backend

**Definition of done:** A valid login returns a JWT; the JWT is validated on a protected test route; a REP attempting to access an ADMIN-only route receives a 403; an unauthenticated request receives a 401.

---

## Phase 5 — Ollama Connectivity & LLM Router Service

**Goal:** The AI inference layer is connected, wrapped behind a clean provider-agnostic interface, and verified working before any conversation logic is built on top of it.

**Tasks:**
- Create `AIModule` in NestJS
- Implement `LLMRouterService` with a single public method: `stream(messages: LLMMessage[], options?: StreamOptions): AsyncIterable<string>`
- Implement the Ollama provider: POST to `http://140.245.49.219:11434/api/chat` with the `llama3` model, streaming enabled
- Handle streaming response parsing (Ollama returns newline-delimited JSON chunks)
- Implement retry with exponential backoff: 3 attempts before throwing `AIUnavailableException`
- Implement `GET /health/ai` endpoint returning `{ status, model, latencyMs }`
- Test with a real prompt — confirm streaming response arrives under 2 seconds for first token

**Definition of done:** `GET /health/ai` returns `{ status: "ok", model: "llama3", latencyMs: <2000 }`; a test call to `LLMRouterService.stream()` yields a streaming response from Llama 3; if the Ollama endpoint is unreachable, `AIUnavailableException` is thrown after 3 retries.

---

# STAGE 2 — NestJS AI Conversation Engine

## Phase 6 — Industry Config Module & Validation

**Goal:** IndustryConfig records can be created, retrieved, and validated — and the config is the single source of truth for all AI behaviour.

**Tasks:**
- Implement `ConfigModule` with full CRUD: `GET /configs`, `POST /configs`, `GET /configs/:id`, `PUT /configs/:id`, `DELETE /configs/:id`
- Implement Zod validation schemas for `QualificationField[]` and `ScoringRule[]` — validate at write time, throw `422 Unprocessable Entity` with field-level errors for invalid configs
- Implement a `ConfigService.getActiveConfig(configId)` method used by the conversation engine — typed, cached in Redis for 5 minutes (config reads are high-frequency during active conversations)
- Guard `DELETE` against configs with active conversations
- Test: inserting a config with a `fieldsJson` field missing the required `key` property throws a 422 with a specific error message

**Definition of done:** All CRUD routes work; a malformed config is rejected at write time with a specific error; `getActiveConfig()` returns a correctly typed `IndustryConfig` from both the DB and Redis cache.

---

## Phase 7 — Redis Session Service

**Goal:** Conversation session state is stored in and retrieved from Redis with sub-millisecond latency — the performance requirement for a real-time chat experience.

**Tasks:**
- Configure Upstash Redis client in NestJS `CacheModule`
- Implement `SessionService` with typed methods:
  - `createSession(conversationId, configId, tenantId): Promise<void>`
  - `getSession(sessionToken): Promise<ConversationSession | null>`
  - `updateCapturedFields(sessionToken, fields: Record<string, string>): Promise<void>`
  - `updateStatus(sessionToken, status: ConversationStatus): Promise<void>`
  - `deleteSession(sessionToken): Promise<void>`
- Set TTL of 24 hours on all session keys — abandoned conversations auto-expire
- Test read/write performance: a `getSession` call should complete in under 5ms

**Definition of done:** All `SessionService` methods work correctly; a `getSession` for a non-existent token returns `null`; Redis keys have the correct TTL; measured read latency is under 5ms.

---

## Phase 8 — Prompt Engineering Service

**Goal:** Given an `IndustryConfig`, a conversation history, and the current field capture state, the `PromptService` produces a correctly structured, industry-specific prompt every single time.

**Tasks:**
- Implement `PromptService` in `AIModule` with `assemble(config, history, capturedFields): PromptPayload`
- Implement the dynamic system prompt template from the Specification Section 10.1 — persona, required fields, conversation rules, current capture state, missing fields all injected correctly
- Implement `assembleExtractionPrompt(config, messages): string` — the second, separate prompt for structured data extraction
- Unit test with the logistics config: verify the assembled prompt contains Alexandra's persona, the logistics fields, and correctly lists missing vs. captured fields
- Unit test with the real estate config: verify a completely different persona and field set from the same function — zero conditional logic in `PromptService`

**Definition of done:** `assemble()` with the logistics config produces a prompt mentioning "Alexandra" and logistics fields; with the real estate config it produces a prompt mentioning the real estate persona and real estate fields — same method, same code path, different output entirely.

---

## Phase 9 — Conversation State Machine

**Goal:** The lifecycle of a conversation — from greeting through qualification to completion — is managed by a reliable, explicitly-modelled state machine.

**Tasks:**
- Implement `QualificationEngineService` in `QualificationModule`
- Implement `getNextAction(session, config): QualificationAction` — returns one of: `CONTINUE_QUALIFYING`, `TRIGGER_EXTRACTION`, `TRIGGER_TRANSFER`, `CLOSE_CONVERSATION`
- Implement field capture state tracking: after each AI response, re-read the Redis session and compare captured fields against required fields from the config
- Implement intent detection for escalation requests (keyword + LLM-based detection for ambiguous cases)
- Implement the `ABANDONED` transition: a scheduled NestJS `@Cron` job runs hourly, finds conversations with no activity in 24 hours, marks them `ABANDONED`, triggers partial extraction if ≥ 50% of fields were captured

**Definition of done:** All state transitions are correctly triggered in integration tests; an escalation phrase ("I want to speak to a human") triggers `TRIGGER_TRANSFER`; a simulated 25-hour-inactive conversation is correctly marked `ABANDONED` by the cron job.

---

## Phase 10 — Conversation Start & Message API

**Goal:** The conversation API is fully operational — a client can start a conversation and send messages that trigger real AI responses.

**Tasks:**
- Implement `ConversationModule` with `ConversationService` and `ConversationController`
- `POST /conversations/start`: validates `configId`, creates `Conversation` in PostgreSQL, initialises session in Redis, generates and returns AI greeting
- `POST /conversations/:id/message`: validates `sessionToken`, loads session from Redis, calls `PromptService`, calls `LLMRouterService.stream()`, returns SSE stream
- SSE protocol: `event: token` for each streamed word, `event: done` with updated session state on completion, `event: error` on failure
- After SSE stream completes: persist both messages to PostgreSQL, update Redis session state, call `QualificationEngineService.getNextAction()`

**Definition of done:** Starting a conversation returns a real AI greeting; sending a message produces a streamed response via SSE; both messages appear in PostgreSQL after the stream completes; Redis session is updated.

---

## Phase 11 — Structured Data Extractor

**Goal:** When a conversation is complete, the `ExtractorService` reliably converts the raw transcript into a typed, structured JSON object with field-level confidence scores.

**Tasks:**
- Implement `ExtractorService` in `AIModule`
- `extract(config, messages): Promise<ExtractionResult>`: sends the extraction prompt to `LLMRouterService`, parses the JSON response
- Implement JSON parsing with error recovery: if the LLM returns malformed JSON, strip markdown fences and retry once with a stricter prompt before throwing
- Persist each extracted field as an `ExtractedData` row (one row per field, with confidence)
- Test with a 10-turn realistic logistics conversation — verify all mentioned fields are correctly extracted; verify un-mentioned fields return `null`, not hallucinated values
- Test with the real estate config — verify different fields are extracted correctly

**Definition of done:** A realistic 10-turn logistics conversation produces correct `ExtractedData` rows for all mentioned fields; un-mentioned required fields return `null`; the same extractor correctly handles the real estate config with different fields.

---

## Phase 12 — Lead Scoring Engine & Lead Creation

**Goal:** Every completed conversation produces a scored, tiered, summarised Lead record in the database — the structured business output of the qualification process.

**Tasks:**
- Implement `ScoringService` in `QualificationModule`
- `score(config, extractedData): ScoringResult` — evaluates each `ScoringRule` from `config.scoringRulesJson` against the extracted data, computes a weighted score, determines tier
- The scoring engine has zero industry-specific logic — all rules come from the config
- Generate a plain-language lead summary using a third, small LLM call: "A residential move from New York to London, preferred timeline March 2026, full household goods"
- Create the `Lead` record with all data, score, tier, and summary
- Wire the full pipeline: `QualificationEngineService` triggers `ExtractorService` → `ScoringService` → `LeadService.create()`
- End-to-end test: complete a full conversation for both industry configs; verify correct `Lead` records are created with appropriate tiers

**Definition of done:** Completing a full conversation for both the logistics and real estate configs each produce a correctly scored `Lead` record in the database, with all extracted fields, an appropriate tier, and a coherent plain-language summary.

---

*🏁 STAGE 2 MILESTONE — The full AI qualification pipeline is working: start a conversation via API, complete a natural qualification dialogue with Llama 3, receive a structured scored Lead in the database. This is the primary exercise deliverable. Stages 3–6 build the product and SaaS surface around this proven core.*

---

# STAGE 3 — Industry-Agnostic Config & Resilience

## Phase 13 — Multi-Industry Demonstration

**Goal:** Prove concretely that two entirely different industries run on the same engine with zero code changes — only different config records.

**Tasks:**
- Run the full qualification pipeline for both seeded configs via the actual API (not mocks)
- Document the complete delta between the two configs — precisely which fields in `IndustryConfig` change and which engine code is identical
- Seed a third industry config (legal services or insurance) to further prove generality
- Write a parameterised integration test that runs the same qualification test against all active configs and verifies each produces a correctly distinct output

**Definition of done:** Three industry configs each produce a fully correct, distinct qualification conversation with zero code path differences — different persona, different questions, different extracted fields, different scoring — confirmed by the parameterised integration test.

---

## Phase 14 — Conversation Resilience & State Recovery

**Goal:** The system handles every realistic failure and edge case without data loss or a broken customer experience.

**Tasks:**
- Redis TTL expiry recovery: if a session's Redis state has expired, `SessionService.getSession()` falls back to reconstructing state from PostgreSQL message history — calls `ExtractorService` in "partial" mode to re-derive captured fields
- Conversation resume: a valid `sessionToken` for an `ACTIVE` or `QUALIFYING` conversation resumes from where it left off
- Partial lead creation: an `ABANDONED` conversation with ≥ 50% fields captured produces a partial `Lead` marked `ABANDONED` — never silently discarded
- AI unavailable mid-conversation: `AIUnavailableException` is caught in `ConversationController`, SSE `event: error` is sent with a user-friendly message, conversation status remains `QUALIFYING` (not broken)

**Definition of done:** Each resilience scenario can be triggered in tests and behaves as specified; no conversation produces orphaned or inconsistent state under any tested failure condition.

---

## Phase 15 — Escalation & Human Handoff

**Goal:** A customer requesting a human receives a graceful, professional response — and a Lead is still created from whatever was captured.

**Tasks:**
- Improve intent detection: combine keyword matching with a small LLM classifier for ambiguous phrasing
- On `TRIGGER_TRANSFER`: transition conversation to `TRANSFERRED`, run partial extraction, create Lead with `status: TRANSFERRED`, send warm closing message via SSE
- Test with varied escalation phrasing: "Can I speak to a person?", "I'd prefer to talk to someone", "human please", "stop" — all must trigger transfer

**Definition of done:** 10 different escalation phrasings all correctly trigger the transfer flow; a Lead record is created in all cases with whatever data was captured; the closing message is warm and professional.

---

## Phase 16 — Config CRUD Hardening

**Goal:** The industry config API is robust, handles all edge cases, and can be fully managed through the API (prerequisite for the admin UI in Phase 25).

**Tasks:**
- Implement config versioning: updating a config does not modify historical conversations (they reference the config snapshot via `configId` at conversation start time)
- Implement `isActive` toggle: deactivating a config prevents new conversations without deleting historical data
- Guard `DELETE` properly: a config with any conversation (active or historical) cannot be deleted — only deactivated
- Add `GET /configs/:id/preview` — runs a simulated one-turn conversation against the config for instant preview without creating a real conversation record

**Definition of done:** All edge cases handled; a config with historical conversations cannot be deleted (returns 409 Conflict); the preview endpoint returns an AI response using the specified config without creating any database records.

---

## Phase 17 — Analytics Data Layer

**Goal:** The data necessary to power the analytics dashboard exists in the database and is queryable efficiently.

**Tasks:**
- Implement `AnalyticsModule` with `AnalyticsService`
- `getSummary(tenantId, dateRange)`: total conversations by status, lead count by tier, conversion rate, average conversation length (in turns)
- `getConversationTimeSeries(tenantId, from, to)`: daily conversation volume for charting
- `getLeadFunnelData(tenantId)`: lead counts at each pipeline stage
- Index all analytics query fields: `status`, `tier`, `createdAt`, `tenantId`
- Benchmark against 1,000+ seeded conversation records — all queries must complete under 200ms

**Definition of done:** All analytics queries return correct data; benchmarked under 200ms against 1,000+ records; the `AnalyticsController` exposes correctly paginated and filterable endpoints.

---

# STAGE 4 — Next.js Chat Interface & Streaming

## Phase 18 — Design System & Shared UI Components

**Goal:** The design tokens, typography, and base component library that every screen inherits are defined once, enforced everywhere, and match the premium design specification.

**Tasks:**
- Extend `tailwind.config.ts` with custom colours, font family (Inter), and spacing scale from the Specification Section 16
- Create `apps/web/styles/globals.css` with CSS variables matching the design tokens
- Build the shared component library in `apps/web/components/ui/`:
  - `Button` — primary, secondary, ghost, destructive variants
  - `Input`, `Textarea`, `Select`
  - `Badge` — Hot (green), Warm (amber), Cold (slate) tier variants
  - `Card`, `Modal`, `Spinner`, `Skeleton`
  - `Table`, `TableRow`, `TableCell` with sorting indicators
- All components accept className overrides but default to design system tokens

**Definition of done:** All shared components render correctly; a visual review confirms every component matches the premium/classic design direction; no component contains a hardcoded colour value not present in the design token system.

---

## Phase 19 — Chat Widget Component

**Goal:** The customer-facing chat interface is production-quality, professionally designed, and correctly consumes the NestJS SSE streaming endpoint.

**Tasks:**
- Build `ChatWidget.tsx` — message list, input bar, send button
- Message layout: customer messages right-aligned (navy background), AI messages left-aligned (light grey) — no avatars, no emojis
- Implement the SSE consumer using the browser's native `EventSource` API — stream `event: token` into the active message bubble word by word
- `TypingIndicator.tsx` — animated ellipsis shown from message send until first token arrives
- Disable the input while an AI response is in-flight — prevent double-sends
- On `event: done` — re-enable input, update local state with new session status
- On `event: error` — show inline error message without breaking conversation state
- Full mobile responsiveness: 375px minimum viewport, 44px minimum touch targets

**Definition of done:** A full qualification conversation can be completed in the widget with no UI glitches; AI responses stream word by word; the widget is fully functional on a 375px mobile viewport; the input correctly disables and re-enables around each AI response.

---

## Phase 20 — Conversation Start Flow & Session Management

**Goal:** Opening the chat widget initiates a real conversation session correctly, and the widget gracefully handles all session lifecycle events.

**Tasks:**
- On widget mount: `POST /conversations/start` with the `configId` from the page URL → receive `conversationId`, `sessionToken`, `greeting`
- Store `sessionToken` in `sessionStorage` (not `localStorage` — scoped to tab, appropriate for a conversation)
- Display the AI greeting immediately on session start
- On page refresh with an existing `sessionToken`: `GET /conversations/:id/state` → resume the conversation if still active, start fresh if expired
- On session expiry (server returns 401 on message send): clear session, show "Your session has expired" message, offer to start a new conversation

**Definition of done:** Opening the chat page starts a real conversation; refreshing with an active session resumes correctly; an expired session shows a graceful message and reset option.

---

## Phase 21 — Multi-Industry Demo Landing Page

**Goal:** A polished landing page that showcases both industry demos side by side, allowing Neal (or any evaluator) to immediately try both without any setup.

**Tasks:**
- Build `apps/web/app/page.tsx` — the demo landing page
- Two clear demo sections: Logicstics (logistics/moving) and a second industry (real estate)
- Each section: brief description of the industry use case, "Start Conversation" button linking to `/chat/[configId]`
- The page must be visually polished and professional — this is the first thing Neal sees when he opens the link
- Include a brief "How it works" section: 3 steps (Customer chats → AI qualifies → Lead delivered to your team)
- Mobile-responsive

**Definition of done:** The landing page renders correctly on desktop and mobile; both demo links open correctly configured chat sessions; a first-time visitor can understand the product and try both demos without any explanation.

---

## Phase 22 — Conversation Completion UI

**Goal:** When qualification is complete, the customer sees a professional, personalised confirmation — not a dead end.

**Tasks:**
- On `event: done` with `status: SCORED` from the SSE stream: transition the chat widget to a completion state
- Display a personalised confirmation message generated from the Lead summary (not hardcoded): "Thanks — we've noted your move from New York to London in March. A member of the team will be in touch within one business day."
- The input bar is replaced with a clear completion indicator — the conversation cannot be continued
- Add a subtle visual distinction between active and completed conversation states

**Definition of done:** Completing a full qualification conversation produces a personalised confirmation message that accurately reflects the captured details; the input is correctly disabled; the transition is visually smooth.

---

# STAGE 5 — Dashboard, Admin Console & Analytics

## Phase 23 — Sales Rep Dashboard

**Goal:** Sales reps have a single, efficient interface to view, prioritise, and act on all incoming qualified leads.

**Tasks:**
- Build `apps/web/app/dashboard/page.tsx` — lead pipeline table
- Columns: Contact Name, Industry, Summary (truncated), Tier badge (Hot/Warm/Cold), Status, Date, Actions
- Implement filtering by Tier and Status; implement sorting by Date and Score
- Implement polling every 30 seconds for new leads (SSE push as a Phase 2 enhancement)
- Implement `PATCH /leads/:id` for status updates from the table inline

**Definition of done:** The dashboard loads and displays all seeded leads correctly; filtering and sorting work; a new lead created via the chat widget appears within 30 seconds without a manual refresh.

---

## Phase 24 — Lead Detail View

**Goal:** A rep can understand everything about a lead — conversation, extracted data, score rationale — from a single screen.

**Tasks:**
- Build `apps/web/app/dashboard/leads/[id]/page.tsx`
- Sections: Contact info card, Extracted data card (field/value pairs from `ExtractedData`), Lead score and tier with brief rationale, Full conversation transcript (chronological, readable formatting), Status and assignment controls
- The transcript must be readable and scannable — alternating message alignment matching the chat widget style

**Definition of done:** A rep can open a lead and read the full transcript, extracted data, score, and status — all on one screen, correctly fetched from the NestJS API.

---

## Phase 25 — Admin Configuration Console

**Goal:** A non-technical business operator can create, edit, and publish an industry configuration entirely through the UI.

**Tasks:**
- Build `apps/web/app/admin/configs/page.tsx` — config list with active/inactive toggle
- Build `apps/web/app/admin/configs/[id]/page.tsx` — the config editor:
  - Basic fields: persona name, role, greeting, tone selector
  - Qualification fields editor: add/remove/reorder fields, set label, type, required, options (for enum), extraction hint
  - Scoring rules editor: add/remove rules, set field, condition, value, weight
  - Live preview button: calls `GET /configs/:id/preview` and shows the AI's response in a mini chat widget
- All changes validated client-side with Zod before submission

**Definition of done:** An admin can create a new, valid industry config entirely through the UI; the preview shows a real AI response using the current (unsaved) config; saving produces a correct API call with properly validated data.

---

## Phase 26 — Analytics Dashboard

**Goal:** A tenant admin can see how their AI agent is performing at a glance.

**Tasks:**
- Build `apps/web/app/dashboard/analytics/page.tsx`
- Summary cards: Total Conversations (last 30 days), Qualified Leads, Hot Lead Rate, Avg. Conversation Length
- Lead tier distribution chart (using Recharts — navy/slate palette, no rainbow colours)
- Conversation volume time-series chart (last 30 days, daily)
- All data from `GET /analytics/summary` and `GET /analytics/conversations`

**Definition of done:** The analytics page renders correctly with data from the seeded conversations; charts use the correct design system colours; all metrics are accurate against the seeded data.

---

## Phase 27 — Tenant Onboarding & Auth Flow

**Goal:** The complete authentication and onboarding flow works end-to-end — signup, first config, dashboard access.

**Tasks:**
- Build the signup flow: company name, subdomain, admin email/password → `POST /tenants/register`
- On signup: create Tenant, create admin User, create a default starter IndustryConfig (logistics template)
- Build the first-run wizard: 3 steps — (1) review AI persona, (2) review qualification fields, (3) copy embed code
- The embed code: a `<script>` tag pointing to `https://ladeway.vercel.app/chat/{configId}` that the tenant can paste on any site
- Ensure the full login → dashboard → admin console flow works correctly

**Definition of done:** A new account can be created, a config configured, and an embed code generated — end to end, in under 10 minutes, without any support or developer involvement.

---

# STAGE 6 — Security, Performance & Deployment

## Phase 28 — Security Hardening

**Goal:** The platform is secure against common attacks, handles sensitive data correctly, and passes a structured security review.

**Tasks:**
- Audit all NestJS controllers: every protected route has `@UseGuards(JwtAuthGuard)` and appropriate `@Roles()`
- Verify RLS policies are active and correct by running direct cross-tenant queries against the Supabase database
- Add security headers in NestJS (`helmet` middleware): `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Content-Security-Policy`
- Verify all environment variables are in `.env` and covered by `.gitignore` — run `git log` to confirm no secrets were ever committed
- Add request-size limits on all POST endpoints to prevent payload injection
- Implement CORS in NestJS allowing only `https://ladeway.vercel.app` and `localhost:3000`

**Definition of done:** A security checklist review finds zero unauthenticated protected routes, zero hardcoded secrets, all security headers present on responses, and CORS correctly restricting origins.

---

## Phase 29 — Performance & Integration Testing

**Goal:** The platform performs well under realistic load and the critical AI conversation path meets its latency target.

**Tasks:**
- Measure end-to-end conversation turn latency: message sent → first SSE token received. Target: < 3 seconds
- Benchmark all analytics queries against 1,000+ seeded records. Target: < 200ms
- Benchmark lead list query with 500+ leads. Target: < 100ms
- Write integration tests for: happy path (full conversation → Lead created), AI unavailable (graceful error), escalation (TRANSFERRED Lead created), cross-tenant isolation
- Load test: 10 simultaneous active conversations — verify no errors and latency within target

**Definition of done:** All latency targets met; all integration tests pass; 10 simultaneous conversations run without errors.

---

## Phase 30 — Deployment, Monitoring & Handover

**Goal:** The application is live at a public URL, both industry demos work end-to-end, and the handover package for Neal is complete.

**Tasks:**
- Deploy NestJS to Railway: push `apps/api` to a Railway service, configure all environment variables, verify `GET /health/ai` returns healthy
- Deploy Next.js to Vercel: connect the monorepo, configure `apps/web` as the root, set `NEXT_PUBLIC_API_URL` to the Railway URL
- Run full end-to-end test on production: start logistics conversation → complete it → verify Lead appears in dashboard; repeat for real estate config
- Seed the production database: 3–5 realistic leads per industry config so the dashboard is not empty on first view
- Set up basic uptime monitoring on the Railway backend (Railway native monitoring is sufficient)
- Write the handover note: live URL, both demo links, rep dashboard login, admin console login, 3-paragraph architecture summary, and a note confirming the industry-agnostic design is demonstrable

**Definition of done:** Both industry demos work end-to-end on the live deployment; the rep dashboard shows real leads; the admin console allows config editing; Neal can access everything from one URL with the provided credentials.

---

## Dependency Map

```
Phase 1 (Monorepo) ──────────────────────────────────────────────┐
Phase 2 (DB Schema) ──────────────────────────────────────────┐  │
Phase 3 (RLS) ────────────── requires Phase 2                 │  │
Phase 4 (Auth) ───────────── requires Phase 2, 3              │  │
Phase 5 (Ollama/LLM) ─────── requires Phase 1                 │  │
                                                               │  │
Phase 6 (Config Module) ───── requires Phase 2, 3, 4          │  │
Phase 7 (Redis Sessions) ──── requires Phase 1                 │  │
Phase 8 (Prompt Service) ──── requires Phase 5, 6             │  │
Phase 9 (State Machine) ────── requires Phase 6, 7            │  │
Phase 10 (Conv API) ────────── requires Phase 8, 9            │  │
Phase 11 (Extractor) ───────── requires Phase 5, 8            │  │
Phase 12 (Scoring+Lead) ────── requires Phase 11, 9           │  │
                                     🏁 Stage 2 Complete       │  │
Phase 13 (Multi-Industry) ──── requires Phase 12              │  │
Phase 14 (Resilience) ──────── requires Phase 10, 7           │  │
Phase 15 (Escalation) ──────── requires Phase 9, 10           │  │
Phase 16 (Config Hardening) ── requires Phase 6               │  │
Phase 17 (Analytics Layer) ─── requires Phase 12              │  │
                                                               │  │
Phase 18 (Design System) ────── requires Phase 1 ─────────────┘  │
Phase 19 (Chat Widget) ──────── requires Phase 10, 18            │
Phase 20 (Session Mgmt) ─────── requires Phase 10, 19            │
Phase 21 (Demo Landing Page) ── requires Phase 19, 20            │
Phase 22 (Completion UI) ────── requires Phase 12, 19            │
                                                                   │
Phase 23 (Rep Dashboard) ────── requires Phase 12, 18 ────────────┘
Phase 24 (Lead Detail) ──────── requires Phase 23
Phase 25 (Admin Console) ────── requires Phase 16, 18
Phase 26 (Analytics Dashboard)  requires Phase 17, 18
Phase 27 (Onboarding) ────────── requires Phase 4, 6, 18

Phase 28 (Security) ────────────── requires all previous
Phase 29 (Performance/Testing) ─── requires all previous
Phase 30 (Deployment) ──────────── requires all previous
```

---

## What Neal Can See After Each Stage

| After Stage | Demonstrable Outcome |
|---|---|
| Stage 1 | Running monorepo, live database, Ollama responding — infrastructure proven |
| Stage 2 | Full AI qualification via the API — send messages, receive streamed responses, get a scored Lead |
| Stage 3 | Two completely different industries on the same engine, edge cases handled cleanly |
| Stage 4 | A polished chat interface Neal can use in his browser — both industry demos live |
| Stage 5 | Complete product loop: chat → lead → dashboard → admin config console |
| Stage 6 | Live at a public URL, fully deployed, monitored, handover package ready |

---

*End of Implementation Plan — v3*
*Muhammad Ahtisham · Ladeway · Architecture Exercise Submission*
