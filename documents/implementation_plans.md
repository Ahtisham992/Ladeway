# Phase 2 — Database Schema, Prisma & Migrations

This phase implements the complete database schema for Ladeway, applying the models from Section 11 of the Specification and configuring the Prisma ORM for use within the NestJS API.

## Open Questions

> [!IMPORTANT]
> **Database Provisioning**
> The plan calls for a free Supabase project to host the PostgreSQL database. I do not have access to create a Supabase account on your behalf. 
> 
> Please choose one of the following options:
> 1. **(Recommended)** You can create a free Supabase project at https://supabase.com, get the connection string (Transaction pooler string for `DATABASE_URL` and Session string for `DIRECT_URL`), and provide them to me. I will store them in `apps/api/.env`.
> 2. Alternatively, if you have Docker Desktop installed and running, I can set up a local `docker-compose.yml` to spin up a local PostgreSQL database for development purposes. Let me know if you prefer this route.

## Proposed Changes

### Database Layer Setup (Prisma)

#### [NEW] [schema.prisma](file:///d:/logistics/apps/api/prisma/schema.prisma)
Initialise Prisma in `apps/api` and implement the complete schema with 8 tables:
- `Tenant`
- `IndustryConfig`
- `User`
- `Conversation`
- `Message`
- `ExtractedData`
- `Lead`
- `LeadAssignment`
This will exactly match the schema provided in Section 11 of the architecture specification, including proper relationships, cascade deletions, and index configurations.

### Database Seeding

#### [NEW] [seed.ts](file:///d:/logistics/apps/api/prisma/seed.ts)
Implement the seed script to populate the database with:
- A test `Tenant`
- Two `IndustryConfig` records (Logistics and Real Estate) showcasing the industry-agnostic configuration capability.
- A test `User` (Admin/Rep role) for dashboard access.

### NestJS Integration

#### [NEW] [database.module.ts](file:///d:/logistics/apps/api/src/database/database.module.ts)
Create the NestJS `DatabaseModule` to export the Prisma service globally.

#### [NEW] [prisma.service.ts](file:///d:/logistics/apps/api/src/database/prisma.service.ts)
Implement the `PrismaService` singleton for interacting with the database. This pattern prevents connection pool exhaustion in persistent Node.js servers and manages connection lifecycle hooks.

#### [MODIFY] [app.module.ts](file:///d:/logistics/apps/api/src/app.module.ts)
Import the `DatabaseModule` into the root application module.

#### [MODIFY] [package.json](file:///d:/logistics/apps/api/package.json)
Add standard Prisma scripts: `migrate dev`, `db seed`, etc. Ensure `@prisma/client` is correctly installed.

## Verification Plan

### Automated Steps
- Run `npx prisma format` to validate the syntax of `schema.prisma`.
- Run `npx prisma migrate dev --name init` to verify the schema can be applied successfully.
- Run `npx prisma db seed` to insert the initial tenant, configs, and users without relational constraint errors.
- Run `npm run type-check` to ensure the generated Prisma Client types are clean and resolvable.

### Manual Verification
- Acknowledge that the Prisma Studio (`npx prisma studio`) successfully displays all tables and foreign key relations.







# Phase 3 — Row-Level Security & Multi-Tenant Isolation

This phase enforces multi-tenancy at the database layer using PostgreSQL Row-Level Security (RLS). This ensures that even if application code inadvertently omits a `tenant_id` filter, cross-tenant data leakage is fundamentally impossible at the database engine level.

## Open Questions

> [!NOTE]
> **Prisma & RLS Implementation Details**
> To set `app.current_tenant_id` on the PostgreSQL connection per request using Prisma, the standard modern approach is to combine **NestJS AsyncLocalStorage (ALS)** (to track the tenant ID across the async request lifecycle) with **Prisma Client Extensions**. 
> Specifically, we will create a method on `PrismaService` (e.g., `this.prisma.withTenant()`) or intercept queries using `$extends` to execute `SELECT set_config('app.current_tenant_id', tenantId, true)` in a lightweight transaction alongside the main query.
> Does this align with your architectural expectations for the NestJS implementation?

## Proposed Changes

### Database RLS Migration

#### [NEW] `prisma/migrations/XXXXXXXXXXXXXX_rls/migration.sql`
Create a raw SQL migration to enable RLS and apply the isolation policy to all tenant-scoped tables:
- `Tenant` (Wait, Tenant table is usually global, but we can secure it or leave it as bypass)
- `IndustryConfig`
- `User`
- `Conversation`
- `Message`
- `ExtractedData`
- `Lead`
- `LeadAssignment`

The policy will look like:
```sql
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Conversation"
  USING ("tenantId" = current_setting('app.current_tenant_id', true));
-- (Applied to all scoped tables)
```
*Note: We will also apply a bypass or `BYPASSRLS` role for the initial seeds/admin tasks if necessary, or conditionally apply it.*

### NestJS Middleware & Context

#### [NEW] `src/tenant/tenant.context.ts`
Implement `AsyncLocalStorage` to store the `tenantId` for the current request lifecycle.

#### [NEW] `src/tenant/tenant.middleware.ts`
Implement `TenantMiddleware`. This middleware will:
1. Extract the `tenantId` from the JWT (or `sessionToken` for public routes, though auth comes in Phase 4). For now, it will look for a `x-tenant-id` header or subdomain to establish context.
2. Store the `tenantId` in the `AsyncLocalStorage` context.

#### [NEW] `src/tenant/tenant.module.ts`
Create the `TenantModule` and register the middleware globally.

### Prisma RLS Extension

#### [MODIFY] `src/database/prisma.service.ts`
Update `PrismaService` to use a Prisma Client Extension that automatically injects `set_config('app.current_tenant_id', ...)` before executing queries when a tenant context is present.

### Cross-Tenant Isolation Test

#### [NEW] `src/tenant/tenant.isolation.spec.ts`
Write an integration test to verify RLS:
1. Create two tenants and data for both.
2. Authenticate as Tenant A (set context).
3. Attempt to query Tenant B's data directly without a `WHERE` clause.
4. Verify the database returns 0 rows.

## Verification Plan

### Automated Tests
- Run `npm run test` targeting the new `tenant.isolation.spec.ts` to mathematically prove that cross-tenant leakage is blocked at the database layer.

### Manual Verification
- We will start the development server, seed a second tenant, and manually attempt to fetch the second tenant's data using the first tenant's context via a temporary endpoint.




# Phase 4 — Authentication & Authorization (NestJS)

This phase establishes the security foundation for the application. We will implement robust JWT-based authentication and role-based access control (RBAC) in NestJS, and build the initial login page in the Next.js frontend to prove end-to-end connectivity.

## Open Questions

> [!NOTE]
> **Authentication Token Transport**
> For secure single-page applications, it's a standard practice to store the JWT inside an `HttpOnly` cookie to prevent XSS attacks from extracting the token. However, standard APIs often just return the JWT in the JSON response body.
> Do you prefer the JWT to be returned purely in the JSON response (simpler API consumption), or should the backend automatically set it as an `HttpOnly` cookie for the Next.js frontend to use implicitly? 
> *(Recommendation: Return in JSON for now; Next.js Server Actions can securely store it in an HttpOnly cookie on the frontend side).*

## Proposed Changes

### 1. API Dependency Installation
Install security packages:
- `@nestjs/passport`, `@nestjs/jwt`, `passport`, `passport-jwt`
- `bcrypt`, `@types/bcrypt`

### 2. NestJS Authentication
#### [NEW] `apps/api/src/auth/auth.module.ts`
Implement `AuthModule` bundling the JWT and Passport dependencies.

#### [NEW] `apps/api/src/auth/auth.service.ts`
Implement `AuthService` handling:
- `validateUser(email, password)`: Verify credentials against bcrypt (cost factor 12).
- `login(user)`: Generate JWT payload: `{ sub: userId, tenantId, role, iat, exp }`.

#### [NEW] `apps/api/src/auth/strategies/jwt.strategy.ts`
Implement `JwtStrategy` to parse the `Authorization: Bearer <token>` header (or cookie, depending on preference).

#### [NEW] `apps/api/src/auth/auth.controller.ts`
Implement `AuthController` exposing:
- `POST /auth/login`: Accepts `{ email, password }`.
- `POST /auth/logout`: Invalidates the token (or clears cookie).

### 3. NestJS Authorization Guards
#### [NEW] `apps/api/src/auth/guards/jwt-auth.guard.ts`
Implement `JwtAuthGuard` to protect authenticated endpoints.

#### [NEW] `apps/api/src/auth/guards/roles.guard.ts`
Implement `RolesGuard` to check the `role` from the JWT payload against required roles.

#### [NEW] `apps/api/src/auth/decorators/roles.decorator.ts`
Implement the `@Roles('ADMIN', 'REP')` decorator.

#### [MODIFY] `apps/api/src/tenant/tenant.middleware.ts`
Refactor the middleware to extract the `tenantId` from the verified JWT payload rather than trusting an insecure `x-tenant-id` header.

#### [MODIFY] `apps/api/prisma/seed.ts`
Update the seed script to hash the test user's password using `bcrypt` instead of inserting plain text.

### 4. Next.js Frontend Integration
#### [NEW] `apps/web/app/login/page.tsx`
Create a beautiful, modern login page implementing dynamic micro-animations and utilizing the Tailwind CSS layout to hit the `POST /auth/login` endpoint.

## Verification Plan
1. **API Integration Test:** Create a temporary `@Roles('ADMIN')` protected endpoint. Attempt to hit it without a token (expect 401). 
2. **Login Verification:** Login via Next.js UI using `admin@logicstics.com`. Assert the JWT is received and stored.
3. **RBAC Verification:** Hit the protected endpoint with the received JWT (expect 200). Attempt with a `REP` user token (expect 403).




# Phase 5 — Ollama & Groq Connectivity & LLM Router Service

This phase integrates the AI inference layer behind a clean, provider-agnostic `LLMRouterService`. This service handles the complexities of streaming responses and network resilience (retries, exponential backoff) before any conversation logic is built on top of it.

## Key Updates from the Previous Plan
1. **Ollama Chat Endpoint Validation**: The Ollama provider will strictly use `POST http://localhost:11434/api/chat` with multi-turn message history `{"role": "user", "content": "..."}` instead of `/api/generate`.
2. **Correct Chunk Parsing**: The stream reader will accurately extract tokens from `chunk.message.content` rather than the single-turn `chunk.response` property.
3. **Exact Model Designation**: Having run `ollama list` locally, the environment variable `OLLAMA_MODEL` will be strictly set to `llama3:latest`.
4. **Groq Provider Implementation**: The Groq API connection will be fully built out (parsing the OpenAI-compatible Server-Sent Events format). The system will switch dynamically between Ollama and Groq based on the `ACTIVE_LLM_PROVIDER` environment variable.

## Proposed Changes

### 1. Application Architecture Layer
#### [NEW] `apps/api/src/ai/ai.module.ts`
Create the `AIModule` to encapsulate all external AI provider interactions.

#### [NEW] `apps/api/src/ai/ai.exceptions.ts`
Implement `AIUnavailableException` to seamlessly handle provider unreachability, connection timeouts, and generic LLM downtime.

### 2. Provider Integrations
#### [NEW] `apps/api/src/ai/llm-router.service.ts`
Implement the central `LLMRouterService`:
- Resolves the provider dynamically via `ConfigService.get('ACTIVE_LLM_PROVIDER')` (values: `ollama` or `groq`).
- A single public method: `stream(messages: LLMMessage[], options?: StreamOptions): AsyncIterable<string>`.
- Internal `streamOllama()` method pointing to `localhost:11434/api/chat`, processing newline-delimited JSON chunks.
- Internal `streamGroq()` method pointing to `https://api.groq.com/openai/v1/chat/completions`, parsing OpenAI-style `data: {...}` lines to extract `chunk.choices[0].delta.content`.
- Incorporates robust exponential backoff logic (3 retries).

### 3. Health Check Endpoints
#### [MODIFY] `apps/api/src/health.controller.ts`
Enhance the health module to include:
- `GET /health/ai` which fires a lightweight ping (generating 1 token) via the `LLMRouterService` to verify the active LLM provider.
- `GET /health/ai/test-stream` a temporary endpoint to pipe the `AsyncIterable<string>` back to the HTTP response to visibly confirm streaming latency natively to the browser.

### 4. Configuration
#### [MODIFY] `apps/api/.env`
Define necessary environment variables:
- `ACTIVE_LLM_PROVIDER=ollama`
- `OLLAMA_URL=http://localhost:11434`
- `OLLAMA_MODEL=llama3:latest`
- `GROQ_API_KEY=`

## Verification Plan

### Automated / Manual Verification
1. Call `GET /health/ai` via `curl` to observe the health status and check if the API is communicating properly with your local RTX 4050 GPU.
2. Hit the test stream via browser `GET /health/ai/test-stream` to visibly see tokens streaming out in real-time.
3. Once Ollama is verified, we can quickly toggle `ACTIVE_LLM_PROVIDER=groq`, supply a dummy API key, and confirm that the API router attempts to parse the OpenAI completion stream correctly.





# Phase 6 — Industry Config Module & Validation

This phase introduces the central nervous system for Ladeway's AI behaviors: the `IndustryConfig`. This module handles the creation, validation, and retrieval of configuration sets (like `QualificationField` arrays and `ScoringRule` definitions) that the LLM will use to drive conversations.

## Proposed Changes

### 1. Configuration Validation Layer
#### [NEW] `apps/api/src/industry-config/schemas/config.schema.ts`
Implement robust Zod schemas matching `packages/types` to validate `fieldsJson` and `scoringRulesJson` structures at write-time.
- `QualificationFieldSchema`:
  ```typescript
  z.object({
    key: z.string().min(1),
    label: z.string().min(1),
    type: z.enum(['text', 'number', 'date', 'enum']),
    required: z.boolean(),
    options: z.array(z.string()).optional(),
    extractionHint: z.string().min(1),
  })
  ```
- `ScoringRuleSchema`:
  ```typescript
  z.object({
    field: z.string().min(1),
    condition: z.enum(['present', 'equals', 'greater_than', 'less_than', 'in']),
    value: z.union([z.string(), z.number(), z.array(z.string())]).optional(),
    weight: z.number().min(0).max(1),
    tier: z.enum(['HOT', 'WARM', 'COLD']).optional(),
  })
  ```

### 2. Configuration Infrastructure
#### [NEW] `apps/api/src/industry-config/industry-config.module.ts`
Create the NestJS `IndustryConfigModule` and integrate it with `@nestjs/cache-manager` using the in-memory store (to be seamlessly swapped for Redis in Phase 7).

#### [NEW] `apps/api/src/industry-config/industry-config.service.ts`
Implement `IndustryConfigService` handling database operations:
- **CRUD Operations**: Standard create, retrieve, update, delete functionality leveraging the multi-tenant Prisma extension.
- **`getActiveConfig(id)`**: Fetches the configuration with a 5-minute cache TTL.
- **Deletion Guard**: Ensures `DELETE` operations abort with an error if the config is tied to active `Conversation` records.

#### [NEW] `apps/api/src/industry-config/industry-config.controller.ts`
Expose the REST API for reps/admins (protected via `JwtAuthGuard` and `RolesGuard`):
- `GET /industry-configs`
- `POST /industry-configs` (Runs Zod validation, returns 422 on failure)
- `GET /industry-configs/:id`
- `PUT /industry-configs/:id` (Runs Zod validation, returns 422 on failure)
- `DELETE /industry-configs/:id`
- `GET /industry-configs/:id/preview` (ADMIN role only: calls `LLMRouterService.stream()` with a single test message "Hello, I'm interested in your services" and returns the plain text response without saving any `Conversation` records).

### 3. Application Registration
#### [MODIFY] `apps/api/src/app.module.ts`
Import and register the newly created `IndustryConfigModule` (and globally register the Cache module).

## Verification Plan

### Automated / Manual Verification
1. I will write an integration test script to send a `POST /industry-configs` request with a malformed `fieldsJson` payload. We will verify that it strictly throws a `422 Unprocessable Entity` with specific field-level validation messages.
2. I will insert a valid config, then call `getActiveConfig(id)` twice. The first call will hit Prisma, and the second call will instantly return from the cache.
3. Finally, I will hit `GET /industry-configs/:id/preview` to verify the LLM seamlessly responds based on the dynamically loaded config parameters without polluting the database.




# Phase 7 — Redis Session Service

This phase establishes the high-speed state management layer for Ladeway's AI conversations using Upstash Redis. Real-time chat requires sub-millisecond read/write latency to maintain context without hitting the relational database on every keystroke or token.

## Proposed Changes

### 1. Redis Infrastructure
#### [NEW] `apps/api/src/redis/redis.module.ts`
Implement `@upstash/redis` natively to guarantee ultra-low latency direct Redis access (crucial for Phase 10 conversation streaming).
- Configure the Upstash Redis client globally utilizing the provided URL (`https://still-crab-125644.upstash.io`) and Token.

#### [MODIFY] `apps/api/.env`
Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

### 2. Session Management Layer
#### [NEW] `apps/api/src/session/types/session.types.ts`
Define the strict TypeScript interfaces conforming to the `packages/types` shared spec:
- `ConversationStatus` enum: `GREETING`, `QUALIFYING`, `EXTRACTING`, `SCORED`, `CLOSED`, `TRANSFERRED`, `ABANDONED`.
- `ConversationSession` interface:
  ```typescript
  interface ConversationSession {
    conversationId: string
    tenantId: string
    configId: string
    status: ConversationStatus
    capturedFields: Record<string, string>
    missingFields: string[]
    turnCount: number
    lastActivityAt: string
  }
  ```

#### [NEW] `apps/api/src/session/session.module.ts`
Create the `SessionModule` to encapsulate all high-speed state interactions.

#### [NEW] `apps/api/src/session/session.service.ts`
Implement `SessionService` utilizing the injected `@upstash/redis` client:
- `createSession(conversationId: string, configId: string, tenantId: string): Promise<void>`
- `getSession(sessionToken: string): Promise<ConversationSession | null>`
- `updateCapturedFields(sessionToken: string, fields: Record<string, string>): Promise<void>`
- `updateStatus(sessionToken: string, status: ConversationStatus): Promise<void>`
- `deleteSession(sessionToken: string): Promise<void>`

### 3. TTL & Expiration Logic
Enforce a 24-hour Time-to-Live (TTL) on all session keys created within `createSession()`. This ensures that abandoned chat widgets auto-expire and don't permanently leak memory.

### 4. Application Registration
#### [MODIFY] `apps/api/src/app.module.ts`
Import and register the newly created `SessionModule` (which leverages the Upstash client).

## Verification Plan

### Automated / Manual Verification
1. Write a test script that executes `createSession()`, instantly followed by `getSession()`.
2. Measure the latency of `getSession()` to confirm it resolves in < 5ms.
3. Test `getSession()` with a non-existent token to verify it gracefully returns `null`.




# Phase 8 — Prompt Engineering Service

This phase constructs the `PromptService`, the critical bridge between our strictly typed configuration/session state and the raw text-based AI models. It is responsible for consistently assembling high-quality, industry-agnostic prompts ensuring the AI behaves exactly according to the active `IndustryConfig`.

## Open Questions

> [!NOTE]  
> **Extraction Schema Definition**  
> The `assembleExtractionPrompt` method expects the LLM to output structured JSON data. To guarantee the LLM formats its output correctly, I will explicitly inject the JSON Schema of the missing fields into the extraction prompt. Do you have a preferred JSON output schema (e.g. `{ "key": "value" }` or `{ "extractedFields": [{ "key": "...", "value": "..." }] }`) that Phase 11 will expect? I plan to default to a flat `{ "field_key": "extracted_value" }` format for simplicity.

## Proposed Changes

### 1. Prompt Engineering Service
#### [NEW] `apps/api/src/ai/prompt.service.ts`
Implement the `PromptService` within the existing `AIModule`:

- **`assembleConversationPrompt(config: IndustryConfig, session: ConversationSession, messages: Message[]): any[]`**
  - **System Prompt**: Constructs the robust system context utilizing `config.personaName`, `config.personaRole`, `config.industryName`, and `config.tone`.
  - **Field State Injection**: Iterates over `config.fieldsJson` and specifically lists the `session.missingFields` directly into the system prompt to guide the LLM's next questions. It also injects already `capturedFields` to provide context and avoid repetition.
  - **Rules**: Embeds standard behavioral instructions (e.g., "Ask only one question at a time", "Do not break character").
  - **Output**: Returns an array of OpenAI-compatible message objects: `[{ role: 'system', content: ... }, ...history, { role: 'user', content: ... }]`.

- **`assembleExtractionPrompt(config: IndustryConfig, session: ConversationSession, recentMessages: Message[]): any[]`**
  - Builds an isolated prompt focused solely on data extraction.
  - Instructs the LLM to analyze the recent conversation context and output a strict JSON object mapping any newly discovered `session.missingFields` based on the `config.fieldsJson` extraction hints.

### 2. Module Registration
#### [MODIFY] `apps/api/src/ai/ai.module.ts`
Register `PromptService` as a provider and export it so that the Conversation API (Phase 10) and Extractor Service (Phase 11) can securely utilize it.

### 3. Unit Testing (Zero Conditional Logic)
#### [NEW] `apps/api/src/ai/prompt.service.spec.ts`
Implement robust Jest unit tests verifying the exact same code path produces vastly different prompts when fed different configs.
1. **Logistics Test**: Pass an 'Alexandra' logistics config and verify the output references logistics fields and freight terminology.
2. **Real Estate Test**: Pass a 'Sarah' real estate config and verify the exact same function dynamically generates a prompt referencing property inquiries and real estate terminology without any internal `if (industry === 'Logistics')` logic.

## Verification Plan

### Automated / Manual Verification
1. I will execute `npm run test` targeting `prompt.service.spec.ts` to mathematically prove the prompts are assembled correctly based on strictly mocked inputs.
2. We will ensure there are zero parsing errors or missing template variables (e.g., no raw `${undefined}` strings) inside the assembled payload.




# Phase 9 — Conversation State Machine

The state machine is the brain that decides what happens next in every conversation turn. Given the current `ConversationSession` (from Redis) and the `IndustryConfig`, it evaluates field capture progress, detects escalation intent, and returns a single `QualificationAction` that Phase 10's conversation loop will act on.

## Proposed Changes

### 1. Types (already created)
#### [NEW] `apps/api/src/qualification/types/qualification.types.ts`
Defines the `QualificationAction` enum with four values:
- `CONTINUE_QUALIFYING` — more fields still needed, keep asking
- `TRIGGER_EXTRACTION` — enough raw conversation to attempt structured JSON extraction
- `TRIGGER_TRANSFER` — user explicitly requested a human
- `CLOSE_CONVERSATION` — all required fields captured

---

### 2. Core Engine
#### [NEW] `apps/api/src/qualification/qualification-engine.service.ts`
The `QualificationEngineService` with one primary method:

```typescript
getNextAction(session: ConversationSession, config: IndustryConfig, lastUserMessage?: string): QualificationAction
```

**Decision logic (evaluated in this priority order):**

1. **Escalation check** — If `lastUserMessage` matches escalation intent → `TRIGGER_TRANSFER`
2. **All fields captured** — If `session.missingFields.length === 0` → `CLOSE_CONVERSATION`
3. **Extraction threshold** — If `session.turnCount >= 2` AND `session.turnCount % 2 === 0` (every 2 turns), trigger an extraction pass → `TRIGGER_EXTRACTION`
4. **Default** — `CONTINUE_QUALIFYING`

> [!NOTE]
> The extraction trigger runs every 2 turns rather than every turn. This avoids burning LLM tokens on extraction when the user has only said "hi" or given a one-word answer. Phase 10 will call extraction when it gets `TRIGGER_EXTRACTION`, then update `missingFields` based on results. If all fields fill up, the next call returns `CLOSE_CONVERSATION`.

**Escalation intent detection** — keyword-based with a curated list:
```typescript
private readonly ESCALATION_KEYWORDS = [
  'speak to a human',
  'talk to a person',
  'transfer me',
  'real person',
  'human agent',
  'speak to someone',
  'talk to someone',
  'connect me',
  'representative',
  'manager',
  'supervisor',
];
```
Uses case-insensitive substring matching. This is deliberately simple and deterministic — the spec mentions "LLM-based detection for ambiguous cases" but that belongs in Phase 15 (Escalation). For Phase 9, keyword matching catches the explicit cases cleanly.

---

### 3. Abandonment Cron Job
#### [NEW] `apps/api/src/qualification/abandonment-cron.service.ts`
A NestJS `@Cron` job that runs hourly to find and mark stale conversations:

- Queries PostgreSQL for conversations where `status NOT IN ('CLOSED', 'TRANSFERRED', 'ABANDONED')` AND `startedAt < NOW() - INTERVAL '24 hours'`
- For each stale conversation:
  - Updates `Conversation.status` to `ABANDONED` in PostgreSQL
  - Deletes the Redis session (cleanup)
- Logs the count of abandoned conversations

> [!IMPORTANT]
> The spec mentions "triggers partial extraction if ≥50% of fields were captured." This requires the `ExtractorService` from Phase 11 which doesn't exist yet. I will add a `// TODO: Phase 11 — trigger partial extraction` placeholder and wire it in during Phase 11. The abandonment marking itself works independently.

---

### 4. Module Registration
#### [NEW] `apps/api/src/qualification/qualification.module.ts`
Creates `QualificationModule`, imports `SessionModule` and `ScheduleModule`, provides and exports `QualificationEngineService` and `AbandonmentCronService`.

#### [MODIFY] `apps/api/src/app.module.ts`
Register `QualificationModule` and `ScheduleModule.forRoot()` (from `@nestjs/schedule` for cron support).

---

### 5. Unit Tests
#### [NEW] `apps/api/src/qualification/qualification-engine.service.spec.ts`
Pure unit tests (no DI needed — the engine is stateless logic):

| Test | Input | Expected Output |
|---|---|---|
| Escalation phrase | `lastUserMessage = "I want to speak to a human"` | `TRIGGER_TRANSFER` |
| All fields captured | `missingFields = []` | `CLOSE_CONVERSATION` |
| Extraction threshold met | `turnCount = 4, missingFields = ['origin']` | `TRIGGER_EXTRACTION` |
| Early conversation | `turnCount = 1, missingFields = ['origin']` | `CONTINUE_QUALIFYING` |
| Escalation takes priority over completion | `missingFields = [], lastUserMessage = "transfer me"` | `TRIGGER_TRANSFER` |

## Open Questions

> [!NOTE]
> **Extraction frequency**: I've proposed triggering extraction every 2 turns. If you'd prefer a different cadence (every turn, every 3 turns, or only after a minimum turn count), let me know.

## Verification Plan

### Automated Tests
- `npx jest qualification-engine.service.spec.ts` — all 5 state transition tests pass

### Manual Verification
- `npm run type-check` — zero TypeScript errors
- Verify NestJS app bootstraps cleanly with the new module and cron scheduler registered



# Phase 10 — Conversation Start & Message API

This is the integration phase. Every service built in Phases 5–9 gets wired into two public REST endpoints that a chat widget (Phase 19) will call. No JWT auth — these are public-facing endpoints identified by `sessionToken`.

## Proposed Changes

### 1. Conversation Service
#### [NEW] `apps/api/src/conversation/conversation.service.ts`

The orchestration layer. Two primary methods:

**`startConversation(configId: string): Promise<StartConversationResponse>`**
1. Load config via `IndustryConfigService.getActiveConfig(configId)` — validates the config exists and is active
2. Create `Conversation` row in PostgreSQL with `tenantId` from the config (since this is a public route, tenant comes from the config, not JWT)
3. Compute `missingFields` from `config.fieldsJson` — extract all `key` values where `required: true`
4. Create Redis session via `SessionService.createSession(sessionToken, conversationId, configId, tenantId)` and immediately set `missingFields`
5. Build greeting prompt via `PromptService.assembleConversationPrompt(config, session, [])` — empty message history for initial greeting
6. Collect the full streamed greeting (non-streaming for the start endpoint — collect all tokens into a single string)
7. Persist the AI greeting as a `Message` in PostgreSQL (sender: `'ai'`)
8. Update session status to `QUALIFYING` and increment turn count
9. Return `{ conversationId, sessionToken, greeting }`

**`sendMessage(sessionToken: string, userMessage: string): AsyncIterable<SSEEvent>`**
1. Load session from Redis — if `null`, throw 404
2. Load config via `IndustryConfigService.getActiveConfig(session.configId)`
3. Persist user message to PostgreSQL (sender: `'user'`)
4. Load conversation history from PostgreSQL (last N messages, capped at ~20 for context window)
5. Build prompt via `PromptService.assembleConversationPrompt(config, session, history)`
6. Stream response from `LLMRouterService.stream(prompt)` — yield each token as an SSE `event: token`
7. After stream completes:
   - Persist AI response to PostgreSQL (sender: `'ai'`)
   - Increment session turn count
   - Call `QualificationEngineService.getNextAction(session, config, userMessage)`
   - If action is `TRIGGER_EXTRACTION`: *(placeholder — Phase 11 will wire this)*
   - If action is `TRIGGER_TRANSFER`: update session status to `TRANSFERRED`
   - If action is `CLOSE_CONVERSATION`: update session status to `CLOSED`
8. Yield final SSE `event: done` with updated session state

> [!IMPORTANT]
> **RLS bypass for public routes**: The conversation endpoints are public (no JWT). The `TenantMiddleware` correctly calls `next()` when no tenant is found, which means RLS via `tenantContext` won't be active. However, the `ConversationService` knows the `tenantId` from the config/session. For PostgreSQL writes (creating conversations, persisting messages), the service must explicitly pass `tenantId` in the data payload. For reads, we query by `sessionToken` (unique) or `conversationId` (primary key), so RLS is not needed for correctness — the tokens themselves act as the access control.

---

### 2. Conversation Controller
#### [NEW] `apps/api/src/conversation/conversation.controller.ts`

Two endpoints, both public (no `@UseGuards(JwtAuthGuard)`):

**`POST /conversations/start`**
- Body: `{ configId: string }`
- Returns: `{ conversationId, sessionToken, greeting }`
- Standard JSON response (not streamed)

**`POST /conversations/:id/message`**
- Body: `{ sessionToken: string, message: string }`
- Returns: SSE stream with NestJS `@Sse()` decorator or raw `res.write()` for manual SSE control
- SSE events:
  ```
  event: token
  data: {"content": "Hello"}

  event: token
  data: {"content": " there"}

  event: done
  data: {"status": "QUALIFYING", "turnCount": 2}

  event: error
  data: {"message": "LLM unavailable"}
  ```

> [!NOTE]
> **SSE implementation approach**: NestJS's `@Sse()` decorator returns an `Observable`, but our `LLMRouterService.stream()` returns an `AsyncIterable`. I will use manual SSE via `@Res()` and `res.write()` for precise control over the event format, flush timing, and error handling. This avoids the Observable conversion overhead and gives us exact control over when `event: done` fires after post-stream processing.

---

### 3. SSE Event Types
#### [NEW] `apps/api/src/conversation/types/conversation.types.ts`

```typescript
interface StartConversationDto {
  configId: string;
}

interface SendMessageDto {
  sessionToken: string;
  message: string;
}

interface StartConversationResponse {
  conversationId: string;
  sessionToken: string;
  greeting: string;
}
```

---

### 4. Module Registration
#### [NEW] `apps/api/src/conversation/conversation.module.ts`
Imports: `AIModule`, `SessionModule`, `IndustryConfigModule`, `QualificationModule`, `DatabaseModule`

#### [MODIFY] `apps/api/src/app.module.ts`
Register `ConversationModule`

---

### 5. Message History Cap

> [!NOTE]
> **Context window management**: The conversation history sent to the LLM will be capped at the **last 20 messages** (10 user + 10 AI turns). This prevents prompt size from growing unbounded on long conversations. The full history remains in PostgreSQL for audit/analytics, but only the recent window is sent to the LLM.

---

## Open Questions

> [!IMPORTANT]
> **Greeting generation — streamed or collected?**
> The `POST /conversations/start` endpoint needs to return the AI greeting. Two options:
> 1. **Collect and return as JSON** (proposed): Simpler for the client — one HTTP request, one JSON response with `greeting` field. The client renders it immediately.
> 2. **Stream as SSE**: More complex for the client to handle on the start endpoint.
>
> I'm proposing option 1 since the greeting is typically short (1-2 sentences) and doesn't benefit from the perceived speed of streaming. The `/message` endpoint is where streaming matters.

> [!NOTE]
> **Extraction wiring**: The plan includes a `TRIGGER_EXTRACTION` placeholder. Phase 11 (Structured Data Extractor) will fill this in. For now, when `getNextAction()` returns `TRIGGER_EXTRACTION`, the service will simply log it and continue qualifying.

## Verification Plan

### Manual Verification
1. `npm run type-check` — zero errors
2. Start the dev server, then test the full flow with curl:
   ```bash
   # Step 1: Start conversation
   curl -X POST http://localhost:3001/conversations/start \
     -H "Content-Type: application/json" \
     -d '{"configId": "<seeded-config-id>"}'

   # Step 2: Send message (SSE stream)
   curl -N -X POST http://localhost:3001/conversations/<id>/message \
     -H "Content-Type: application/json" \
     -d '{"sessionToken": "<token>", "message": "I need to ship freight from NYC to London"}'
   ```
3. Verify messages appear in PostgreSQL after the stream completes
4. Verify Redis session is updated with new turn count

# Phase 11 — Structured Data Extractor

This phase implements the `ExtractorService` inside the `AIModule`. The extractor analyzes the raw conversation transcript and reliably converts it into a typed, structured JSON object with field-level confidence scores. It then persists these as `ExtractedData` rows in PostgreSQL. We will also wire up the `TRIGGER_EXTRACTION` placeholder in `ConversationService` and `AbandonmentCronService`.

## Open Questions

> [!NOTE]
> **Confidence Scoring**
> The model will output extracted values. Should the LLM generate the confidence score itself as part of the JSON output, or should we assign a default confidence (e.g., 1.0) when it successfully extracts a field?
> *Recommendation: Have the LLM return a confidence score (0.0 to 1.0) along with the value in the JSON payload (e.g., `{"origin": {"value": "New York", "confidence": 0.95}}`).*

## Proposed Changes

### 1. Extractor Service & AI Module
#### [NEW] `apps/api/src/ai/types/extractor.types.ts`
Define the types for the extraction result:
```typescript
export interface ExtractedField {
  value: string | null;
  confidence: number;
}
export type ExtractionResult = Record<string, ExtractedField>;
```

#### [NEW] `apps/api/src/ai/extractor.service.ts`
Implement `ExtractorService`:
- **`extract(configId: string, conversationId: string): Promise<ExtractionResult>`**
  - Fetches the conversation messages from PostgreSQL.
  - Fetches the `IndustryConfig`.
  - Builds the extraction prompt via `PromptService.assembleExtractionPrompt`.
  - Calls `LLMRouterService.stream()` and aggregates the response.
  - Parses the JSON.
  - **Error Recovery:** If parsing fails, strips markdown fences (e.g. ` ```json `). If still failing, retries once with a stricter prompt.
  - Returns the parsed `ExtractionResult`.

#### [MODIFY] `apps/api/src/ai/prompt.service.ts`
Update `assembleExtractionPrompt` to explicitly instruct the LLM to return values and confidence scores matching the schema: `{"field_key": {"value": "extracted text", "confidence": 0.9}}`.

#### [MODIFY] `apps/api/src/ai/ai.module.ts`
Provide and export `ExtractorService`.

### 2. Wiring up the Extraction Triggers
#### [MODIFY] `apps/api/src/conversation/conversation.service.ts`
In the `sendMessage` flow, after `getNextAction()` returns `TRIGGER_EXTRACTION`:
- Call `ExtractorService.extract(config.id, session.conversationId)`.
- Update PostgreSQL `ExtractedData` table with the new fields (upsert).
- Update the Redis session's `missingFields` and `capturedFields` based on the extraction result.
- If `missingFields` is now empty, immediately update the state to `EXTRACTING` and transition to `CLOSE_CONVERSATION`.

#### [MODIFY] `apps/api/src/qualification/abandonment-cron.service.ts`
Replace the `// TODO: Phase 11` placeholder:
- For abandoned conversations, check if `>= 50%` of required fields are captured.
- If so, call `ExtractorService.extract()` to ensure partial data is saved.

### 3. Unit & Integration Testing
#### [NEW] `apps/api/src/ai/extractor.service.spec.ts`
Implement test cases:
1. Valid JSON extraction mock.
2. Error recovery (malformed JSON with markdown fences).
3. Fallback on invalid JSON retry.

#### [NEW] `apps/api/test-extraction.ts` (Temporary Test Script)
Write a script to test the extraction logic end-to-end against a mock 10-turn conversation (Logistics) to verify the prompt and parsing work seamlessly with the Llama 3 model.

## Verification Plan

### Automated Tests
- Run `npm run test` (or `npx jest extractor.service.spec.ts`) to verify parsing and error recovery logic.

### Manual Verification
- Execute `npx ts-node test-extraction.ts` and verify that all requested fields are extracted properly, missing fields return `null`, and confidence scores are assigned.
- Complete a conversation via the API and verify that `ExtractedData` rows appear in the database.

# Phase 12 — Lead Scoring Engine & Lead Creation

This phase implements the structured business output of the qualification process. Every completed conversation will produce a scored, tiered, and summarised `Lead` record in the database.

## Open Questions

> [!NOTE]
> **Contact Information Mapping**
> The `Lead` schema requires `contactName`, `contactEmail`, and `contactPhone`. Should we hardcode the system to look for specific extraction keys (e.g., `name`, `email`, `phone`) within `ExtractedData` to map to these columns, or should we just leave them null for now if they aren't explicitly defined as standard keys?
> *Recommendation: Look for common keys (`name`, `contact_name`, `email`, `phone`) in the `ExtractedData`. If found, map them to the Lead row. Otherwise, leave null.*

## Proposed Changes

### 1. Qualification Module & Scoring Service
#### [NEW] `apps/api/src/qualification/scoring.service.ts`
Implement `ScoringService`:
- **`score(rules: ScoringRule[], extractedData: ExtractedData[]): { score: number, tier: LeadTier }`**
  - Iterates through the IndustryConfig's `scoringRulesJson`.
  - Evaluates each condition (`present`, `equals`, `greater_than`, `less_than`, `in`) against the extracted data values.
  - Sums the `weight` of all matching rules.
  - Determines the default tier based on the final score (e.g., `> 80 = HOT`, `50-79 = WARM`, `< 50 = COLD`).
  - If a matching rule includes a specific `tier` override, it applies that override (useful for "dealbreaker" rules).

### 2. Lead Generation & Summarization
#### [MODIFY] `apps/api/src/ai/prompt.service.ts`
- Add **`assembleLeadSummaryPrompt(config, extractedData)`**: Generates a prompt instructing the LLM to write a concise, single-sentence plain-language summary of the lead based on the extracted data.

#### [NEW] `apps/api/src/lead/lead.service.ts` (and LeadModule)
Implement `LeadService`:
- **`createLeadFromConversation(conversationId: string): Promise<Lead>`**
  - Fetches the `Conversation`, `IndustryConfig`, and `ExtractedData`.
  - Calls `ScoringService.score()`.
  - Calls `LLMRouterService.generateSingleToken()` (or stream) with `assembleLeadSummaryPrompt` to generate the summary.
  - Extracts `contactName`, `contactEmail`, `contactPhone` from `ExtractedData` if available.
  - Creates the `Lead` record in PostgreSQL.

### 3. Wiring up the Triggers
#### [MODIFY] `apps/api/src/conversation/conversation.service.ts`
- When `nextAction` evaluates to `CLOSE_CONVERSATION` or `TRIGGER_TRANSFER`, invoke `LeadService.createLeadFromConversation(session.conversationId)` asynchronously (or synchronously before returning the final stream chunk) so the Lead is immediately available in the dashboard.

#### [MODIFY] `apps/api/src/qualification/abandonment-cron.service.ts`
- After triggering partial extraction for an abandoned conversation, invoke `LeadService.createLeadFromConversation()` to ensure we still capture partial leads for abandoned chats!

## Verification Plan

### Automated Tests
- Create `scoring.service.spec.ts` to strictly unit test the `score()` mathematical logic, ensuring all operators (`equals`, `greater_than`, `in`, etc.) evaluate correctly against mock extracted data.

### Manual Verification
- Complete a full test conversation via the `POST /conversations/:id/message` endpoint.
- Verify in PostgreSQL that a `Lead` record is successfully created with a calculated score, assigned tier, and an LLM-generated plain-language summary.



# Phase 13 Implementation Plan: Multi-Industry Demonstration

The objective of Phase 13 is to concretely prove that the AI qualification pipeline works for entirely different industries without any engine code changes, driven purely by configuration records. 

## Proposed Changes

### `apps/api/prisma/seed.ts`
- **[MODIFY] [seed.ts](file:///d:/logistics/apps/api/prisma/seed.ts)**
  - Seed a third `IndustryConfig` (e.g., Legal Services - Personal Injury or Family Law).
  - Add fields appropriate for this new industry (e.g., `case_type`, `incident_date`, `injury_severity`).
  - Add specific scoring rules based on those fields.

### `apps/api/test-e2e-all.ts`
- **[NEW] [test-e2e-all.ts](file:///d:/logistics/apps/api/test-e2e-all.ts)**
  - Consolidate our existing E2E scripts into a single parameterised integration test.
  - The script will iterate through all active `IndustryConfig` records in the database.
  - For each config, it will load a pre-defined set of simulated user messages that satisfy that specific industry's required fields.
  - It will run the qualification conversation, wait for async lead creation, and verify the structured output.

## Documentation
- Create a `multi-industry-proof.md` artifact documenting the complete delta between configs and showcasing how the unified engine handles them correctly.

## Verification Plan

### Automated Tests
- Run `npx ts-node prisma/seed.ts` to inject the new Legal config.
- Run `npx ts-node test-e2e-all.ts` to simulate conversations across Logistics, Real Estate, and Legal.
- Verify that each run produces a Status: `CLOSED` conversation, correct structured `ExtractedData`, and a successfully generated `Lead` record.


# Phase 14: Conversation Resilience & State Recovery

Phase 14 ensures that Ladeway can handle system failures, AI downtime, and user abandonment gracefully without losing critical data.

## Proposed Changes

### 1. Redis TTL Expiry Recovery
When a session expires in Redis (after 24 hours or a server restart), the conversation can still be recovered.
- **Modify `SessionService.getSession(sessionToken)`**: 
  - If Redis returns `null`, query PostgreSQL for the `Conversation` by `sessionToken`.
  - If the conversation is active (`GREETING`, `QUALIFYING`), reconstruct the `ConversationSession` object.
  - Re-derive `capturedFields` by passing the entire conversation message history to `ExtractorService.extract` in a "recovery mode".
  - Re-save the reconstructed session to Redis and return it.

### 2. Conversation Resume functionality
- Ensure `ConversationController.sendMessage` flawlessly accepts a valid `sessionToken` at any time.
- (Implicitly supported by the TTL Recovery fix above) If the user returns after 2 days and sends a message with their old token, the system will reconstruct their session and immediately respond with the next appropriate question based on the recovered state.

### 3. Partial Lead Creation on Abandonment
When a user stops responding, the system cleans up the session. We must ensure valuable partial data is saved as a Lead.
- **Modify `AbandonmentCronService.handleAbandonedConversations()`**:
  - Reorder logic: Currently, it deletes the Redis session *before* trying to extract partial data, causing extraction to fail.
  - Delay Redis session deletion until *after* extraction.
  - Trigger `ExtractorService.extract` for the abandoned conversation.
  - If ≥ 50% of the required fields are captured, create a `Lead` in PostgreSQL but explicitly set `status = "ABANDONED"` and append `"[PARTIAL]"` to the generated summary to alert agents.

### 4. AI Unavailable Mid-Conversation Error Handling
Prevent the conversation loop from breaking when Groq throws a 5xx error or rate limit.
- **Modify `ConversationService.sendMessage()` and `ConversationController.sendMessage()`**:
  - Wrap the LLM streaming call in a try/catch block.
  - If an `AIUnavailableException` (or similar) occurs, yield a standard `event: error` over the SSE stream with a user-friendly message (e.g., *"We are experiencing a temporary issue. Please try sending your message again."*).
  - Crucially, do **not** change the `Conversation` status. Keep it as `QUALIFYING` so the user can literally retry their message seconds later without a broken state machine.

## Verification Plan
### Automated Tests
- Create `test-recovery.ts` to simulate a Redis wipe mid-conversation, verify `SessionService` rebuilds state from Postgres, and confirm the conversation successfully completes.
- Create `test-abandonment.ts` to inject an old conversation with partial data into PostgreSQL, trigger the Cron, and assert that a Lead with status `ABANDONED` is created.
- Create `test-ai-error.ts` to force an AI exception and verify that the API returns an `event: error` while the Database status remains `QUALIFYING`.



# Phase 15 — Escalation & Human Handoff

This phase improves our system's ability to seamlessly hand off conversations to human representatives when the user requests it, or when the AI detects frustration.

## Proposed Changes

We will implement a robust intent detection mechanism and ensure that escalated conversations successfully generate `TRANSFERRED` leads containing all context gathered up to the point of escalation.

### 1. LLM-Based Intent Classifier (`QualificationEngineService`)
Currently, `QualificationEngineService` relies on a strict list of `ESCALATION_KEYWORDS`. We will improve this by introducing a fallback LLM intent classifier for ambiguous phrasing. 
- If a message matches a keyword, we immediately escalate.
- If not, we will pass the message through a fast `LLMRouterService` classification prompt (e.g. `llama-3.1-8b-instant`) to determine if the user intends to speak to a human, or if they are just asking a normal question.
- **Note:** To maintain low latency, this LLM check will only occur if the user's message is short (under ~100 chars) or contains soft keywords like "someone", "manager", "representative", etc.

### 2. Pre-Stream Transfer Interception (`ConversationService`)
Currently, `QualificationEngine` evaluates the next action *after* the conversational LLM generates its response. 
- We will refactor `ConversationService.sendMessage` to evaluate `getNextAction` **before** invoking the conversational LLM.
- If `TRIGGER_TRANSFER` is returned, we will bypass the conversational AI entirely. 
- Instead, we will manually stream a professional, warm closing message directly to the SSE stream (e.g., *"I've noted your request to speak with a team member. I'm transferring your conversation now, and someone will be in touch shortly."*).

### 3. Partial Extraction & Lead Generation (`ConversationService`)
When `TRIGGER_TRANSFER` is executed:
- The conversation status will be immediately transitioned to `TRANSFERRED`.
- The `ExtractorService` will run asynchronously (similar to Phase 14 Abandonment).
- The `LeadService` will generate a Lead with `status: TRANSFERRED` and tag the summary with `[ESCALATED]`, ensuring sales reps know to prioritize this contact.

### 4. Comprehensive Testing (`test-escalation.ts`)
We will create a new E2E test script that simulates:
- A user typing ambiguous phrasing ("I'd prefer to talk to someone" or "human please").
- Verifies that the LLM classifier catches it.
- Verifies that the warm transfer message is streamed back.
- Verifies that a `TRANSFERRED` lead is generated containing the partial data captured prior to escalation.

## Verification Plan

### Automated Tests
- Run `npx ts-node test/test-escalation.ts` to prove that 10 different escalation phrasings all correctly trigger the transfer flow and generate a Lead record.
- Run existing E2E tests (`test-e2e-all.ts`) to ensure the new intent classifier does not introduce false positives that prematurely transfer standard conversations.

## Open Questions

> [!WARNING]  
> **LLM Classifier Latency**  
> Running an intent classification prompt before the conversational prompt adds a blocking network call to the critical path. Are you comfortable with an extra ~300ms latency for messages that trigger the classifier, or should we strictly stick to keyword-based detection with a vastly expanded dictionary?



# Phase 16 — Config CRUD Hardening

This phase focuses on making the `IndustryConfig` API production-ready. We must ensure that configuration data can be safely managed without breaking historical conversation records or losing context for active sessions.

## Goal
The industry config API must be robust, handle all edge cases securely, and allow full management (versioning, deactivation, deletion prevention) via the API as a prerequisite for the dashboard in Phase 25.

## Proposed Changes

### 1. Hardening Delete Operations
Currently, the `IndustryConfig` model is related to `Conversation` via a foreign key (`configId`). Because we deliberately omitted `onDelete: Cascade`, attempting to delete an active config will throw a Prisma constraint error.
- **Action**: Update the `DELETE /configs/:id` endpoint to explicitly handle this. Before attempting deletion, we will query `conversationCount`. 
- If `conversationCount > 0`, we will reject the deletion with a `409 Conflict` and return a user-friendly message explaining that the config can only be deactivated, not deleted.

### 2. Implementing Versioning & Updates (Immutability)
Modifying an existing configuration (e.g. changing fields or scoring rules) could retroactively break the context of historical conversations that referenced that exact schema.
- **Action**: We will modify `PUT /configs/:id` so that updating a configuration is treated as a **version bump**.
- Instead of mutating the row, we will set `isActive: false` on the old `IndustryConfig`.
- We will then create a brand new `IndustryConfig` row with the updated data and `isActive: true`.
- New conversations will pick up the new active version, while old conversations will remain linked to the frozen snapshot.

### 3. Implementing Config Deactivation
- **Action**: Introduce a `PATCH /configs/:id/status` endpoint to explicitly toggle `isActive` without needing to submit a full PUT payload.
- This allows administrators to safely halt new leads for a specific industry without destroying historical data.

### 4. Config Preview Endpoint (`GET /configs/:id/preview`)
- **Action**: Create a new endpoint that accepts a `configId` and a sample `message`. 
- It will invoke the `LLMRouterService` using a simulated conversation context (no DB records created) and stream or return the AI's response.
- This allows administrators to instantly test how changes to the persona or fields will affect the AI's conversational style before setting the config live.

## Verification Plan

### Automated Tests
We will create a new integration test suite (`test-config-crud.ts`) that verifies:
1. Attempting to delete a config with existing conversations yields a `409 Conflict`.
2. Updating a config creates a new active row and deactivates the old one.
3. The preview endpoint returns a valid AI response without creating any `Conversation`, `Message`, or `Lead` records in PostgreSQL.

## Open Questions

> [!NOTE]  
> **Preview Endpoint Structure**  
> Should the `/configs/:id/preview` endpoint be a streaming endpoint using SSE (similar to the real chat API), or a standard JSON endpoint that waits for the full text generation to simplify the frontend dashboard integration later?
