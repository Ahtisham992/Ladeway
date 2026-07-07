import { Test, TestingModule } from '@nestjs/testing';
import { ScoringService } from './scoring.service';
import { ScoringRule } from '@ladeway/types';
import { ExtractedData } from '@prisma/client';

describe('ScoringService', () => {
  let service: ScoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScoringService],
    }).compile();

    service = module.get<ScoringService>(ScoringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate score and fallback tier correctly', () => {
    const rules: ScoringRule[] = [
      { field: 'budget', condition: 'greater_than', value: 1000, weight: 0.5 },
      { field: 'timeline', condition: 'equals', value: 'ASAP', weight: 0.3 }
    ];

    const data = [
      { fieldKey: 'budget', fieldValue: '1500' },
      { fieldKey: 'timeline', fieldValue: 'asap' }
    ] as ExtractedData[];

    const result = service.score(rules, data);
    expect(result.score).toBe(0.8);
    expect(result.tier).toBe('HOT');
  });

  it('should apply tier override if rule matched', () => {
    const rules: ScoringRule[] = [
      { field: 'timeline', condition: 'equals', value: 'ASAP', weight: 0.3, tier: 'HOT' },
      { field: 'budget', condition: 'less_than', value: 500, weight: 0.1 }
    ];

    const data = [
      { fieldKey: 'timeline', fieldValue: 'ASAP' },
      { fieldKey: 'budget', fieldValue: '300' }
    ] as ExtractedData[];

    const result = service.score(rules, data);
    expect(result.score).toBe(0.4);
    expect(result.tier).toBe('HOT');
  });

  it('should correctly evaluate "in" condition', () => {
    const rules: ScoringRule[] = [
      { field: 'type', condition: 'in', value: ['house', 'apartment'], weight: 0.5 }
    ];

    const data = [
      { fieldKey: 'type', fieldValue: 'House' }
    ] as ExtractedData[];

    const result = service.score(rules, data);
    expect(result.score).toBe(0.5);
  });
});
