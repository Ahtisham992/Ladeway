# Phase 27: Voice Latency & Fallback Design

## Latency Budget
To achieve conversational voice, we must hit a < 1.5s budget from the moment the user stops speaking to the moment the AI's first audio byte is played.

- **STT (Deepgram)**: ~200ms
- **LLM TTFT (Groq)**: ~400ms
- **TTS (ElevenLabs)**: ~400ms
- **Network Overhead**: ~300ms
**Total:** ~1300ms (1.3s)

*Note: This relies heavily on streaming. We do not wait for the LLM to finish thinking; we synthesize the first sentence while the second is generating.*

## Fallbacks
1. **WebSocket Failure**: If the websocket connection to our API drops, Twilio will execute the `action` URL in the `<Connect>` verb. We will return TwiML: `<Say>We are experiencing technical difficulties. We will call you back.</Say><Hangup/>`.
2. **LLM Timeout**: If Groq hangs for > 3 seconds, we play a pre-synthesized "Hold on just a moment..." audio clip to buy time.
3. **Escalation**: On `TRIGGER_TRANSFER`, we return TwiML `<Dial>` to transfer the call to the tenant's human agent number.
