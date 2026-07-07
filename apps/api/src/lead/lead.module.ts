import { Module, forwardRef } from '@nestjs/common';
import { LeadService } from './lead.service';
import { DatabaseModule } from '../database/database.module';
import { AIModule } from '../ai/ai.module';
import { QualificationModule } from '../qualification/qualification.module';

@Module({
  imports: [DatabaseModule, AIModule, forwardRef(() => QualificationModule)],
  providers: [LeadService],
  exports: [LeadService],
})
export class LeadModule {}
