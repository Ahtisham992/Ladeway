import { Module } from '@nestjs/common';
import { IndustryConfigService } from './industry-config.service';
import { IndustryConfigController } from './industry-config.controller';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [AIModule],
  controllers: [IndustryConfigController],
  providers: [IndustryConfigService],
  exports: [IndustryConfigService],
})
export class IndustryConfigModule {}
