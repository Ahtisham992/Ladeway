# Epic 1 Retrospective: Observability Stack

## What We Shipped
- **Structured JSON Logging:** Migrated all `console.error` and standard NestJS logs to `nestjs-pino`. Every log line now includes a request correlation ID (`reqId`) for easy debugging.
- **Distributed Tracing:** Implemented `@opentelemetry/sdk-node` and auto-instrumentations. Added custom spans for the AI Inference Pipeline (`assemble_prompt`, `llm_inference_stream`, `extraction_parser`), allowing us to visualize where time goes during a chat session in Jaeger.
- **Error Tracking & Alerting:** Built a `GlobalExceptionFilter` that intercepts all unhandled errors (500s). It automatically reports the full stack trace and metadata to **Sentry** and fires a critical alert to our **Discord Webhook** via a custom `AlertingService`, while safely returning a sanitized error message to the client to avoid leaking internals.

## Chaos Drills Results
We ran the following drills to ensure our stack performs under failure:
- **Unhandled Exception (Code Level):** We built a `/health/chaos` endpoint that throws a raw JavaScript error.
  - *Result:* Sentry successfully ingested the stack trace. The Discord Webhook fired instantly with the endpoint, Request ID, and Error Name. The client received a safe HTTP 500 with no stack trace leaked.
  - *Status:* PASSED

## Learnings & Next Steps
- Our system is now "Market-Ready" in terms of monitoring. We will know a bug exists before the customer reports it.
- **Next Up (Epic 2):** Now that we can trace our latency, we need to bring it down. Epic 2 will introduce Redis caching for IndustryConfigs, reducing database reads on every stream chunk.
