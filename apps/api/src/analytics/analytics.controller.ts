import { Controller, Get, Query, UseGuards, Logger } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @Roles('ADMIN')
  async getSummary(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    try {
      return await this.analyticsService.getSummary(from, to);
    } catch (error: any) {
      this.logger.error('getSummary error:', error);
      throw error;
    }
  }

  @Get('conversations')
  @Roles('ADMIN')
  async getConversations(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (!from || !to) throw new Error('from and to dates are required for time series');
    return this.analyticsService.getConversationTimeSeries(from, to);
  }

  @Get('leads')
  @Roles('ADMIN')
  async getLeads(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (!from || !to) throw new Error('from and to dates are required for time series');
    return this.analyticsService.getLeadTimeSeries(from, to);
  }
}
