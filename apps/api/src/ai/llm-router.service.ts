import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIUnavailableException } from './ai.exceptions';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamOptions {
  temperature?: number;
  maxTokens?: number;
}

@Injectable()
export class LLMRouterService {
  private readonly logger = new Logger(LLMRouterService.name);
  private readonly maxRetries = 3;
  private readonly baseDelayMs = 1000;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Public interface to stream responses from the active LLM provider.
   * Handles exponential backoff retries automatically.
   */
  async *stream(messages: LLMMessage[], options?: StreamOptions): AsyncIterable<string> {
    const provider = this.configService.get<string>('ACTIVE_LLM_PROVIDER') || 'ollama';
    let attempt = 0;

    while (attempt < this.maxRetries) {
      try {
        if (provider === 'ollama') {
          yield* this.streamOllama(messages, options);
          return; // Success
        } else if (provider === 'groq') {
          // Uncomment below when Groq is activated
          // yield* this.streamGroq(messages, options);
          // return;
          throw new Error('Groq provider is currently inactive.');
        } else {
          throw new Error(`Unsupported LLM Provider: ${provider}`);
        }
      } catch (error: any) {
        attempt++;
        this.logger.warn(`LLM stream failed (attempt ${attempt}/${this.maxRetries}): ${error.message}`);
        if (attempt >= this.maxRetries) {
          throw new AIUnavailableException(`Failed to stream from LLM after ${this.maxRetries} attempts.`);
        }
        await new Promise((res) => setTimeout(res, this.baseDelayMs * Math.pow(2, attempt - 1)));
      }
    }
  }

  /**
   * Generates a single response (non-streaming) for health checks.
   */
  async generateSingleToken(): Promise<string> {
    const iterator = this.stream([{ role: 'user', content: 'Say hello' }]);
    for await (const chunk of iterator) {
      return chunk; // Return immediately on first chunk
    }
    return '';
  }

  private async *streamOllama(messages: LLMMessage[], options?: StreamOptions): AsyncIterable<string> {
    const baseUrl = this.configService.get<string>('OLLAMA_URL') || 'http://localhost:11434';
    const model = this.configService.get<string>('OLLAMA_MODEL') || 'llama3:latest';

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        options: {
          temperature: options?.temperature,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API returned status ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is missing');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value, { stream: true }).split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const chunk = JSON.parse(line);
          if (chunk.message?.content) {
            yield chunk.message.content;
          }
          if (chunk.done) return;
        } catch {
          // incomplete chunk - continue
        }
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async *streamGroq(messages: LLMMessage[], options?: StreamOptions): AsyncIterable<string> {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', // or any standard groq model
        messages,
        stream: true,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API returned status ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is missing');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value, { stream: true }).split('\n').filter(Boolean);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        
        if (trimmed === 'data: [DONE]') return; // handle this before JSON.parse

        if (!trimmed.startsWith('data: ')) continue;
        
        try {
          const chunk = JSON.parse(trimmed.slice(6));
          const content = chunk.choices?.[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch {
          // incomplete chunk - continue
        }
      }
    }
  }
}
