# Phase 27: Voice Latency & Fallback Design

## Latency Budget
To achieve conversational voice, we aim for a low latency budget from the moment the user stops speaking to the moment the AI's first audio byte is played.

- **STT (Deepgram Nova-2)**: ~200ms
- **LLM TTFT (Groq)**: ~400ms
- **TTS (Microsoft Edge)**: ~200ms (Very fast as we request mp3 chunks directly)
- **Network Overhead**: ~200ms
**Total:** ~1000ms (1.0s)

*Note: The AI's full sentence is synthesized at once to ensure completely smooth playback, avoiding any awkward cadence breaks.*

## Fallbacks
1. **WebSocket Failure**: If the websocket connection to our API drops, the frontend `VoiceWidget` gracefully catches the `onclose` event, displays a "Connection Lost" alert, and switches the widget back to the disconnected state.
2. **LLM Timeout/Errors**: If the LLM router fails or hangs, the `VoiceOrchestratorService` catches the exception and gracefully synthesizes a fallback message like "I apologize, I am having trouble connecting. Let's switch back to text."
3. **Escalation**: On `TRIGGER_TRANSFER`, the LLM gracefully informs the user that a human will be in touch, the call transitions to the `TRANSFERRED` status, and the lead is safely recorded in the database.
