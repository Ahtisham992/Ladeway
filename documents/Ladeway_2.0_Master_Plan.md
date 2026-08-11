# LADEWAY 2.0 — MASTER PLAN
## From Architecture Exercise to Market-Ready SaaS Product

*A personal deep-build project — learn by shipping, not just by reading*

---

## Table of Contents

1. Why This Version Exists
2. Product Vision — What "Market-Ready" Actually Means
3. The SDLC Methodology You Will Follow
4. What's Changing From v1 (The Exercise) to 2.0
5. New Capability Areas (The Big Additions)
6. Learning Objectives — What You Should Walk Away Knowing
7. Tooling — Antigravity, Claude Code, and How to Split Work Between Them
8. Success Criteria for "Done"
9. How to Use the Companion Roadmap Document

---

## 1. Why This Version Exists

Ladeway v1 was built in roughly one week under interview pressure — and it held up well. It has a working AI conversation engine, a proven industry-agnostic design, multi-tenant Row-Level Security, and a full dashboard. That is a strong foundation, not a finished product.

v2.0 is a different kind of project. It is not about speed anymore. It is about depth — taking every corner you cut in v1 and doing it properly, adding the capabilities a real investor or real customer would expect, and using the build as a structured learning path through the parts of software engineering that a one-week sprint never has time for: testing discipline, observability, security hardening, real telephony infrastructure, billing, and proper SDLC process.

**The target:** something you could genuinely put in front of a paying customer, an investor, or a hiring manager and say "this is production software, not a demo."

---

## 2. Product Vision — What "Market-Ready" Actually Means

A demo proves a concept works. A market-ready product proves it survives contact with reality. The gap between the two is where most of the real learning lives:

| Demo (v1) | Market-Ready (v2.0) |
|---|---|
| Works when you drive it carefully | Works when a stranger uses it badly |
| One happy path tested manually | Automated test suite covering edge cases |
| Errors sometimes crash the flow | Every failure mode has a graceful fallback |
| No monitoring — you find bugs by luck | Observability tells you about bugs before users do |
| Chat only | Chat + Voice (Twilio) + SMS |
| Free-tier hosting, cold starts | Production hosting, no cold starts, autoscaling awareness |
| No billing — imaginary "plans" | Real Stripe subscription billing |
| Manual config only | Knowledge base with retrieval-augmented answers |
| Security by good intentions | Security verified by audits and pen-test-style review |
| One giant implementation blob | Proper SDLC: ideate → design → build → test → deploy → iterate |

---

## 3. The SDLC Methodology You Will Follow

This project runs through six explicit stages, revisited in a loop, not a straight line. Each stage has its own document and its own definition of done.

### Stage A — Ideate
Define the problem precisely before touching code. For each major feature area (voice, billing, knowledge base, etc.) write a one-page problem statement: who needs this, what breaks without it, what "good" looks like.

### Stage B — Design
Before implementation: data model changes, sequence diagrams, API contracts, and a written list of trade-offs considered and rejected. This is where you practice thinking like a system designer, not just a coder.

### Stage C — Develop
Implementation, following the phased roadmap. Every feature branch starts from a design doc, not from an empty file.

### Stage D — Test
Nothing is "done" until it has: unit tests for logic, integration tests for the API surface, and at least one manual end-to-end walkthrough recorded in a test log. Testing is Stage D, not an afterthought squeezed into Stage C.

### Stage E — Deploy
CI/CD pipeline runs the test suite automatically, then deploys to staging, then (after manual approval) to production. You will build this pipeline yourself rather than clicking "deploy" by hand.

### Stage F — Operate & Iterate
Once live, you watch it. Error tracking, uptime monitoring, and a lightweight weekly retro where you write down what broke, what you learned, and what to improve next. This stage feeds back into Stage A for the next feature.

**The loop, visually:**

```
Ideate → Design → Develop → Test → Deploy → Operate
   ↑                                            │
   └────────────── feeds back ──────────────────┘
```

You are not expected to run every feature through all six stages formally — but every *major* capability in the roadmap (voice, billing, knowledge base) should visibly pass through this loop, with a short written artifact at each stage. This is the discipline that separates "I built a feature" from "I understand how software gets built professionally."

---

## 4. What's Changing From v1 to 2.0

### Kept as-is (already solid):
- Core industry-agnostic conversation engine
- IndustryConfig-as-data architecture
- PostgreSQL + Row-Level Security multi-tenancy
- NestJS module structure
- Next.js frontend architecture

### Being rebuilt properly:
- **Hosting** — move off free-tier Render/cold-start infrastructure onto something production-grade (Railway paid tier, Fly.io, or a small VPS you manage yourself for the learning value)
- **Testing** — retrofit a real test suite; v1 had almost none
- **AI provider** — formalize the LLM Router to genuinely support multiple providers (Groq, OpenAI, Anthropic, self-hosted) with automatic failover, not just a config flag
- **Error handling** — audit every service for unhandled promise rejections and silent failures

### Being added new:
- Voice channel via Twilio (the single biggest addition)
- Stripe billing and subscription management
- Knowledge base with vector search (RAG)
- Campaign manager (outbound calling/messaging)
- Full observability stack (logging, tracing, alerting)
- CI/CD pipeline with automated testing gates
- Security hardening pass with a documented audit
- White-label branding per tenant
- Public API + webhook system for integrations
- Proper documentation site (not just README)

---

## 5. New Capability Areas (The Big Additions)

### 5.1 Voice Channel — Twilio Integration
This is the headline addition and mirrors what Resonate (the tool Neal showed you) actually does. Customers will be able to **call a real phone number** and have the same qualification conversation by voice that they currently have by chat — same underlying engine, new input/output layer.

Requires: Twilio Voice + Media Streams, a speech-to-text pipeline (streaming), a text-to-speech pipeline, and a real-time orchestration layer handling turn-taking and barge-in (interruption handling). This is genuinely the hardest technical addition in the whole roadmap and the one with the most learning value — real-time systems, audio streaming, and low-latency constraints are a different discipline from typical CRUD work.

### 5.2 Billing — Stripe Subscriptions
Real subscription tiers (Starter / Growth / Enterprise), usage-based add-ons (extra conversation minutes), Stripe Checkout for signup, Stripe Customer Portal for self-service plan management, and webhook handling for subscription lifecycle events (renewals, failures, cancellations). This teaches you the parts of SaaS engineering that portfolios almost never cover — payment webhooks are notoriously tricky to get right.

### 5.3 Knowledge Base — Retrieval-Augmented Generation (RAG)
Tenants upload their actual business documentation (service list, pricing, policies). Content is chunked, embedded, and stored in a vector database (pgvector, already in your stack). When a customer asks something outside the qualification script ("do you handle international customs?"), the AI retrieves relevant knowledge and answers accurately instead of guessing. This is your hands-on introduction to RAG — one of the most in-demand AI engineering skills right now.

### 5.4 Campaign Manager — Outbound Calling/Messaging
Upload a contact list, launch an AI-driven outbound campaign (via the voice or SMS channel), with calling-window rules, throttling, and live campaign performance tracking. Builds directly on the voice infrastructure from 5.1.

### 5.5 Observability Stack
Structured logging (not console.log), distributed tracing across the AI pipeline (so you can see exactly where latency comes from in a slow conversation turn), error tracking (Sentry or similar), and uptime/alerting so you know about outages before a customer tells you.

### 5.6 CI/CD Pipeline
GitHub Actions running: lint → type-check → unit tests → integration tests → build → deploy to staging → (manual gate) → deploy to production. You will hand-build this rather than relying on Vercel/Railway's automatic git-push-to-deploy, specifically so you understand what a real pipeline does.

### 5.7 Security Hardening & Audit
A formal pass: dependency vulnerability scanning, secrets rotation policy, rate limiting tuned properly, OWASP Top 10 review against your own API, and a written security audit document — the kind of artifact that matters in real engineering orgs.

### 5.8 Integrations & Public API
A documented public API (versioned, rate-limited, API-key authenticated) plus outbound webhooks so a tenant's Ladeway leads can push into their own CRM (Salesforce, HubSpot) or a Zapier-style automation.

### 5.9 Documentation Site
Not a README — a real docs site (using something like Docusaurus or Mintlify) covering API reference, integration guides, and a changelog. This is what separates "a repo" from "a product."

---

## 6. Learning Objectives — What You Should Walk Away Knowing

By the end of this build you should be able to speak fluently and specifically about:

- **Real-time systems** — how streaming audio/text pipelines work, why latency budgets matter, how barge-in/interruption handling is implemented
- **Payment infrastructure** — how Stripe webhooks work, why idempotency matters in webhook handlers, subscription lifecycle edge cases
- **RAG systems** — chunking strategy, embedding models, vector similarity search, and where RAG helps vs. where it hallucinates
- **Observability** — the difference between logs, metrics, and traces, and when each one is the right tool
- **CI/CD** — how a real deployment pipeline is structured, what a "staging gate" protects you from
- **Security practice** — how to actually audit your own system rather than just hoping it's secure
- **SDLC discipline** — how to move from idea to shipped feature with proper design and testing steps, not just "start coding"

Write a short note-to-self after each major stage capturing what surprised you or what you'd do differently. This is where the actual learning compounds — not in the code, in the reflection.

---

## 7. Tooling — Antigravity, Claude Code, and How to Split Work

**Antigravity IDE** — use this as your primary driver for exploratory and design work: reading the codebase, planning a phase, drafting design docs, reviewing diffs before committing. Good for the "thinking" parts of Stage A and B.

**Claude Code** — use this for focused implementation execution once a phase's design is settled: "implement Phase X exactly as specified in the design doc" style prompts, similar to how v1 was built. Good for Stage C (Develop) and Stage D (Test) once the shape of the work is clear.

**A practical split:**
1. Open the phase in Antigravity, read the relevant design doc, sanity-check the plan against the actual current codebase
2. Hand the confirmed plan to Claude Code for implementation, phase by phase, exactly as you did in v1
3. Come back to Antigravity to review the diff, run it locally, and write the Stage D test log
4. Only move to the next phase once Stage D is signed off

This mirrors how many real engineering teams actually work — one tool/person for planning and review, another (or the same person switching hats) for focused execution.

---

## 8. Success Criteria for "Done"

Ladeway 2.0 is done when all of the following are true simultaneously:

- [ ] A customer can qualify by **voice** (real phone call) as well as chat
- [ ] A tenant can subscribe and pay via **Stripe**, with working webhook-driven plan management
- [ ] The AI answers off-script questions accurately using the **knowledge base**
- [ ] A campaign can be launched and tracked for **outbound** contact
- [ ] The test suite has meaningful coverage — unit tests for business logic, integration tests for every API route, and at least one full E2E test per critical flow
- [ ] CI/CD deploys automatically to staging and requires manual approval for production
- [ ] A security audit document exists and every finding has been resolved or explicitly accepted as a known risk
- [ ] Structured logging, tracing, and alerting are live and you have personally watched a real conversation trace through the system
- [ ] A public docs site exists with API reference and integration guides
- [ ] You can explain, out loud, without notes, every architectural decision in this document and why it was made

---

## 9. How to Use the Companion Roadmap

The **Ladeway_2.0_Implementation_Roadmap.md** document breaks this master plan into a long sequence of concrete phases — organized by SDLC stage within each capability area, not just a flat feature list. Work through it top to bottom. Do not skip the Design or Test phases even when you're excited to jump straight to building — that discipline is half the point of this version.
