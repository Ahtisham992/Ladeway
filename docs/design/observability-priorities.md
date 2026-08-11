# Observability Priorities & Structured Logging Schema

## Top 5 Failure Modes That Matter
We are prioritizing observability for these specific, high-risk failure modes rather than vanity metrics:

1. **AI Provider Outages / Latency Spikes:** The LLM (Ollama/Groq) goes down or takes >5 seconds to return the first token, causing the conversation to hang.
2. **Database Connection Pool Exhaustion:** The Prisma client runs out of connections under heavy load, causing API requests to timeout silently.
3. **Tenant-Specific Errors:** A specific IndustryConfig (tenant) has a bad setup that consistently crashes the extraction parser, affecting only one subset of users.
4. **Network Stream Interruptions:** The Server-Sent Events (SSE) connection drops mid-generation, stranding the user's conversation state.
5. **Memory Leaks during High Concurrency:** Buffering large LLM streams incorrectly across hundreds of simultaneous sessions exhausts the Node.js process heap.

---

## Structured Log Schema
To ensure machine-readability (for tools like Datadog, ELK, or Pino-Pretty), every log line must adhere to this JSON structure:

```json
{
  "level": 30,
  "time": 1723385200000,
  "pid": 12345,
  "hostname": "api-server-1",
  "reqId": "uuid-v4-string",           // Mandatory: Correlation ID for the HTTP request
  "tenantId": "tenant_123",            // Optional: Injected via middleware if authenticated
  "conversationId": "conv_456",        // Optional: Attached when in the context of a chat
  "durationMs": 450,                   // Optional: Time taken for an operation
  "msg": "LLM Stream Completed",       // Mandatory: Human-readable message
  "err": { ... }                       // Optional: Standardized error object stack trace
}
```

By enforcing this schema, we can filter our production logs to instantly see "all errors for `tenantId=tenant_123`" or "all operations where `durationMs > 2000`".
