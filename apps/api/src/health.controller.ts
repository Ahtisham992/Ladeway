/**
 * Health Controller — Basic health check endpoints.
 *
 * GET /health       → Application health status
 * GET /health/ai    → AI inference layer health (added in Phase 5)
 */
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
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
}
