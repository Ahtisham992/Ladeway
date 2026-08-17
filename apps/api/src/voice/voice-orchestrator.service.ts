import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, LiveClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { ConversationService } from '../conversation/conversation.service';
import { WebSocket } from 'ws';

@Injectable()
export class VoiceOrchestratorService {
  private readonly logger = new Logger(VoiceOrchestratorService.name);
  private deepgramApiKey: string;
  private deepgramClient: any;

  // Active call state
  private activeCalls = new Map<string, {
    stt: LiveClient;
    clientWs: WebSocket;
    sessionToken: string;
    // Utterance buffering — collect partial transcripts until user stops speaking
    utteranceBuffer: string;
    utteranceTimer: ReturnType<typeof setTimeout> | null;
    turnAbortController: AbortController | null;
  }>();

  constructor(
    private configService: ConfigService,
    private conversationService: ConversationService
  ) {
    this.deepgramApiKey = this.configService.get<string>('DEEPGRAM_API_KEY') || '';
    this.logger.log(`Deepgram key present: ${!!this.deepgramApiKey}`);
    this.deepgramClient = createClient(this.deepgramApiKey);
  }

  async handleNewCall(callId: string, clientWs: WebSocket, configId: string) {
    this.logger.log(`Handling new call setup for ID: ${callId}`);
    
    const { sessionToken, greeting } = await this.conversationService.startConversation(configId);
    this.logger.log(`Session created: ${sessionToken.substring(0, 8)}...`);
    
    // Setup Deepgram Live STT with utterance end detection
    const stt = this.deepgramClient.listen.live({
      model: 'nova-2',
      language: 'en-IN', // Better recognition for South Asian accents and locations like Rawalpindi
      smart_format: true,
      encoding: 'linear16',
      sample_rate: 16000,
      // Enable utterance end detection — waits for user to stop talking
      utterance_end_ms: 3000,
      interim_results: true,
      vad_events: true,
      keepalive: true,
    });

    stt.on(LiveTranscriptionEvents.Open, () => {
      this.logger.log(`Deepgram STT connection opened for call ${callId}`);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'status', text: 'STT ready' }));
      }
    });

    stt.on(LiveTranscriptionEvents.Transcript, (data: any) => {
      const transcript = data.channel?.alternatives?.[0]?.transcript;
      if (!transcript) return;

      const call = this.activeCalls.get(callId);
      if (!call) return;

      // Barge-in: if user starts speaking, tell frontend to stop any playing AI audio
      if (transcript.trim().length > 0) {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: 'interrupt' }));
        }
      }

      if (data.is_final) {
        // Final transcript for this speech segment — accumulate it
        call.utteranceBuffer += (call.utteranceBuffer ? ' ' : '') + transcript;
        this.logger.log(`[Caller partial] ${transcript} → buffer: "${call.utteranceBuffer}"`);
        
        // Show live transcript to the user
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: 'transcript', text: call.utteranceBuffer }));
        }

        // Reset the debounce timer — wait 3s of silence before processing
        if (call.utteranceTimer) clearTimeout(call.utteranceTimer);
        call.utteranceTimer = setTimeout(() => {
          this.flushUtterance(callId);
        }, 3000);
      }
    });

    // Deepgram fires UtteranceEnd when it detects the speaker has stopped
    stt.on(LiveTranscriptionEvents.UtteranceEnd, () => {
      this.logger.log(`[UtteranceEnd] for call ${callId}`);
      this.flushUtterance(callId);
    });

    stt.on(LiveTranscriptionEvents.Error, (err: any) => {
      this.logger.error(`Deepgram STT Error:`, err);
    });

    stt.on(LiveTranscriptionEvents.Close, () => {
      this.logger.log(`Deepgram STT closed for call ${callId}`);
    });

    this.activeCalls.set(callId, {
      stt,
      clientWs,
      sessionToken,
      utteranceBuffer: '',
      utteranceTimer: null,
      turnAbortController: null,
    });
    
    // Send greeting immediately via TTS
    this.logger.log(`[AI Greeting]: ${greeting}`);
    await this.synthesizeAndSend(clientWs, greeting, 'greeting');
  }

  /**
   * Flush the accumulated utterance buffer and send it to the AI.
   * Only fires after the user has stopped speaking for 1.2-1.5 seconds.
   */
  private flushUtterance(callId: string) {
    const call = this.activeCalls.get(callId);
    if (!call || !call.utteranceBuffer.trim()) return;

    if (call.utteranceTimer) {
      clearTimeout(call.utteranceTimer);
      call.utteranceTimer = null;
    }

    const fullUtterance = call.utteranceBuffer.trim();
    call.utteranceBuffer = '';
    
    this.logger.log(`[Caller complete] "${fullUtterance}"`);
    this.processCallerUtterance(callId, fullUtterance);
  }

  handleAudioIn(callId: string, audioBuffer: Buffer) {
    const call = this.activeCalls.get(callId);
    if (call && call.stt) {
      call.stt.send(audioBuffer);
    }
  }

  handleTextInput(callId: string, text: string) {
    this.logger.log(`[Manual Text Input] Processing: "${text}"`);
    this.processCallerUtterance(callId, text);
  }

  handleDisconnect(callId: string) {
    const call = this.activeCalls.get(callId);
    if (call) {
      if (call.utteranceTimer) clearTimeout(call.utteranceTimer);
      call.stt.finish();
      this.activeCalls.delete(callId);
    }
  }

  /**
   * Synthesize text to speech and send audio over WebSocket.
   */
  private async synthesizeAndSend(clientWs: WebSocket, text: string, label: string) {
    try {
      // Create a fresh TTS client per synthesis to avoid concurrent WebSocket collisions 
      const ttsClient = new MsEdgeTTS();
      await ttsClient.setMetadata('en-US-AriaNeural', OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, { voiceLocale: 'en-US' });
      this.logger.log(`[TTS ${label}] Synthesizing: "${text.substring(0, 60)}..."`);
      
      const { audioStream } = ttsClient.toStream(text);

      const chunks: Buffer[] = [];
      for await (const chunk of audioStream as any) {
        chunks.push(Buffer.from(chunk));
      }
      const fullBuffer = Buffer.concat(chunks);
      this.logger.log(`[TTS ${label}] Audio: ${fullBuffer.length} bytes`);

      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'ai_response', text }));
        clientWs.send(JSON.stringify({
          type: 'audio',
          audioBase64: fullBuffer.toString('base64'),
        }));
        this.logger.log(`[TTS ${label}] Sent to client`);
      }
    } catch (e: any) {
      this.logger.error(`[TTS ${label}] Error: ${e.message}`, e.stack || e);
    }
  }

  private async processCallerUtterance(callId: string, transcript: string) {
    const call = this.activeCalls.get(callId);
    if (!call) return;
    
    this.logger.log(`Will route to AI: ${transcript}`);
    
    try {
      // Abort any currently generating AI turn
      if (call.turnAbortController) {
        call.turnAbortController.abort();
      }
      
      const abortController = new AbortController();
      call.turnAbortController = abortController;

      // Stream LLM response
      let fullText = '';
      const responseStream = this.conversationService.sendMessage(
        call.sessionToken,
        transcript
      );

      for await (const chunk of responseStream) {
        if (abortController.signal.aborted) {
          this.logger.log(`[Barge-In] Aborted AI response generation for call ${callId}`);
          return;
        }

        // Skip metadata chunks
        if (chunk.includes('"_done":true') || chunk.includes('"_done": true')) {
          this.logger.log(`[Metadata]: ${chunk.substring(0, 80)}`);
          continue;
        }
        
        fullText += chunk;
      }
      
      fullText = fullText.trim();
      this.logger.log(`[AI Response]: ${fullText}`);

      if (!fullText) {
        fullText = 'I apologize, I did not catch that.';
      }

      // Synthesize entire response at once for perfectly smooth playback
      await this.synthesizeAndSend(call.clientWs, fullText, 'response');
      
    } catch (error: any) {
      this.logger.error(`Error in voice pipeline: ${error.message}`, error.stack || error);
    }
  }
}
