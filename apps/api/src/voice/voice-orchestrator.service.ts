import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, LiveClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { ElevenLabsClient } from 'elevenlabs';
import { ConversationService } from '../conversation/conversation.service';
import { WebSocket } from 'ws';

@Injectable()
export class VoiceOrchestratorService {
  private readonly logger = new Logger(VoiceOrchestratorService.name);
  private deepgramApiKey: string;
  private elevenLabsApiKey: string;

  private deepgramClient: any;
  private elevenLabsClient: ElevenLabsClient;

  // Active call state
  private activeCalls = new Map<string, {
    stt: LiveClient;
    clientWs: WebSocket;
    sessionToken: string;
    // Utterance buffering — collect partial transcripts until user stops speaking
    utteranceBuffer: string;
    utteranceTimer: ReturnType<typeof setTimeout> | null;
  }>();

  constructor(
    private configService: ConfigService,
    private conversationService: ConversationService
  ) {
    this.deepgramApiKey = this.configService.get<string>('DEEPGRAM_API_KEY') || '';
    this.elevenLabsApiKey = this.configService.get<string>('ELEVENLABS_API_KEY') || '';
    
    this.logger.log(`Deepgram key present: ${!!this.deepgramApiKey}`);
    this.logger.log(`ElevenLabs key present: ${!!this.elevenLabsApiKey}, starts with: ${this.elevenLabsApiKey.substring(0, 5)}...`);

    this.deepgramClient = createClient(this.deepgramApiKey);
    this.elevenLabsClient = new ElevenLabsClient({ apiKey: this.elevenLabsApiKey });
  }

  async handleNewCall(callId: string, clientWs: WebSocket, configId: string) {
    this.logger.log(`Handling new call setup for ID: ${callId}`);
    
    const { sessionToken, greeting } = await this.conversationService.startConversation(configId);
    this.logger.log(`Session created: ${sessionToken.substring(0, 8)}...`);
    
    // Setup Deepgram Live STT with utterance end detection
    const stt = this.deepgramClient.listen.live({
      model: 'nova-2',
      language: 'en-US',
      smart_format: true,
      encoding: 'linear16',
      sample_rate: 16000,
      // Enable utterance end detection — waits for user to stop talking
      utterance_end_ms: 1200,
      interim_results: true,
      vad_events: true,
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

      if (data.is_final) {
        // Final transcript for this speech segment — accumulate it
        call.utteranceBuffer += (call.utteranceBuffer ? ' ' : '') + transcript;
        this.logger.log(`[Caller partial] ${transcript} → buffer: "${call.utteranceBuffer}"`);
        
        // Show live transcript to the user
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: 'transcript', text: call.utteranceBuffer }));
        }

        // Reset the debounce timer — wait 1.5s of silence before processing
        if (call.utteranceTimer) clearTimeout(call.utteranceTimer);
        call.utteranceTimer = setTimeout(() => {
          this.flushUtterance(callId);
        }, 1500);
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
      this.logger.log(`[TTS ${label}] Synthesizing: "${text.substring(0, 60)}..."`);
      
      const audioStream = await this.elevenLabsClient.textToSpeech.convertAsStream('JBFqnCBsd6RMkjVDRZzb', {
        text,
        model_id: 'eleven_multilingual_v2',
        output_format: 'mp3_44100_128',
      });

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
      // 1. Stream LLM response, split into sentences for fast TTS
      let fullText = '';
      let sentenceBuffer = '';
      const responseStream = this.conversationService.sendMessage(
        call.sessionToken,
        transcript
      );

      const sentences: string[] = [];

      for await (const chunk of responseStream) {
        // Skip metadata chunks
        if (chunk.includes('"_done":true') || chunk.includes('"_done": true')) {
          this.logger.log(`[Metadata]: ${chunk.substring(0, 80)}`);
          continue;
        }
        
        fullText += chunk;
        sentenceBuffer += chunk;
        
        // Split on sentence boundaries
        const sentenceMatch = sentenceBuffer.match(/^(.*?[.!?])\s*/);
        if (sentenceMatch) {
          sentences.push(sentenceMatch[1]);
          sentenceBuffer = sentenceBuffer.substring(sentenceMatch[0].length);
        }
      }
      
      if (sentenceBuffer.trim()) {
        sentences.push(sentenceBuffer.trim());
      }

      fullText = fullText.trim();
      this.logger.log(`[AI Response]: ${fullText}`);

      if (!fullText) {
        fullText = 'I apologize, I did not catch that.';
        sentences.push(fullText);
      }

      // Send full text to UI immediately
      if (call.clientWs.readyState === WebSocket.OPEN) {
        call.clientWs.send(JSON.stringify({ type: 'ai_response', text: fullText }));
      }

      // 2. Synthesize each sentence and send audio as it's ready
      for (const sentence of sentences) {
        if (!sentence.trim()) continue;
        this.logger.log(`[TTS sentence] "${sentence.substring(0, 50)}"`);
        
        try {
          const audioStream = await this.elevenLabsClient.textToSpeech.convertAsStream('JBFqnCBsd6RMkjVDRZzb', {
            text: sentence,
            model_id: 'eleven_multilingual_v2',
            output_format: 'mp3_44100_128',
          });

          const chunks: Buffer[] = [];
          for await (const chunk of audioStream as any) {
            chunks.push(Buffer.from(chunk));
          }
          const buf = Buffer.concat(chunks);
          
          if (call.clientWs.readyState === WebSocket.OPEN) {
            call.clientWs.send(JSON.stringify({
              type: 'audio',
              audioBase64: buf.toString('base64'),
            }));
          }
        } catch (ttsErr: any) {
          this.logger.error(`[TTS sentence] Error: ${ttsErr.message}`);
        }
      }
      
    } catch (error: any) {
      this.logger.error(`Error in voice pipeline: ${error.message}`, error.stack || error);
    }
  }
}
