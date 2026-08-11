import { Test, TestingModule } from '@nestjs/testing';
import { LLMRouterService } from './llm-router.service';
import { ConfigService } from '@nestjs/config';

// Mock the global fetch for Ollama
global.fetch = jest.fn();

describe('LLMRouterService', () => {
  let service: LLMRouterService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LLMRouterService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key) => {
              if (key === 'OLLAMA_URL') return 'http://localhost:11434';
              if (key === 'GROQ_API_KEY') return 'test-key';
              if (key === 'ACTIVE_LLM_PROVIDER') return 'ollama';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<LLMRouterService>(LLMRouterService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('streamOllama', () => {
    it('should correctly buffer and parse split JSON chunks', async () => {
      const mockChunks = [
        '{"message":{"content":"Hello"},"done":false}\n{"mess',
        'age":{"content":" World"},"done":false}\n{"done":true}\n'
      ];
      
      const encoder = new TextEncoder();
      let chunkIndex = 0;
      
      const mockReader = {
        read: jest.fn().mockImplementation(() => {
          if (chunkIndex < mockChunks.length) {
            return Promise.resolve({ done: false, value: encoder.encode(mockChunks[chunkIndex++]) });
          }
          return Promise.resolve({ done: true });
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const stream = service.stream([{ role: 'user', content: 'Hi' }]);
      
      const results = [];
      for await (const chunk of stream) {
        results.push(chunk);
      }

      expect(results).toEqual(['Hello', ' World']);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should log an error but continue on invalid JSON', async () => {
      const mockChunks = [
        '{"message":{"content":"Good"},"done":false}\n',
        'THIS IS INVALID JSON\n',
        '{"message":{"content":"bye"},"done":true}\n'
      ];
      
      const encoder = new TextEncoder();
      let chunkIndex = 0;
      
      const mockReader = {
        read: jest.fn().mockImplementation(() => {
          if (chunkIndex < mockChunks.length) {
            return Promise.resolve({ done: false, value: encoder.encode(mockChunks[chunkIndex++]) });
          }
          return Promise.resolve({ done: true });
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      // Spy on the logger
      const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation();

      const stream = service.stream([{ role: 'user', content: 'Hi' }]);
      
      const results = [];
      for await (const chunk of stream) {
        results.push(chunk);
      }

      expect(results).toEqual(['Good', 'bye']);
      expect(loggerSpy).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse Ollama chunk: THIS IS INVALID JSON'),
        expect.any(Error)
      );
      
      loggerSpy.mockRestore();
    });
  });
});
