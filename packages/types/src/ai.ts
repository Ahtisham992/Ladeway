/**
 * AI types — LLM router, prompt assembly, and streaming interfaces.
 */

/** Role of a message in the LLM conversation */
export type LLMRole = 'system' | 'user' | 'assistant';

/** A message sent to the LLM */
export interface LLMMessage {
  role: LLMRole;
  content: string;
}

/** Options for the LLM streaming call */
export interface StreamOptions {
  /** Model to use (defaults to configured model) */
  model?: string;
  /** Temperature for response generation (0-1) */
  temperature?: number;
  /** Maximum tokens in the response */
  maxTokens?: number;
}

/** Assembled prompt payload ready for the LLM */
export interface PromptPayload {
  /** System prompt with persona, rules, and field state */
  systemPrompt: string;
  /** Formatted conversation history */
  messages: LLMMessage[];
}

/** Health check response for the AI endpoint */
export interface AIHealthResponse {
  status: 'ok' | 'error';
  model: string;
  latencyMs: number;
}
