import { QualificationEngineService } from './qualification-engine.service';
import { QualificationAction } from './types/qualification.types';
import { ConversationSession, ConversationStatus } from '../session/types/session.types';
import { IndustryConfig } from '@prisma/client';

describe('QualificationEngineService', () => {
  let engine: QualificationEngineService;

  beforeEach(() => {
    engine = new QualificationEngineService();
  });

  const mockConfig: IndustryConfig = {
    id: 'config-1',
    tenantId: 'tenant-1',
    industryName: 'Logistics',
    personaName: 'Alexandra',
    personaRole: 'Freight Broker',
    greeting: 'Hello!',
    tone: 'professional',
    fieldsJson: [
      { key: 'origin', label: 'Origin', type: 'text', required: true, extractionHint: 'City' },
      { key: 'destination', label: 'Destination', type: 'text', required: true, extractionHint: 'City' },
    ] as any,
    scoringRulesJson: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const buildSession = (overrides: Partial<ConversationSession> = {}): ConversationSession => ({
    conversationId: 'conv-1',
    tenantId: 'tenant-1',
    configId: 'config-1',
    status: ConversationStatus.QUALIFYING,
    capturedFields: {},
    missingFields: ['origin', 'destination'],
    turnCount: 1,
    lastActivityAt: new Date().toISOString(),
    ...overrides,
  });

  it('should return TRIGGER_TRANSFER when user says "I want to speak to a human"', () => {
    const session = buildSession();
    const action = engine.getNextAction(session, mockConfig, 'I want to speak to a human');
    expect(action).toBe(QualificationAction.TRIGGER_TRANSFER);
  });

  it('should return CLOSE_CONVERSATION when all fields are captured', () => {
    const session = buildSession({ missingFields: [], turnCount: 3 });
    const action = engine.getNextAction(session, mockConfig);
    expect(action).toBe(QualificationAction.CLOSE_CONVERSATION);
  });

  it('should return TRIGGER_EXTRACTION when turn threshold is met', () => {
    const session = buildSession({ turnCount: 4, missingFields: ['origin'] });
    const action = engine.getNextAction(session, mockConfig);
    expect(action).toBe(QualificationAction.TRIGGER_EXTRACTION);
  });

  it('should return CONTINUE_QUALIFYING in early conversation', () => {
    const session = buildSession({ turnCount: 1, missingFields: ['origin'] });
    const action = engine.getNextAction(session, mockConfig);
    expect(action).toBe(QualificationAction.CONTINUE_QUALIFYING);
  });

  it('should prioritize escalation over completion', () => {
    const session = buildSession({ missingFields: [] });
    const action = engine.getNextAction(session, mockConfig, 'transfer me to a manager');
    expect(action).toBe(QualificationAction.TRIGGER_TRANSFER);
  });

  it('should NOT trigger escalation for ambiguous phrases like "connect me with pricing"', () => {
    const session = buildSession({ turnCount: 1 });
    const action = engine.getNextAction(session, mockConfig, 'can you connect me with the pricing');
    expect(action).toBe(QualificationAction.CONTINUE_QUALIFYING);
  });

  it('should NOT trigger escalation for "representative section on your website"', () => {
    const session = buildSession({ turnCount: 1 });
    const action = engine.getNextAction(session, mockConfig, 'do you have a customer representative section on your website');
    expect(action).toBe(QualificationAction.CONTINUE_QUALIFYING);
  });
});
