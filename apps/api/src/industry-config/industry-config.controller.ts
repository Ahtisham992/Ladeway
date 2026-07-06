import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, UsePipes } from '@nestjs/common';
import { IndustryConfigService } from './industry-config.service';
import { CreateIndustryConfigDto, CreateIndustryConfigDtoSchema, UpdateIndustryConfigDto, UpdateIndustryConfigDtoSchema } from './schemas/config.schema';
import { ZodValidationPipe } from './zod.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { LLMRouterService } from '../ai/llm-router.service';

@Controller('industry-configs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IndustryConfigController {
  constructor(
    private readonly industryConfigService: IndustryConfigService,
    private readonly llmRouter: LLMRouterService,
  ) {}

  @Post()
  @Roles('ADMIN')
  @UsePipes(new ZodValidationPipe(CreateIndustryConfigDtoSchema))
  create(@Body() createDto: CreateIndustryConfigDto) {
    return this.industryConfigService.create(createDto);
  }

  @Get()
  @Roles('ADMIN', 'REP')
  findAll() {
    return this.industryConfigService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'REP')
  findOne(@Param('id') id: string) {
    return this.industryConfigService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateIndustryConfigDtoSchema)) updateDto: UpdateIndustryConfigDto,
  ) {
    return this.industryConfigService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.industryConfigService.remove(id);
  }

  @Get(':id/preview')
  @Roles('ADMIN')
  async preview(@Param('id') id: string) {
    // 1. Load the config
    const config = await this.industryConfigService.findOne(id);

    // 2. We can inject the config parameters into the system prompt here if needed.
    // For the preview, we'll just test the LLM router as requested with a system prompt and user message.
    const messages: any[] = [
      { role: 'system', content: `You are a ${config.personaRole} named ${config.personaName} for ${config.industryName}. Your tone is ${config.tone}. Greet the user with: "${config.greeting}"` },
      { role: 'user', content: "Hello, I'm interested in your services" }
    ];

    // 3. Call LLMRouterService.stream() with a single test message
    let fullResponse = '';
    for await (const token of this.llmRouter.stream(messages)) {
      fullResponse += token;
    }

    // 4. Return as a single JSON response
    return { response: fullResponse };
  }
}
