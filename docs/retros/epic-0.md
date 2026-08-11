# Epic 0: Foundation Hardening Retro

**Date:** 2026-08-11
**Phase:** 14 [OPERATE]

## What went well?
- **Testing Infrastructure:** Setting up Jest, Supertest, and Playwright across the monorepo went smoothly. The testing boundaries are now well-defined.
- **Bug Discovery:** The testing process immediately proved its worth. We uncovered a critical TCP stream chunk-swallowing bug in `llm-router.service.ts` that would have caused silent, intermittent failures in production.
- **Test-Driven Fixes:** We also found that `prompt.service.ts` was asking the LLM to extract already-captured fields. The newly implemented test cases caught this regression quickly.

## What was more fragile than expected?
- **Streaming over TCP:** The `llm-router.service.ts` assumption that network chunks arrive cleanly split by line breaks (`\n`) was deeply flawed. Real-world TCP splits packets arbitrarily, meaning JSON payloads were frequently cut in half and silently discarded by the empty `catch` block.
- **Integration Test Mocking:** Setting up accurate mocks for `ConversationController` without hitting the DB required careful isolation of `SessionService` and `PrismaService`. The v1 architecture tightly couples these dependencies.

## What testing habit will we keep going forward?
- **Test-Driven AI Prompts:** AI Prompts are notoriously brittle. Writing parameterized unit tests for `PromptService.assembleExtractionPrompt()` proved that we can treat prompt engineering as deterministic code. We will continue this habit in Epic 1 and beyond.
- **Asserting on Server-Sent Events (SSE):** We learned how to properly test `text/event-stream` endpoints using Supertest by verifying the `event:` and `data:` chunks rather than expecting a standard JSON object.

## Conclusion
Epic 0 successfully fortified the Ladeway v1 prototype into a solid foundation ready for Ladeway 2.0. We are now ready to tackle Epic 1!
