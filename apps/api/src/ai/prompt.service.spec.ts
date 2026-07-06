import { PromptService, LLMMessage } from './prompt.service';
import { ConversationSession, ConversationStatus } from '../session/types/session.types';
import { IndustryConfig } from '@prisma/client';

describe('PromptService', () => {
  let promptService: PromptService;

  beforeEach(() => {
    promptService = new PromptService();
  });

  const getMockSession = (missingFields: string[], capturedFields: Record<string, string> = {}): ConversationSession => ({
    conversationId: 'conv-1',
    tenantId: 'tenant-1',
    configId: 'config-1',
    status: ConversationStatus.QUALIFYING,
    capturedFields,
    missingFields,
    turnCount: 1,
    lastActivityAt: new Date().toISOString(),
  });

  const mockMessages: LLMMessage[] = [
    { role: 'user', content: 'Hi, I need help.' }
  ];

  describe('Logistics (Alexandra)', () => {
    const logisticsConfig: IndustryConfig = {
      id: 'logistics-1',
      tenantId: 'tenant-1',
      industryName: 'Logistics',
      personaName: 'Alexandra',
      personaRole: 'Freight Broker',
      greeting: 'Hello, how can I assist with your freight?',
      tone: 'professional and precise',
      fieldsJson: [
        { key: 'origin', label: 'Origin', type: 'text', required: true, extractionHint: 'City or Zip Code' },
        { key: 'destination', label: 'Destination', type: 'text', required: true, extractionHint: 'City or Zip Code' }
      ] as any,
      scoringRulesJson: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should assemble conversation prompt correctly for Logistics', () => {
      const session = getMockSession(['origin', 'destination'], {});
      const prompt = promptService.assembleConversationPrompt(logisticsConfig, session, mockMessages);
      
      expect(prompt[0].role).toBe('system');
      expect(prompt[0].content).toContain('Alexandra');
      expect(prompt[0].content).toContain('Freight Broker');
      expect(prompt[0].content).toContain('Logistics');
      expect(prompt[0].content).toContain('professional and precise');
      expect(prompt[0].content).toContain('ALREADY CAPTURED: Nothing yet');
      expect(prompt[0].content).toContain('○ origin');
      expect(prompt[0].content).toContain('○ destination');
    });

    it('should assemble extraction prompt correctly for Logistics', () => {
      const session = getMockSession(['origin'], { destination: 'New York' });
      const prompt = promptService.assembleExtractionPrompt(logisticsConfig, session, mockMessages);
      
      expect(prompt[0].role).toBe('user');
      expect(prompt[0].content).toContain('"origin": City or Zip Code');
      expect(prompt[0].content).not.toContain('"destination"');
      expect(prompt[0].content).toContain('CRITICAL: Your response must be ONLY a valid JSON object.');
    });
  });

  describe('Real Estate (James)', () => {
    const realEstateConfig: IndustryConfig = {
      id: 'real-estate-1',
      tenantId: 'tenant-1',
      industryName: 'Real Estate',
      personaName: 'James',
      personaRole: 'Agent',
      greeting: 'Hi, looking for a home?',
      tone: 'friendly',
      fieldsJson: [
        { key: 'budget', label: 'Budget', type: 'number', required: true, extractionHint: 'Dollar amount' }
      ] as any,
      scoringRulesJson: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should assemble conversation prompt correctly for Real Estate', () => {
      const session = getMockSession(['budget'], { location: 'Boston' });
      const prompt = promptService.assembleConversationPrompt(realEstateConfig, session, mockMessages);
      
      expect(prompt[0].role).toBe('system');
      expect(prompt[0].content).toContain('James');
      expect(prompt[0].content).toContain('Agent');
      expect(prompt[0].content).toContain('Real Estate');
      expect(prompt[0].content).toContain('friendly');
      expect(prompt[0].content).toContain('ALREADY CAPTURED:');
      expect(prompt[0].content).toContain('✓ location: Boston');
      expect(prompt[0].content).toContain('○ budget');
    });
  });
});
