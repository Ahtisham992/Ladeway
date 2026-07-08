import { Controller, Post, Body } from '@nestjs/common';
import { TenantService } from './tenant.service';

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post('register')
  async register(@Body() body: any) {
    return this.tenantService.register(body);
  }
}
