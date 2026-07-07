import { Test, TestingModule } from '@nestjs/testing';
import { ExtractorService } from './extractor.service';
import { LLMRouterService } from './llm-router.service';
import { PromptService } from './prompt.service';

describe('ExtractorService', () => {
  let service: ExtractorService;
  let llmRouter: LLMRouterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExtractorService,
        {
          provide: LLMRouterService,
          useValue: { stream: jest.fn() },
        },
        {
          provide: PromptService,
          useValue: { assembleExtractionPrompt: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ExtractorService>(ExtractorService);
    llmRouter = module.get<LLMRouterService>(LLMRouterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should parse valid JSON properly and handle flat strings/nulls', async () => {
    const mockJson = JSON.stringify({
      origin: { value: 'New York', confidence: 0.9 },
      destination: 'London',
      timeline: null,
    });

    async function* mockStream() {
      yield '```json\n';
      yield mockJson;
      yield '\n```';
    }
    
    (llmRouter.stream as jest.Mock).mockResolvedValue(mockStream());

    const result = await service.extract(
      { fieldsJson: [{ key: 'origin' }, { key: 'destination' }, { key: 'timeline' }] } as any,
      { missingFields: ['origin', 'destination', 'timeline'] } as any,
      []
    );

    expect(result['origin'].value).toBe('New York');
    expect(result['origin'].confidence).toBe(0.9);
    
    expect(result['destination'].value).toBe('London');
    expect(result['destination'].confidence).toBe(0.8);

    expect(result['timeline'].value).toBeNull();
    expect(result['timeline'].confidence).toBe(0);
  });
});
