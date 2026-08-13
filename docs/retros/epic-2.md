# Epic 2: Voice Channel Retro

## Overview
Epic 2 successfully brought a full real-time Voice AI channel to Ladeway. Originally planned around Twilio and ElevenLabs, we pivoted due to Twilio SMS authentication blockers and ElevenLabs API quota issues. We instead built a robust, browser-based Web Audio pipeline powered by Deepgram Nova-2 (STT) and Microsoft Edge (TTS), orchestrated by NestJS WebSockets.

## What Went Well
- **Agility & Pivoting**: Shifting from SIP telephony to WebSockets allowed us to ship a massive feature without getting blocked by third-party telecom compliance.
- **Cost Efficiency**: Microsoft Edge TTS is completely free and bypassed the frustrating 401 Unauthorized errors we experienced with restricted TTS API keys.
- **Latency**: By streaming STT from Deepgram and pipelining it directly to our fast LLM (Groq), we achieved very natural conversational latency.
- **Code Reuse**: We successfully reused the entire `ConversationService`, `ExtractorService`, and `LLMRouterService` logic. Voice is just a new interface layer, not a completely different application.

## Challenges & Fixes
- **TTS WebSocket Hangs**: We encountered a bug where rapid user utterances would trigger concurrent TTS synthesis attempts on the same `MsEdgeTTS` WebSocket connection, permanently hanging the connection. We fixed this by instantiating a fresh TTS client per synthesis, isolating the connections.
- **Barge-In Complexities**: Handling user interruptions was tricky because the backend needed to stop sending audio and the LLM needed to stop generating. We successfully implemented an `AbortController` in the `VoiceOrchestratorService` that kills the LLM stream instantly when new audio arrives.
- **Post-Completion Responses**: When the conversation was successfully `SCORED`, the LLM sometimes responded with an empty string, breaking the audio playback loop. We fixed this by explicitly instructing the prompt to politely acknowledge the user even if the lead is already completed.

## Future Opportunities
- While Web Audio is fantastic, we can revisit Twilio SIP integrations later when telecom regulations allow it, knowing our backend logic is already structured perfectly to accept an audio stream. 
- Implement multi-language support by allowing the user to select their spoken language dynamically.
