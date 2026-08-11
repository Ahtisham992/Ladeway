import { Module } from '@nestjs/common';
import { VoiceGateway } from './voice.gateway';
import { VoiceOrchestratorService } from './voice-orchestrator.service';
import { ConversationModule } from '../conversation/conversation.module';

@Module({
  imports: [ConversationModule],
  providers: [VoiceGateway, VoiceOrchestratorService],
  exports: [VoiceOrchestratorService],
})
export class VoiceModule {}
