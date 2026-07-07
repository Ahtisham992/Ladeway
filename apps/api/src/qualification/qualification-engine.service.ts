import { Injectable } from '@nestjs/common';
import { ConversationSession } from '../session/types/session.types';
import { QualificationAction } from './types/qualification.types';
import { IndustryConfig } from '@prisma/client';

@Injectable()
export class QualificationEngineService {
  /**
   * Escalation keywords — deliberately specific phrases that are unambiguous
   * about wanting a human transfer. Broad terms like "connect me" or
   * "representative" alone are excluded to avoid false positives.
   */
  private readonly ESCALATION_KEYWORDS = [
    // Explicit human requests
    'speak to a human', 'talk to a person', 'real person',
    'human agent', 'speak to someone real', 'talk to a real person',
    'i want a human', 'i need a human', 'get me a human',
    // Transfer requests  
    'transfer me', 'transfer me to', 'connect me to a person',
    // Representative requests
    'speak to a representative', 'talk to a representative',
    'speak to a manager', 'talk to a manager',
    'speak to a supervisor', 'talk to a supervisor',
    'speak to an agent', 'talk to an agent',
    // Frustration signals
    'this is not helpful', 'you are not helping',
    'i want to talk to a real person', 'stop', 'quit',
    'just let me speak to someone',
    // Soft but unambiguous
    'i prefer to speak with someone',
    'id rather talk to someone',
    'can i speak with a person',
    'is there a person i can talk to',
  ];

  /**
   * Evaluates the current conversation state and returns the next action
   * for the conversation loop to execute.
   *
   * Priority order:
   * 1. Escalation — always wins, even if all fields are captured
   * 2. Extraction threshold — run every 2 turns to attempt structured data extraction
   * 3. Close — only after extraction has confirmed missingFields is empty
   * 4. Continue qualifying — default
   */
  getNextAction(
    session: ConversationSession,
    config: IndustryConfig,
    lastUserMessage?: string,
  ): QualificationAction {
    // Priority 1: Escalation always wins
    if (lastUserMessage && this.detectEscalation(lastUserMessage)) {
      return QualificationAction.TRIGGER_TRANSFER;
    }

    // Priority 2: All fields already captured from previous extraction
    if (session.missingFields.length === 0) {
      return QualificationAction.CLOSE_CONVERSATION;
    }

    // Priority 3: If we have enough turns to attempt extraction
    // Run every 2 turns OR if turnCount >= 4 (enough context)
    if (session.turnCount >= 2 && session.turnCount % 2 === 0) {
      return QualificationAction.TRIGGER_EXTRACTION;
    }

    // Default: keep qualifying
    return QualificationAction.CONTINUE_QUALIFYING;
  }

  /**
   * Case-insensitive substring matching against the curated escalation
   * keyword list. Returns true if the user's message contains any
   * unambiguous escalation phrase.
   */
  private detectEscalation(message: string): boolean {
    const normalized = message.toLowerCase();
    return this.ESCALATION_KEYWORDS.some((keyword) =>
      normalized.includes(keyword),
    );
  }
}
