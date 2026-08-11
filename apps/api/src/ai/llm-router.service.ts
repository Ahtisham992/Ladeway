import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIUnavailableException } from './ai.exceptions';
import { Groq } from 'groq-sdk';

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
          yield* this.streamGroq(messages, options);
          return;
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
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const chunk = JSON.parse(line);
          if (chunk.message?.content) {
            yield chunk.message.content;
          }
          if (chunk.done) return;
        } catch (error) {
          this.logger.error(`Failed to parse Ollama chunk: ${line}`, error);
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

    const groq = new Groq({ apiKey });

    const chatCompletion = await groq.chat.completions.create({
      messages: messages as any,
      model: 'llama-3.1-8b-instant', // using the model requested by the user
      stream: true,
      temperature: options?.temperature ?? 1,
      max_completion_tokens: options?.maxTokens ?? 1024,
      top_p: 1,
      stop: null,
    });

    for await (const chunk of chatCompletion) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }
}
