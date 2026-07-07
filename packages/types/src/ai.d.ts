export type LLMRole = 'system' | 'user' | 'assistant';
export interface LLMMessage {
    role: LLMRole;
    content: string;
}
export interface StreamOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
}
export interface PromptPayload {
    systemPrompt: string;
    messages: LLMMessage[];
}
export interface AIHealthResponse {
    status: 'ok' | 'error';
    model: string;
    latencyMs: number;
}
