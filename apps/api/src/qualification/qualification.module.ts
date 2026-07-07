import { Module, forwardRef } from '@nestjs/common';
import { QualificationEngineService } from './qualification-engine.service';
import { AbandonmentCronService } from './abandonment-cron.service';
import { SessionModule } from '../session/session.module';
import { DatabaseModule } from '../database/database.module';
import { ScoringService } from './scoring.service';
import { LeadModule } from '../lead/lead.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [SessionModule, DatabaseModule, AIModule, forwardRef(() => LeadModule)],
  providers: [QualificationEngineService, AbandonmentCronService, ScoringService],
  exports: [QualificationEngineService, ScoringService],
})
export class QualificationModule {}
