import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('public')
  async getPublicTenants() {
    return this.tenantService.getPublicTenants();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyTenant(@Request() req: any) {
    return this.tenantService.getTenantById(req.user.tenantId);
  }

  @Post('register')
  async register(@Body() body: any) {
    return this.tenantService.register(body);
  }
}
