import { Module } from '@nestjs/common';
import { VoiceGateway } from './voice.gateway';
import { VoiceOrchestratorService } from './voice-orchestrator.service';
import { ConversationModule } from '../conversation/conversation.module';
import { VoiceController } from './voice.controller';

@Module({
  imports: [ConversationModule],
  controllers: [VoiceController],
  providers: [VoiceGateway, VoiceOrchestratorService],
  exports: [VoiceOrchestratorService],
})
export class VoiceModule {}
