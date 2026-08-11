# Ladeway v1 — Technical Debt Audit

**Date:** 2026-08-11
**Objective:** Identify fragile components, missing coverage, and hardcoded configurations before embarking on Ladeway 2.0 (Epic 0, Phase 1).

## 1. High Severity — Testing Gaps

The most significant technical debt from the 1-week sprint is the lack of test coverage across critical system boundaries. While business logic (qualification engine, scoring) has solid unit tests, the integration points are completely uncovered.

- **`auth.service.ts` & `tenant.middleware.ts` (0% Coverage)**: The core multi-tenancy and authentication layers have no automated tests. If RLS context propagation breaks during an upgrade, we won't know until a tenant sees another tenant's data.
- **`conversation.service.ts` (0% Coverage)**: The central orchestration loop has no tests. The complex state transitions and integration between LLM, Redis, and Postgres are verified manually.
- **`lead.service.ts` (0% Coverage)**: The output generator that actually creates value for the customer lacks coverage.
- **`llm-router.service.ts` (0% Coverage)**: Network retries, exponential backoffs, and provider failover logic are untested.

**Action Required:** Implement the Testing Pyramid strategy defined in Epic 0, specifically prioritizing E2E and integration tests for Auth and Conversation.

## 2. High Severity — Error Handling & Streaming

- **Dropped Tokens in AI Streams (`llm-router.service.ts`)**: 
  In the `streamOllama` method (line 105), raw stream chunks are split by `\n` and immediately passed to `JSON.parse`. If a JSON payload is split across two network packets (which happens frequently over TCP), the `try/catch` block simply swallows the error, effectively deleting those tokens from the AI's response without logging anything. We need a proper buffer to accumulate partial lines before parsing.
- **Global Error Handling**: There is no global exception filter (`APP_FILTER`). Unhandled exceptions currently bubble up as generic 500 errors without structured logging or standardized error payloads for the frontend.
- **Missing Database Transaction Safety**: Certain multi-step operations (e.g., updating Redis state, creating a Lead, and marking a Conversation as closed) are not wrapped in atomic transactions. A partial failure leaves the system in a fractured state.

## 3. Medium Severity — Configuration & Hardcoded Values

- **Raw `process.env` Usage**: Files like `main.ts` (line 47) and `prisma.service.ts` (line 13) access `process.env` directly. This bypasses the NestJS `ConfigModule` validation layer. If `DATABASE_URL` or `PORT` is missing, the app crashes at runtime instead of failing fast at bootstrap.
- **Magic Strings**: AI Models (e.g., `llama3:latest`, `llama-3.1-8b-instant`) and URLs are embedded in `llm-router.service.ts` rather than being provided by the environment or tenant config.
- **Console Logging**: The application lacks a structured logger (like `pino`). While `console.log` statements have been mostly cleaned up, errors are still logged generically, which provides no correlation IDs or structured data for observability tools.

## Conclusion

Before building new features, we must solidify the foundation (Epic 0). The priority order should be:
1. Fix the silent token dropping bug in `llm-router.service.ts` immediately (can be part of the test-fixing phases or done proactively).
2. Build the testing infrastructure (Unit, Integration, E2E) and cover the exposed services as outlined in Phases 2-10.
3. Migrate to `@nestjs/config` for strict environment validation and robust logging in Epic 1.
