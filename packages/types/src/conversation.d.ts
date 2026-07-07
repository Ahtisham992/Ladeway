export declare enum ConversationStatus {
    GREETING = "GREETING",
    QUALIFYING = "QUALIFYING",
    EXTRACTING = "EXTRACTING",
    SCORED = "SCORED",
    CLOSED = "CLOSED",
    TRANSFERRED = "TRANSFERRED",
    ABANDONED = "ABANDONED"
}
export type MessageSender = 'user' | 'ai';
export interface Message {
    id: string;
    conversationId: string;
    sender: MessageSender;
    content: string;
    tokenCount?: number;
    timestamp: Date;
}
export interface ConversationSession {
    conversationId: string;
    configId: string;
    tenantId: string;
    status: ConversationStatus;
    capturedFields: Record<string, string>;
    startedAt: string;
    lastActivityAt: string;
}
export declare enum QualificationAction {
    CONTINUE_QUALIFYING = "CONTINUE_QUALIFYING",
    TRIGGER_EXTRACTION = "TRIGGER_EXTRACTION",
    TRIGGER_TRANSFER = "TRIGGER_TRANSFER",
    CLOSE_CONVERSATION = "CLOSE_CONVERSATION"
}
export interface StartConversationDto {
    configId: string;
}
export interface StartConversationResponse {
    conversationId: string;
    sessionToken: string;
    greeting: string;
}
export interface SendMessageDto {
    content: string;
}
export type SSEEventType = 'token' | 'done' | 'error';
export interface SSEDonePayload {
    status: ConversationStatus;
    capturedFields: Record<string, string>;
    missingFields: string[];
}
export interface SSEErrorPayload {
    message: string;
}
export interface ConversationStateResponse {
    status: ConversationStatus;
    capturedFields: Record<string, string>;
    missingFields: string[];
}
