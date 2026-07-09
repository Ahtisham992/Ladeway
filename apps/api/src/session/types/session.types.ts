export enum ConversationStatus {
  GREETING = 'GREETING',
  QUALIFYING = 'QUALIFYING',
  EXTRACTING = 'EXTRACTING',
  SCORED = 'SCORED',
  CLOSED = 'CLOSED',
  TRANSFERRED = 'TRANSFERRED',
  ABANDONED = 'ABANDONED',
}

export interface ConversationSession {
  conversationId: string;
  tenantId: string;
  configId: string;
  status: ConversationStatus;
  capturedFields: Record<string, string>;
  missingFields: string[];
  turnCount: number;
  lastActivityAt: string;
  configSnapshot?: {
    fieldsJson: any;
    scoringRulesJson: any;
  };
}
