import { Module } from '@nestjs/common';
import { QualificationEngineService } from './qualification-engine.service';
import { AbandonmentCronService } from './abandonment-cron.service';
import { SessionModule } from '../session/session.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [SessionModule, DatabaseModule],
  providers: [QualificationEngineService, AbandonmentCronService],
  exports: [QualificationEngineService],
})
export class QualificationModule {}
