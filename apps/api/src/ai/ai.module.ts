import { Module } from '@nestjs/common';
import { LLMRouterService } from './llm-router.service';
import { PromptService } from './prompt.service';

@Module({
  providers: [LLMRouterService, PromptService],
  exports: [LLMRouterService, PromptService],
})
export class AIModule {}
