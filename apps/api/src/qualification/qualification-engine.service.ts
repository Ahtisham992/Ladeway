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
    'speak to a human',
    'talk to a person',
    'real person',
    'human agent',
    'speak to someone real',
    'talk to a real person',
    'transfer me to',
    'speak to a representative',
    'speak to a manager',
    'speak to a supervisor',
    'i want a human',
    'i need a human',
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

    // Priority 2: If we have enough turns to attempt extraction
    // Run every 2 turns OR if turnCount >= 4 (enough context)
    if (session.turnCount >= 2 && session.turnCount % 2 === 0) {
      return QualificationAction.TRIGGER_EXTRACTION;
    }

    // Priority 3: All fields already captured from previous extraction
    if (session.missingFields.length === 0) {
      return QualificationAction.CLOSE_CONVERSATION;
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
