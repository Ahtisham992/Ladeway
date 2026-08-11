# Phase 26: Telephony Architecture

## High-Level Flow
We will use **Twilio Media Streams**. Instead of Twilio executing TwiML verbs step-by-step, Twilio will open a raw bidirectional WebSocket to our NestJS API.

### 1. Inbound Call
- Twilio receives a call.
- Twilio makes an HTTP POST to `/voice/incoming`.
- We return TwiML `<Connect><Stream url="wss://our-api/voice/stream" /></Connect>`.

### 2. The Loop
- **Audio In**: Twilio streams raw audio bytes (base64 µ-law) to our WebSocket.
- **STT**: We pipe these bytes directly into Deepgram (Speech-to-Text) via WebSocket.
- **Transcription**: Deepgram returns text chunks. When we detect the end of an utterance (is_final=true):
  - We append the user message to the `Conversation`.
  - We call `LLMRouterService.stream(prompt)`.
- **TTS**: As LLM text chunks arrive, we pipe them into ElevenLabs (Text-to-Speech) via WebSocket.
- **Audio Out**: ElevenLabs returns audio bytes. We stream these bytes back down the Twilio WebSocket.

### 3. Barge-In (Interruption)
- If Deepgram detects speech *while* we are sending audio to Twilio:
  - We send a `mark` or `clear` command to Twilio to flush the audio buffer.
  - We close the current ElevenLabs stream.
  - We listen to the new utterance.
