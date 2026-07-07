import { Module } from '@nestjs/common';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { DatabaseModule } from '../database/database.module';
import { SessionModule } from '../session/session.module';
import { IndustryConfigModule } from '../industry-config/industry-config.module';
import { AIModule } from '../ai/ai.module';
import { QualificationModule } from '../qualification/qualification.module';
import { LeadModule } from '../lead/lead.module';

@Module({
  imports: [
    DatabaseModule,
    SessionModule,
    IndustryConfigModule,
    AIModule,
    QualificationModule,
    LeadModule,
  ],
  controllers: [ConversationController],
  providers: [ConversationService],
})
export class ConversationModule {}
