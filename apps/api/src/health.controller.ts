/**
 * Health Controller — Basic health check endpoints.
 *
 * GET /health       → Application health status
 * GET /health/ai    → AI inference layer health (added in Phase 5)
 */
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { LLMRouterService } from './ai/llm-router.service';

@Controller('health')
export class HealthController {
  constructor(private readonly llmRouter: LLMRouterService) {}

  /**
   * Basic application health check.
   * Returns OK if the NestJS server is running.
   */
  @Get()
  check(): { status: string; timestamp: string; service: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'ladeway-api',
    };
  }

  @Get('chaos')
  triggerChaos() {
    throw new Error('CHAOS_DRILL: Intentional unhandled exception to test Sentry & Discord alerting.');
  }

  @Get('ai')
  async checkAI() {
    const start = Date.now();
    try {
      const token = await this.llmRouter.generateSingleToken();
      const latencyMs = Date.now() - start;
      return { status: 'ok', latencyMs, sample: token };
    } catch (error: any) {
      return { status: 'error', error: error.message, latencyMs: Date.now() - start };
    }
  }

  @Get('ai/test-stream')
  async testStream(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    try {
      const iterator = this.llmRouter.stream([{ role: 'user', content: 'Say hello and describe the weather.' }]);
      for await (const chunk of iterator) {
        res.write(chunk);
      }
      res.end();
    } catch (error: any) {
      res.write(`\n[ERROR: ${error.message}]`);
      res.end();
    }
  }
}
