/**
 * AppModule — Root module for the Ladeway NestJS backend.
 *
 * Imports all feature modules per the NestJS Module Architecture diagram.
 * Feature modules will be added in subsequent phases:
 *   Phase 2:  DatabaseModule
 *   Phase 3:  TenantModule
 *   Phase 4:  AuthModule
 *   Phase 5:  AIModule
 *   Phase 6:  ConfigModule
 *   Phase 7:  CacheModule
 *   Phase 9:  QualificationModule
 *   Phase 10: ConversationModule
 *   Phase 12: LeadModule
 *   Phase 17: AnalyticsModule
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { TenantModule } from './tenant/tenant.module';
import { AuthModule } from './auth/auth.module';
import { AIModule } from './ai/ai.module';
import { HealthController } from './health.controller';
import { CacheModule } from '@nestjs/cache-manager';
import { IndustryConfigModule } from './industry-config/industry-config.module';
import { RedisModule } from './redis/redis.module';
import { SessionModule } from './session/session.module';
import { ScheduleModule } from '@nestjs/schedule';
import { QualificationModule } from './qualification/qualification.module';
import { ConversationModule } from './conversation/conversation.module';

@Module({
  imports: [
    // Environment variable configuration — loads .env file
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    DatabaseModule,
    TenantModule,
    AuthModule,
    AIModule,
    IndustryConfigModule,
    RedisModule,
    SessionModule,
    ScheduleModule.forRoot(),
    QualificationModule,
    ConversationModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
