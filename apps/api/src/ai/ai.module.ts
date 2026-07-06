import { Module } from '@nestjs/common';
import { LLMRouterService } from './llm-router.service';

@Module({
  providers: [LLMRouterService],
  exports: [LLMRouterService],
})
export class AIModule {}
