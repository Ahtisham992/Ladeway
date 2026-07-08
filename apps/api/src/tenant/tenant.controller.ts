import { Controller, Post, Body, Get } from '@nestjs/common';
import { TenantService } from './tenant.service';

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('public')
  async getPublicTenants() {
    return this.tenantService.getPublicTenants();
  }

  @Post('register')
  async register(@Body() body: any) {
    return this.tenantService.register(body);
  }
}
