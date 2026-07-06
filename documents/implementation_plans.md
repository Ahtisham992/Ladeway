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
