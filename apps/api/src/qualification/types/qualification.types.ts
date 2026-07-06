/**
 * QualificationAction — the possible actions the state machine can signal
 * after evaluating the current session against the config.
 *
 * CONTINUE_QUALIFYING: More fields still needed. Keep asking.
 * TRIGGER_EXTRACTION:  Enough conversation content to attempt structured extraction.
 * TRIGGER_TRANSFER:    User requested human escalation.
 * CLOSE_CONVERSATION:  All required fields captured. Conversation complete.
 */
export enum QualificationAction {
  CONTINUE_QUALIFYING = 'CONTINUE_QUALIFYING',
  TRIGGER_EXTRACTION = 'TRIGGER_EXTRACTION',
  TRIGGER_TRANSFER = 'TRIGGER_TRANSFER',
  CLOSE_CONVERSATION = 'CLOSE_CONVERSATION',
}
