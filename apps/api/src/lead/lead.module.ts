import { Module, forwardRef } from '@nestjs/common';
import { LeadController } from './lead.controller';
import { LeadService } from './lead.service';
import { DatabaseModule } from '../database/database.module';
import { AIModule } from '../ai/ai.module';
import { QualificationModule } from '../qualification/qualification.module';

@Module({
  imports: [DatabaseModule, AIModule, forwardRef(() => QualificationModule)],
  controllers: [LeadController],
  providers: [LeadService],
  exports: [LeadService],
})
export class LeadModule {}
