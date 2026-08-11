# Phase 25: Voice Problem Statement

## The Problem
Voice qualification is fundamentally different from chat. In chat:
1. Users expect seconds of delay.
2. Users can read paragraphs of text.
3. Users do not overlap or interrupt the AI.

In voice:
1. **Latency is king.** A delay of >1.5 seconds post-speech feels unnatural.
2. **Brevity is required.** AI responses must be short and conversational; you cannot read a 4-sentence bullet point list over the phone.
3. **Barge-in is mandatory.** If the AI is speaking and the user interrupts ("No, actually I meant..."), the AI must instantly stop speaking, discard the rest of its outbound audio buffer, and listen.
4. **Silence happens.** The AI must detect dead air and prompt the user gracefully ("Are you still there?").

## The Goal
To adapt Ladeway's generic `ConversationService` to handle voice without branching the core qualification logic, while maintaining a sub-1.5s latency budget via streaming websockets.
