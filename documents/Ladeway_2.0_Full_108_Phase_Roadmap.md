# LADEWAY 2.0 — FULL IMPLEMENTATION ROADMAP (100+ PHASES)
## Granular, SDLC-Tagged Build Plan

*Companion to Ladeway_2.0_Master_Plan.md · Replaces the condensed 11-Epic version with atomic, checkpoint-able phases*

---

## How This Works

Every phase below is small enough to complete, test, and mentally close out in a single sitting — that is the point of the granularity. Each phase carries:

- An **SDLC tag**: [IDEATE] [DESIGN] [BUILD] [TEST] [DEPLOY] [OPERATE]
- A **goal** — one sentence
- **Tasks** — the concrete steps
- **Definition of done** — how you know to stop and move on

Phases are numbered continuously (1–108) across 15 Epics so you always know exactly where you are in the overall arc. Treat this as a living document — as you actually build, you will discover phases that need splitting further or reordering. That customization *is* the SDLC discipline in action, not a deviation from it.

---

# EPIC 0 — FOUNDATION HARDENING
*Phases 1–14 · Fix what v1 skipped before adding anything new*

**Phase 1 [IDEATE] — Technical Debt Audit**
Goal: Know exactly what's fragile before building on top of it.
Tasks: Walk every module in `apps/api/src`; list missing error handling, hardcoded values, untested logic.
Done: `docs/audits/v1-technical-debt.md` exists with a severity-ranked list.

**Phase 2 [DESIGN] — Testing Pyramid Strategy**
Goal: Decide what gets unit vs. integration vs. E2E tested before writing any tests.
Tasks: Map each service to a test tier; identify the 5 most critical user journeys for E2E coverage.
Done: `docs/design/test-strategy.md` with the pyramid diagram and journey list.

**Phase 3 [BUILD] — Test Infrastructure: Unit + Integration**
Goal: Jest fully configured with isolated test database.
Tasks: Configure separate test schema; add Supertest; add test-only seed script.
Done: `npm run test` runs against an isolated DB with zero risk to dev data.

**Phase 4 [BUILD] — Test Infrastructure: E2E**
Goal: Playwright configured against a running local instance.
Tasks: Install Playwright; write one trivial smoke test (landing page loads) to prove the harness works.
Done: `npm run test:e2e` passes locally.

**Phase 5 [BUILD] — Unit Tests: ScoringService**
Goal: Every scoring condition type tested in isolation.
Tasks: Test `present`, `equals`, `greater_than`, `less_than`, `in` conditions; test tier override precedence.
Done: 100% branch coverage on `scoring.service.ts`.

**Phase 6 [BUILD] — Unit Tests: QualificationEngineService**
Goal: Every state transition tested.
Tasks: Test all `QualificationAction` outcomes including escalation-priority-over-completion edge case.
Done: All transitions from the v1 test suite ported and passing.

**Phase 7 [BUILD] — Unit Tests: PromptService**
Goal: Prove industry-agnostic prompt assembly with tests, not just manual verification.
Tasks: Parameterized test running the same assertions against 3+ different IndustryConfig fixtures.
Done: Test proves zero conditional logic produces correct distinct output per config.

**Phase 8 [BUILD] — Unit Tests: ExtractorService**
Goal: JSON parsing and error-recovery paths covered.
Tasks: Test clean JSON, markdown-fenced JSON, malformed JSON retry path, null-field handling.
Done: All extractor code paths exercised by tests.

**Phase 9 [BUILD] — Integration Tests: Auth & Tenant Isolation**
Goal: The single most important guarantee in the system has an automated test forever.
Tasks: Login flow test; cross-tenant query test (must return zero rows); role-guard 403 test.
Done: CI would catch a regression in RLS or auth immediately.

**Phase 10 [BUILD] — Integration Tests: Conversation & Lead APIs**
Goal: Every controller has a happy-path + failure-path test.
Tasks: Cover `/conversations/*`, `/leads/*`, `/industry-configs/*`.
Done: One test file per controller, all passing.

**Phase 11 [TEST] — Coverage Review & Gap Closure**
Goal: No critical path (auth, tenant isolation, billing-adjacent) under 90% coverage.
Tasks: Run coverage report; close any gap in critical paths specifically (not chasing 100% everywhere).
Done: Coverage report reviewed and documented; gaps either closed or explicitly accepted.

**Phase 12 [BUILD] — Production Hosting Migration**
Goal: Eliminate the Render free-tier cold-start problem permanently.
Tasks: Provision Railway paid tier or a self-managed VPS; migrate backend; update DNS/env vars.
Done: `/health` responds in under 300ms consistently, any time of day.

**Phase 13 [DEPLOY] — Zero-Downtime Deploy Verification**
Goal: Prove deploys don't drop in-flight conversations.
Tasks: Start a long conversation; trigger a deploy mid-conversation; verify it completes correctly.
Done: Documented test log showing a clean deploy during active traffic.

**Phase 14 [OPERATE] — Foundation Retro**
Goal: Close the loop on Epic 0 with a written reflection.
Tasks: What was more fragile than expected? What testing habit will you keep going forward?
Done: Short retro note in `docs/retros/epic-0.md`.

---

# EPIC 1 — OBSERVABILITY STACK
*Phases 15–24 · See before you can operate*

**Phase 15 [IDEATE] — Failure Modes That Matter**
Goal: Target observability at real risks, not vanity metrics.
Tasks: List top 5 failure modes (AI provider down, DB pool exhaustion, tenant-specific repeated failures, latency spikes, webhook failures).
Done: `docs/design/observability-priorities.md`.

**Phase 16 [DESIGN] — Structured Log Schema**
Goal: Every log line is machine-parseable and consistently shaped.
Tasks: Define required fields (`tenantId`, `conversationId`, `requestId`, `durationMs`, `level`).
Done: Schema documented and agreed before implementation.

**Phase 17 [BUILD] — Structured Logging Rollout**
Goal: Replace every `console.log` in the codebase.
Tasks: Install Pino; build request-correlation middleware; migrate all services.
Done: `grep -r "console.log" apps/api/src` returns zero results.

**Phase 18 [BUILD] — Distributed Tracing Setup**
Goal: See exactly where time goes in a slow conversation turn.
Tasks: Integrate OpenTelemetry; instrument the conversation pipeline specifically (prompt assembly → LLM call → extraction).
Done: A single trace shows every step's duration for one conversation turn.

**Phase 19 [BUILD] — Error Tracking Integration**
Goal: Never learn about a bug from a customer first.
Tasks: Integrate Sentry (or GlitchTip); wire unhandled exceptions and notable caught errors.
Done: A deliberately thrown test error appears in the dashboard within seconds.

**Phase 20 [BUILD] — Uptime Monitoring**
Goal: Know about downtime before anyone tells you.
Tasks: Configure external uptime pings against `/health` and `/health/ai`.
Done: Monitor is live and has sent at least one successful test alert.

**Phase 21 [BUILD] — Alerting Channel**
Goal: Alerts reach you somewhere you'll actually see them.
Tasks: Wire alerts to Discord/Slack/email/SMS.
Done: A simulated downtime triggers a real notification within 2 minutes.

**Phase 22 [TEST] — Chaos Drill: AI Provider Failure**
Goal: Prove the system degrades gracefully and you're alerted.
Tasks: Point `OLLAMA_BASE_URL`/Groq key to something invalid temporarily; observe behavior.
Done: Customer sees a graceful error, you get alerted, trace shows exactly where it failed.

**Phase 23 [TEST] — Chaos Drill: Database Pool Exhaustion**
Goal: Prove the system doesn't silently hang under DB pressure.
Tasks: Simulate connection pool exhaustion (low pool size + load test); observe.
Done: Documented behavior and any fix applied.

**Phase 24 [OPERATE] — First Real-Traffic Retro**
Goal: Learn from a week of real observability data.
Tasks: Review a week of logs/traces; note surprises.
Done: `docs/retros/epic-1.md` written.

---

# EPIC 2 — VOICE CHANNEL (TWILIO)
*Phases 25–42 · The largest, highest-learning-value addition*

**Phase 25 [IDEATE] — Voice Problem Definition**
Goal: Understand what's genuinely different about voice vs. chat qualification.
Tasks: Write the UX differences; define acceptable latency budget (target < 1.5s post-speech response).
Done: `docs/design/voice-problem-statement.md`.

**Phase 26 [DESIGN] — Telephony Architecture**
Goal: Full pipeline design before any code.
Tasks: Diagram Twilio → STT → NestJS orchestration → LLM → TTS → Twilio; decide schema reuse (channel-agnostic `Conversation`/`Message`).
Done: Architecture diagram + written doc, reviewed against v1's existing schema.

**Phase 27 [DESIGN] — Latency & Fallback Design**
Goal: Design for the failure cases before they happen live on a phone call.
Tasks: Design hold-message fallback, voicemail fallback, timeout handling.
Done: `docs/design/voice-fallback-design.md`.

**Phase 28 [BUILD] — Twilio Account & Number Setup**
Goal: A real phone number exists and can be called.
Tasks: Create Twilio account, buy a test number, configure inbound webhook returning static TwiML.
Done: Calling the number produces an audible static message.

**Phase 29 [BUILD] — Media Streams WebSocket**
Goal: Raw audio flows bidirectionally between Twilio and your backend.
Tasks: Configure Twilio Media Streams; implement the WebSocket endpoint in NestJS.
Done: Audio bytes are visibly received in logs when calling the number.

**Phase 30 [BUILD] — Streaming STT Integration**
Goal: Live transcription of caller speech.
Tasks: Integrate Deepgram (or similar) streaming API; pipe Media Stream audio into it.
Done: Speaking into a test call produces accurate live transcripts in logs.

**Phase 31 [BUILD] — VoiceModule Skeleton**
Goal: A new NestJS module ready to own the voice-specific orchestration.
Tasks: Scaffold `VoiceModule`, `VoiceGateway` (WebSocket), `VoiceOrchestrationService`.
Done: Module registered, compiles, no logic yet.

**Phase 32 [BUILD] — Reuse Conversation Engine for Voice**
Goal: Prove the channel-agnostic design pays off.
Tasks: Wire transcript chunks into the existing `ConversationService`/`QualificationEngineService`.
Done: A voice call produces `Message` rows identical in shape to chat messages.

**Phase 33 [BUILD] — TTS Integration**
Goal: AI responses become audible speech.
Tasks: Integrate ElevenLabs (or Twilio `<Say>` as a cheaper baseline); stream synthesized audio back through Media Streams.
Done: A full turn — speak, AI responds, you hear it — works end to end.

**Phase 34 [BUILD] — Barge-In / Interruption Handling**
Goal: The AI stops talking when interrupted, like a human would.
Tasks: Detect caller speech during TTS playback; halt playback immediately.
Done: Interrupting the AI mid-sentence during a test call works reliably.

**Phase 35 [BUILD] — Silence Detection & Re-Prompting**
Goal: The AI handles dead air gracefully.
Tasks: Detect prolonged silence; trigger a re-prompt ("Are you still there?").
Done: Going silent for 10+ seconds triggers the correct re-prompt.

**Phase 36 [BUILD] — Call Recording & Persistence**
Goal: Every voice conversation is fully auditable like chat.
Tasks: Enable Twilio call recording; store recording URL and full transcript on the `Conversation`.
Done: A completed test call has a playable recording and complete transcript in the DB.

**Phase 37 [BUILD] — Voice-to-Human Transfer**
Goal: Escalation works identically to chat, but for a live call.
Tasks: Implement live call transfer to a configured forwarding number on `TRIGGER_TRANSFER`.
Done: Saying an escalation phrase on a test call transfers it correctly.

**Phase 38 [TEST] — Full Qualification Call Test**
Goal: Prove the entire voice pipeline works together.
Tasks: Run 10+ real test calls covering complete qualification, early hangup, off-topic questions, escalation.
Done: All scenarios produce correct `Conversation`/`Lead` records.

**Phase 39 [TEST] — Latency Benchmarking**
Goal: Quantify real-world voice latency.
Tasks: Measure speech-end-to-audio-start across 20+ calls; log results.
Done: `docs/testing/voice-latency-benchmark.md` with numbers and analysis.

**Phase 40 [TEST] — Interruption & Edge Case Stress Test**
Goal: Voice-specific edge cases don't break the pipeline.
Tasks: Test rapid interruptions, background noise, very short/long utterances.
Done: Documented behavior for each; any breaking bug fixed.

**Phase 41 [BUILD] — Voice Config in Admin Console**
Goal: A tenant can assign a phone number to their IndustryConfig without touching code.
Tasks: Extend the config editor UI from v1 with a phone number field and Twilio provisioning trigger.
Done: An admin can configure and receive a working phone number through the UI.

**Phase 42 [OPERATE] — Voice Epic Retro**
Goal: Capture the learning from the hardest epic in the roadmap.
Tasks: Write what was harder than expected, what you'd architect differently next time.
Done: `docs/retros/epic-2.md`.

---

# EPIC 3 — BILLING & SUBSCRIPTIONS (STRIPE)
*Phases 43–54 · Real payment infrastructure*

**Phase 43 [IDEATE] — Pricing Model Definition**
Goal: A concrete, defensible pricing structure.
Tasks: Define Starter/Growth/Enterprise tiers with specific limits (conversation minutes, configs, voice minutes).
Done: `docs/design/pricing-model.md`.

**Phase 44 [DESIGN] — Billing Data Model**
Goal: Know every entity and state transition before building.
Tasks: Design `Subscription`, `Invoice`, `UsageRecord`; map the full lifecycle state machine.
Done: ER diagram + state machine diagram reviewed.

**Phase 45 [BUILD] — Stripe Product Setup**
Goal: Real Products/Prices exist in Stripe test mode.
Tasks: Create tiers in Stripe dashboard matching Phase 43.
Done: Prices visible and correctly configured in Stripe test mode.

**Phase 46 [BUILD] — Prisma Schema for Billing**
Goal: Database ready to track subscriptions.
Tasks: Add `Subscription`, `Invoice`, `UsageRecord` models with RLS applied.
Done: Migration runs cleanly; RLS verified on new tables.

**Phase 47 [BUILD] — Stripe Checkout Integration**
Goal: A new tenant can actually pay to sign up.
Tasks: Extend onboarding flow with Stripe Checkout session creation.
Done: Test-mode checkout completes and redirects correctly.

**Phase 48 [BUILD] — Webhook Endpoint & Signature Verification**
Goal: Securely receive Stripe events.
Tasks: Build `POST /webhooks/stripe`; verify signatures; reject unsigned/invalid requests.
Done: Stripe CLI test event is received and verified correctly.

**Phase 49 [BUILD] — Webhook Handlers: Subscription Lifecycle**
Goal: Every relevant event correctly updates tenant state.
Tasks: Handle `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
Done: Each event type tested via Stripe CLI trigger, tenant state updates correctly.

**Phase 50 [BUILD] — Webhook Handlers: Invoicing**
Goal: Payment success/failure correctly reflected.
Tasks: Handle `invoice.paid`, `invoice.payment_failed`; implement idempotency (dedupe by event ID).
Done: Replaying the same webhook event twice does not double-process.

**Phase 51 [BUILD] — Usage Metering**
Goal: Track and enforce plan limits.
Tasks: Increment `UsageRecord` on conversation/voice-minute consumption; enforce soft warning at 80%, block/overage at 100%.
Done: Exceeding a test tenant's limit triggers the correct behavior.

**Phase 52 [BUILD] — Stripe Customer Portal**
Goal: Tenants self-manage billing without custom UI.
Tasks: Wire up Stripe Customer Portal session creation from the dashboard settings page.
Done: A tenant can update payment method and view invoices via the portal.

**Phase 53 [TEST] — Webhook Idempotency & Failure Testing**
Goal: Billing code survives real-world webhook chaos.
Tasks: Replay events via Stripe CLI; simulate a failed payment and verify correct account restriction.
Done: `docs/testing/billing-webhook-tests.md` documenting each scenario and result.

**Phase 54 [DEPLOY] — Production Stripe Mode Cutover**
Goal: Real payments work.
Tasks: Switch to live Stripe keys and live webhook endpoint after a full dry run in test mode.
Done: One real (small/refundable) transaction completes successfully end to end.

---

# EPIC 4 — KNOWLEDGE BASE (RAG)
*Phases 55–65 · Ground the AI in real business knowledge*

**Phase 55 [IDEATE] — RAG Use Case Definition**
Goal: Know precisely what problem RAG solves here.
Tasks: Test v1's AI with off-script questions; document the failure mode (hallucination/deflection).
Done: `docs/design/rag-problem-statement.md` with real failing examples.

**Phase 56 [DESIGN] — Chunking & Retrieval Strategy**
Goal: A deliberate design, not a default.
Tasks: Decide chunk size/overlap strategy, embedding model choice, retrieval top-N.
Done: `docs/design/rag-architecture.md`.

**Phase 57 [BUILD] — Prisma Schema for Knowledge Base**
Goal: Storage ready for documents and embeddings.
Tasks: Add `KnowledgeDocument`, `KnowledgeChunk` models; enable pgvector extension.
Done: Migration succeeds; pgvector functional in Supabase.

**Phase 58 [BUILD] — Document Upload Endpoint**
Goal: A tenant can upload a document.
Tasks: `POST /knowledge/upload` accepting PDF/text; store raw file.
Done: A test PDF uploads successfully and is stored.

**Phase 59 [BUILD] — Chunking Pipeline**
Goal: Documents become searchable chunks.
Tasks: Parse uploaded document; split into chunks per the Phase 56 strategy.
Done: A test document produces a reasonable number of well-formed chunks.

**Phase 60 [BUILD] — Embedding Generation**
Goal: Chunks become vectors.
Tasks: Call an embedding API (or local model) per chunk; store vectors via pgvector.
Done: Chunks have populated embedding columns.

**Phase 61 [BUILD] — Similarity Search Function**
Goal: Given a query, retrieve the most relevant chunks.
Tasks: Implement a `KnowledgeService.search(tenantId, configId, query)` using pgvector cosine similarity.
Done: A test query returns sensibly relevant chunks from a known document.

**Phase 62 [BUILD] — Retrieval Integration into PromptService**
Goal: Retrieved knowledge actually changes AI answers.
Tasks: Before assembling the conversation prompt, run retrieval and inject top chunks into context.
Done: An off-script question now gets answered correctly using uploaded content.

**Phase 63 [TEST] — Retrieval Quality Test Set**
Goal: Measurable proof RAG improves accuracy.
Tasks: Build 10+ question/expected-answer pairs from real uploaded docs; measure pre/post-RAG accuracy.
Done: `docs/testing/rag-quality-results.md` with before/after comparison.

**Phase 64 [TEST] — Hallucination Guardrail Test**
Goal: The AI admits uncertainty instead of inventing answers.
Tasks: Ask questions with no good match in the knowledge base; verify graceful "I'm not sure" behavior.
Done: Documented test log showing no confident-but-wrong answers.

**Phase 65 [BUILD] — Admin UI for Knowledge Base**
Goal: Non-technical management of uploaded documents.
Tasks: List/preview/delete documents with processing status indicator.
Done: Full document lifecycle manageable from the dashboard.

---

# EPIC 5 — CAMPAIGN MANAGER (OUTBOUND)
*Phases 66–74 · Proactive AI-driven outreach*

**Phase 66 [IDEATE] — Outbound Use Case Definition**
Goal: Concrete scenarios, not a generic "outbound calling" feature.
Tasks: Define: abandoned-conversation re-engagement, cold WARM-lead follow-up, appointment reminders.
Done: `docs/design/campaign-use-cases.md`.

**Phase 67 [DESIGN] — Campaign Data Model & Dialer Logic**
Goal: Design throttling and compliance rules before building.
Tasks: Design `Campaign`, `CampaignTarget`; design calling-window and max-concurrent-calls rules.
Done: `docs/design/campaign-architecture.md`.

**Phase 68 [BUILD] — Prisma Schema for Campaigns**
Goal: Storage ready.
Tasks: Add `Campaign`, `CampaignTarget` models with RLS.
Done: Migration succeeds, RLS verified.

**Phase 69 [BUILD] — Contact List Upload**
Goal: A tenant can upload a target list.
Tasks: CSV upload with phone number validation.
Done: A test CSV uploads and populates `CampaignTarget` rows correctly.

**Phase 70 [BUILD] — Outbound Dialer Service**
Goal: Calls actually get placed from a queue.
Tasks: Build the service consuming the campaign queue, respecting throttle/window rules, reusing Epic 2's voice orchestration.
Done: A small test campaign places real outbound calls correctly.

**Phase 71 [BUILD] — Outcome Tracking**
Goal: Know what happened on every call.
Tasks: Track connected/voicemail/no-answer/failed outcomes per `CampaignTarget`.
Done: Outcomes correctly recorded after a test campaign run.

**Phase 72 [BUILD] — Campaign Monitoring Dashboard**
Goal: Real-time visibility into campaign performance.
Tasks: Build a dashboard page extending v1's analytics patterns — calls placed/connected/converted.
Done: Dashboard accurately reflects a live test campaign.

**Phase 73 [TEST] — Small-Scale Real Campaign Test**
Goal: Prove the whole pipeline end to end.
Tasks: Run a real (consenting-test-numbers-only) campaign of 5–10 targets.
Done: Documented results matching dashboard numbers exactly.

**Phase 74 [OPERATE] — Campaign Epic Retro**
Goal: Capture learnings.
Tasks: What compliance/throttling edge case surprised you?
Done: `docs/retros/epic-5.md`.

---

# EPIC 6 — CI/CD PIPELINE
*Phases 75–82 · Automate commit-to-production*

**Phase 75 [DESIGN] — Pipeline Stage Sequence**
Goal: Know the exact pipeline shape before building it.
Tasks: Design: lint → type-check → unit → integration → build → staging-deploy → smoke-test → manual-gate → prod-deploy.
Done: `docs/design/cicd-pipeline.md`.

**Phase 76 [BUILD] — GitHub Actions: Lint & Type-Check**
Goal: Basic quality gate on every PR.
Tasks: Workflow running ESLint and `tsc --noEmit` across both apps.
Done: A deliberately broken PR is blocked correctly.

**Phase 77 [BUILD] — GitHub Actions: Test Suite**
Goal: Unit + integration tests run automatically.
Tasks: Add test execution to the PR workflow using the isolated test DB from Phase 3.
Done: A deliberately failing test blocks the PR.

**Phase 78 [BUILD] — Staging Environment Provisioning**
Goal: A real staging environment exists, separate from production.
Tasks: Provision separate Railway/Vercel environments and a separate Supabase project/branch for staging.
Done: Staging is reachable at its own URL with its own isolated data.

**Phase 79 [BUILD] — GitHub Actions: Auto-Deploy to Staging**
Goal: Merges to `main` deploy automatically to staging.
Tasks: Add deploy job triggered on merge.
Done: A test merge appears live on staging within minutes.

**Phase 80 [BUILD] — Automated Smoke Test Against Staging**
Goal: Catch a broken deploy before it can reach production.
Tasks: Playwright test hitting the live staging URL — start conversation, send message, verify response.
Done: Smoke test passes against a healthy staging deploy.

**Phase 81 [BUILD] — Manual Production Approval Gate**
Goal: A human decision stands between staging and production.
Tasks: Configure GitHub environment protection requiring manual approval.
Done: Production deploy job pauses for approval and proceeds correctly once approved.

**Phase 82 [TEST] — Rollback Drill**
Goal: Prove you can recover from a bad deploy quickly.
Tasks: Deliberately deploy a broken change to staging; confirm smoke test blocks promotion; practice manual rollback.
Done: `docs/testing/rollback-drill-log.md` documenting the exercise.

---

# EPIC 7 — SECURITY HARDENING & AUDIT
*Phases 83–90 · Verify, don't assume*

**Phase 83 [IDEATE] — Threat Model**
Goal: Know your actual attack surface.
Tasks: List realistic threats — cross-tenant data access, credential stuffing, prompt injection, webhook forgery.
Done: `docs/design/threat-model.md`.

**Phase 84 [BUILD] — Dependency Vulnerability Scanning**
Goal: Known-vulnerable packages get caught automatically.
Tasks: Add Dependabot or Snyk to CI; fail build on high/critical findings.
Done: A deliberately outdated/vulnerable test dependency is flagged.

**Phase 85 [BUILD] — Secrets Rotation**
Goal: No credential exposed during v1's build process remains live.
Tasks: Rotate Supabase, Upstash, Groq, and JWT secret credentials; update all environments.
Done: Old credentials confirmed revoked; app functions on new credentials.

**Phase 86 [TEST] — Manual Security Review: Data Isolation**
Goal: Prove tenant isolation holds under adversarial testing.
Tasks: Attempt cross-tenant access with a manipulated JWT; attempt SQL-injection-style inputs.
Done: All attempts correctly fail; documented in the audit doc.

**Phase 87 [TEST] — Manual Security Review: Prompt Injection**
Goal: The AI resists being manipulated by malicious user input.
Tasks: Attempt "ignore previous instructions," system-prompt extraction, and role-confusion attacks against the live chat.
Done: Documented results for each attempt.

**Phase 88 [BUILD] — Prompt Injection Hardening**
Goal: Close any gaps found in Phase 87.
Tasks: Add explicit anti-injection instructions to the system prompt template; sanitize obviously malicious input patterns.
Done: Previously successful injection attempts from Phase 87 now fail.

**Phase 89 [BUILD] — Rate Limiting Tuning**
Goal: Limits fit real usage patterns, not arbitrary defaults.
Tasks: Set differentiated limits for public conversation endpoints vs. authenticated dashboard endpoints.
Done: Load-testing confirms limits trigger at the right thresholds.

**Phase 90 [DEPLOY] — Written Security Audit**
Goal: A real audit artifact exists.
Tasks: Compile every finding from Phases 83–89 with severity and resolution status.
Done: `docs/audits/security-audit-v2.md` complete and every finding closed or explicitly accepted.

---

# EPIC 8 — PUBLIC API & INTEGRATIONS
*Phases 91–97 · Let Ladeway talk to a tenant's stack*

**Phase 91 [DESIGN] — Public API Surface Design**
Goal: A clean, versioned, documented-from-the-start API contract.
Tasks: Design `/v1/...` routes, separate from internal dashboard API, authenticated by API key.
Done: `docs/design/public-api-spec.md` (OpenAPI format ideally).

**Phase 92 [BUILD] — API Key Management**
Goal: Tenants can generate and revoke their own keys.
Tasks: Admin console addition — generate/revoke/view-last-used.
Done: A generated key authenticates correctly against a test public endpoint.

**Phase 93 [BUILD] — Public Leads API**
Goal: Read-only external access to a tenant's own lead data.
Tasks: `GET /v1/leads`, `GET /v1/leads/:id`, scoped strictly to the authenticated tenant.
Done: Cross-tenant access via API key correctly fails.

**Phase 94 [BUILD] — Outbound Webhook System**
Goal: Real-time push notifications to external systems.
Tasks: On `lead.created`/`lead.updated`, POST signed payload to tenant-configured URL with retry-with-backoff.
Done: A test receiving endpoint gets correctly notified with a verifiable signature.

**Phase 95 [TEST] — Webhook Reliability Testing**
Goal: Prove retries and failure handling work.
Tasks: Point a webhook at a deliberately-down endpoint; verify retry behavior and eventual graceful failure logging.
Done: `docs/testing/webhook-reliability-log.md`.

**Phase 96 [BUILD] — API Rate Limiting**
Goal: Public API is abuse-resistant.
Tasks: Per-API-key rate limits, tuned separately from internal endpoints.
Done: Exceeding the limit returns a correct 429 with retry-after header.

**Phase 97 [BUILD] — Generic Webhook / Zapier-Style Connector (Stretch)**
Goal: Non-technical tenants can integrate without code.
Tasks: Document a generic webhook pattern usable with Zapier/Make; optionally build a minimal Zapier app.
Done: A documented, working integration example exists.

---

# EPIC 9 — WHITE-LABEL & BRANDING
*Phases 98–102 · Make each tenant's instance feel like their own*

**Phase 98 [DESIGN] — Branding Data Model**
Goal: Know exactly what's brandable.
Tasks: Design logo URL, primary color, custom domain fields on `Tenant`.
Done: `docs/design/branding-model.md`.

**Phase 99 [BUILD] — Prisma Schema & Admin UI for Branding**
Goal: Tenants can set their own branding.
Tasks: Migration + admin console page for logo upload and color picker.
Done: A test tenant's branding saves and persists correctly.

**Phase 100 [BUILD] — Branded Chat Widget**
Goal: The widget visually reflects tenant branding while keeping the base design system intact.
Tasks: Widget reads tenant branding at load time and applies it dynamically.
Done: Two different tenants' widgets look visibly distinct, correctly.

**Phase 101 [BUILD] — Custom Domain Support**
Goal: A tenant can use their own subdomain.
Tasks: Integrate Vercel's custom domain API (or equivalent) for per-tenant domain mapping.
Done: A test custom domain correctly routes to the tenant's branded widget.

**Phase 102 [TEST] — Multi-Tenant Branding Isolation Test**
Goal: No branding leaks across tenants.
Tasks: Load two tenants' widgets side by side; verify complete isolation.
Done: Documented test confirming zero cross-tenant branding leakage.

---

# EPIC 10 — DOCUMENTATION SITE
*Phases 103–106 · The artifact that makes this feel like a real product*

**Phase 103 [BUILD] — Docs Site Scaffold**
Goal: A real documentation site exists, separate from the marketing page.
Tasks: Stand up Mintlify/Docusaurus; deploy to `docs.ladeway...`.
Done: Site is live with a placeholder homepage.

**Phase 104 [BUILD] — API Reference**
Goal: Every public endpoint from Epic 8 is documented with examples.
Tasks: Write request/response examples for each `/v1/...` route.
Done: A developer could integrate using only the docs, no other context.

**Phase 105 [BUILD] — Integration Guides**
Goal: Practical how-to content.
Tasks: Write "Embed the chat widget," "Set up your first IndustryConfig," "Connect a webhook."
Done: Three complete guides published.

**Phase 106 [BUILD] — Changelog**
Goal: A running record of what shipped.
Tasks: Start a changelog now; backfill major v1 and v2 milestones.
Done: Changelog live and part of your ongoing habit going forward.

---

# EPIC 11 — LAUNCH READINESS
*Phases 107–108 · Ship it like a real product*

**Phase 107 [TEST] — Full-System Regression Pass**
Goal: Every epic still works together, not just in isolation.
Tasks: Run the complete Logicstics-style manual test plan (chat + voice + billing + knowledge base) end to end one final time.
Done: `docs/testing/v2-full-regression-log.md` — all green.

**Phase 108 [OPERATE] — Launch Retro & Public Write-Up**
Goal: Close the project loop and capture the story for your portfolio.
Tasks: Write a public-facing case study (blog post or README section) covering the journey from v1 exercise to v2 market-ready product — what you built, what you learned, what you'd do differently.
Done: Published write-up you'd be proud to link in any application.

---

## Summary Table — What Each Epic Delivers

| Epic | Phases | Core Deliverable |
|---|---|---|
| 0 — Foundation | 1–14 | Real test suite, production hosting |
| 1 — Observability | 15–24 | Logs, traces, errors, alerts |
| 2 — Voice | 25–42 | Real Twilio phone qualification |
| 3 — Billing | 43–54 | Live Stripe subscriptions |
| 4 — Knowledge Base | 55–65 | RAG-grounded AI answers |
| 5 — Campaigns | 66–74 | Outbound AI calling |
| 6 — CI/CD | 75–82 | Automated deploy pipeline |
| 7 — Security | 83–90 | Audited, hardened system |
| 8 — Public API | 91–97 | External integrations |
| 9 — White-Label | 98–102 | Per-tenant branding |
| 10 — Docs | 103–106 | Public documentation site |
| 11 — Launch | 107–108 | Full regression + case study |

---

*This is a living document. As you build, phases will split, merge, or reorder — update this file as you go so it always reflects reality, not just the original plan. That habit of keeping the plan honest is itself part of the SDLC discipline this whole roadmap is trying to teach.*
