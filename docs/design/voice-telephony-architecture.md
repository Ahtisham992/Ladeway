# Phase 26: Telephony Architecture

## High-Level Flow
We will use **WebSockets and Web Audio API** to provide a seamless voice experience directly in the browser. 

### 1. Inbound Call
- User clicks "Call AI" in the frontend `VoiceWidget`.
- Frontend acquires microphone permissions and opens a WebSocket to `wss://our-api/voice`.

### 2. The Loop
- **Audio In**: Frontend streams raw audio bytes (Int16 PCM) to our WebSocket gateway.
- **STT**: The backend pipes these bytes directly into Deepgram Nova-2 (Speech-to-Text) via its own WebSocket.
- **Transcription**: Deepgram returns text chunks. When we detect the end of an utterance (3s silence):
  - We append the user message to the `Conversation`.
  - We call `LLMRouterService.stream(prompt)`.
- **TTS**: When the LLM generates a response, we send it to Microsoft Edge TTS. 
- **Audio Out**: Edge TTS returns an mp3 audio stream. We encode this as base64 in a JSON payload and stream it back to the browser via WebSocket, where the `VoiceWidget` plays it natively.

### 3. Barge-In (Interruption)
- If the frontend detects the user starts speaking *while* audio is playing:
  - Frontend immediately pauses the `<audio>` element and sends an `interrupt` packet to the backend.
  - Backend cancels the `AbortController` for the current LLM turn, immediately halting LLM streaming and TTS synthesis.
  - Backend starts a fresh transcription buffer for the new utterance.
