import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { LeadService } from './lead.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('leads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Get()
  @Roles('ADMIN', 'REP')
  async findAll(
    @CurrentUser() user: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('tier') tier?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy: string = 'date',
    @Query('order') order: string = 'desc'
  ) {
    return this.leadService.findAll(user.tenantId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      tier,
      status,
      sortBy,
      order
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'REP')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.leadService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  @Roles('ADMIN', 'REP')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: any
  ) {
    return this.leadService.updateStatus(id, status, user.tenantId);
  }
}
