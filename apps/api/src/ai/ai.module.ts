import { Module } from '@nestjs/common';
import { LLMRouterService } from './llm-router.service';
import { PromptService } from './prompt.service';
import { ExtractorService } from './extractor.service';

@Module({
  providers: [LLMRouterService, PromptService, ExtractorService],
  exports: [LLMRouterService, PromptService, ExtractorService],
})
export class AIModule {}
