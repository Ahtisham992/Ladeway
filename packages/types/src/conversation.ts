/**
 * Conversation types — state machine, messages, and session management.
 *
 * The conversation lifecycle is explicitly modelled as a state machine.
 * Transitions are managed by QualificationEngineService.
 */

/** All possible states in the conversation lifecycle */
export enum ConversationStatus {
  /** Session started, greeting sent */
  GREETING = 'GREETING',
  /** Actively gathering required qualification fields */
  QUALIFYING = 'QUALIFYING',
  /** All fields captured — running extraction LLM call */
  EXTRACTING = 'EXTRACTING',
  /** Lead created and scored */
  SCORED = 'SCORED',
  /** Conversation complete */
  CLOSED = 'CLOSED',
  /** Customer requested a human agent */
  TRANSFERRED = 'TRANSFERRED',
  /** Inactivity timeout (24 hours) */
  ABANDONED = 'ABANDONED',
}

/** Who sent a message in a conversation */
export type MessageSender = 'user' | 'ai';

/** A single message in a conversation */
export interface Message {
  id: string;
  conversationId: string;
  sender: MessageSender;
  content: string;
  tokenCount?: number;
  timestamp: Date;
}

/** The real-time session state stored in Redis */
export interface ConversationSession {
  conversationId: string;
  configId: string;
  tenantId: string;
  status: ConversationStatus;
  /** Fields already captured: { fieldKey: capturedValue } */
  capturedFields: Record<string, string>;
  missingFields: string[];
  turnCount: number;
  /** Timestamps for tracking activity */
  startedAt: string;
  lastActivityAt: string;
  /** Snapshot of config at start time to immunize session against config updates */
  configSnapshot?: {
    fieldsJson: any;
    scoringRulesJson: any;
  };
}

/** Actions the qualification engine can return */
export enum QualificationAction {
  CONTINUE_QUALIFYING = 'CONTINUE_QUALIFYING',
  TRIGGER_EXTRACTION = 'TRIGGER_EXTRACTION',
  TRIGGER_TRANSFER = 'TRIGGER_TRANSFER',
  CLOSE_CONVERSATION = 'CLOSE_CONVERSATION',
}

/** DTO for starting a new conversation */
export interface StartConversationDto {
  configId: string;
}

/** Response from starting a conversation */
export interface StartConversationResponse {
  conversationId: string;
  sessionToken: string;
  greeting: string;
}

/** DTO for sending a message in a conversation */
export interface SendMessageDto {
  content: string;
}

/** SSE event types for the streaming protocol */
export type SSEEventType = 'token' | 'done' | 'error';

/** SSE done event payload */
export interface SSEDonePayload {
  status: ConversationStatus;
  capturedFields: Record<string, string>;
  missingFields: string[];
}

/** SSE error event payload */
export interface SSEErrorPayload {
  message: string;
}

/** Conversation state response for GET /conversations/:id/state */
export interface ConversationStateResponse {
  status: ConversationStatus;
  capturedFields: Record<string, string>;
  missingFields: string[];
}
