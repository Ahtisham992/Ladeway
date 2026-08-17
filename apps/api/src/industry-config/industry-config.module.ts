import { Module } from '@nestjs/common';
import { IndustryConfigService } from './industry-config.service';
import { IndustryConfigController } from './industry-config.controller';
import { ConfigGeneratorService } from './config-generator.service';
import { DatabaseModule } from '../database/database.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [DatabaseModule, AIModule],
  controllers: [IndustryConfigController],
  providers: [IndustryConfigService, ConfigGeneratorService],
  exports: [IndustryConfigService, ConfigGeneratorService],
})
export class IndustryConfigModule {}
