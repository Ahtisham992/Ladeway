import { Controller, Get, Post, Body, Param, Put, Patch, Delete, UseGuards, UsePipes, Query } from '@nestjs/common';
import { IndustryConfigService } from './industry-config.service';
import { CreateIndustryConfigDto, CreateIndustryConfigDtoSchema, UpdateIndustryConfigDto, UpdateIndustryConfigDtoSchema } from './schemas/config.schema';
import { ZodValidationPipe } from './zod.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { LLMRouterService } from '../ai/llm-router.service';
import { PromptService } from '../ai/prompt.service';
import { ConversationSession, ConversationStatus } from '../session/types/session.types';

@Controller('industry-configs')
export class IndustryConfigController {
  constructor(
    private readonly industryConfigService: IndustryConfigService,
    private readonly llmRouter: LLMRouterService,
    private readonly promptService: PromptService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UsePipes(new ZodValidationPipe(CreateIndustryConfigDtoSchema))
  create(@Body() createDto: CreateIndustryConfigDto) {
    return this.industryConfigService.create(createDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'REP')
  findAll() {
    return this.industryConfigService.findAll();
  }

  @Get('public')
  async getPublicConfigs(@Query('tenantId') tenantId?: string) {
    return this.industryConfigService.getPublicConfigs(tenantId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'REP')
  findOne(@Param('id') id: string) {
    return this.industryConfigService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateIndustryConfigDtoSchema)) updateDto: UpdateIndustryConfigDto,
  ) {
    return this.industryConfigService.update(id, updateDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.industryConfigService.updateStatus(id, isActive);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.industryConfigService.remove(id);
  }

  @Get(':id/preview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async preview(@Param('id') id: string, @Query('message') message?: string) {
    const config = await this.industryConfigService.findOne(id);
    const userMessage = message || 'Hello';

    const messages: any[] = [
      { 
        role: 'system', 
        content: `You are a ${config.personaRole} named ${config.personaName} for ${config.industryName}. Your tone is ${config.tone}. ` +
                 `The user is testing your configuration. Answer their message appropriately based on your persona.`
      },
      { role: 'user', content: userMessage }
    ];

    let fullResponse = '';
    for await (const token of this.llmRouter.stream(messages)) {
      fullResponse += token;
    }

    return { 
      response: fullResponse,
      configId: config.id,
      personaName: config.personaName
    };
  }

  @Post('preview')
  @UseGuards(JwtAuthGuard)
  async previewDraft(@Body() draftConfig: any) {
    const config = {
      ...draftConfig,
      fieldsJson: draftConfig.fieldsJson || [],
    } as any;

    const session: ConversationSession = {
      conversationId: 'preview-session',
      tenantId: 'preview-tenant',
      configId: 'preview-config',
      status: ConversationStatus.GREETING,
      capturedFields: {},
      missingFields: (config.fieldsJson as any[]).map(f => f.key),
      turnCount: 0,
      lastActivityAt: new Date().toISOString()
    };

    const userMessages = draftConfig.messages || [{ role: 'user', content: 'Hello' }];
    const messages = this.promptService.assembleConversationPrompt(config, session, userMessages);

    let fullResponse = '';
    for await (const token of this.llmRouter.stream(messages)) {
      fullResponse += token;
    }

    return { 
      response: fullResponse,
      personaName: config.personaName || 'AI Agent'
    };
  }
}
