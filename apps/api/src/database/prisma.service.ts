import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { tenantContext } from '../tenant/tenant.context';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  public readonly $system: PrismaClient;

  constructor() {
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      max: 50,
      connectionTimeoutMillis: 15000 
    });
    const adapter = new PrismaPg(pool);
    super({ adapter, log: ['error', 'warn'] });
    
    // Save the raw unextended client for system-level operations (like Auth)
    this.$system = this;

    // Return an extended client that automatically applies RLS
    // by wrapping every query in a transaction that sets the tenant ID.
    // We cast to `any` and then `this` to satisfy NestJS DI which expects a PrismaService instance.
    const self = this;
    const extended = this.$extends({
      query: {
        $allModels: {
          async $allOperations({ args, query }) {
            const tenantId = tenantContext.getStore();
            if (tenantId) {
              const [, , result] = await self.$transaction([
                self.$executeRawUnsafe(`SET LOCAL ROLE authenticated`),
                self.$executeRawUnsafe(`SELECT set_config('app.current_tenant_id', '${tenantId}', true)`),
                query(args),
              ], { maxWait: 15000, timeout: 30000 });
              return result;
            } else {
              // If no tenant context, we still need to restrict to authenticated so it blocks queries
              // Wait, if no tenant context is set (e.g. background job), what should it do? 
              // If we are testing RLS blocking, we can set the role to authenticated and clear the setting.
              const [, , result] = await self.$transaction([
                self.$executeRawUnsafe(`SET LOCAL ROLE authenticated`),
                self.$executeRawUnsafe(`SELECT set_config('app.current_tenant_id', '', true)`),
                query(args),
              ], { maxWait: 15000, timeout: 30000 });
              return result;
            }
          },
        },
      },
    });
    
    return extended as any;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
