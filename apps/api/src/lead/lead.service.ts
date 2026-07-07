import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ScoringService } from '../qualification/scoring.service';
import { LLMRouterService } from '../ai/llm-router.service';
import { PromptService } from '../ai/prompt.service';
import { ExtractedData } from '@prisma/client';
import { ScoringRule } from '@ladeway/types';

@Injectable()
export class LeadService {
  private readonly logger = new Logger(LeadService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ScoringService))
    private readonly scoringService: ScoringService,
    private readonly llmRouter: LLMRouterService,
    private readonly promptService: PromptService,
  ) {}

  async createLeadFromConversation(conversationId: string): Promise<any> {
    const conversation = await this.prisma.$system.conversation.findUnique({
      where: { id: conversationId },
      include: { extractedData: true, config: true },
    });

    if (!conversation || !conversation.config) {
      throw new Error(`Conversation ${conversationId} or its config not found`);
    }

    const config = conversation.config as any;
    const extractedData = conversation.extractedData;

    // 1. Scoring
    const scoringRules = (config.scoringRulesJson || config.scoringRules || []) as ScoringRule[];
    const { score, tier } = this.scoringService.score(scoringRules, extractedData);

    // 2. Summary
    const mappedData = extractedData.map(d => ({ fieldKey: d.fieldKey, fieldValue: d.fieldValue }));
    const prompt = this.promptService.assembleLeadSummaryPrompt(config, mappedData);
    
    let summary = '';
    const iterator = this.llmRouter.stream(prompt);
    for await (const chunk of iterator) {
      summary += chunk;
    }
    summary = summary.trim();

    // 3. Contact Info
    const contactInfo = this.extractContactInfo(extractedData);

    // 4. Create Lead
    // Using $system to bypass RLS in case this is running from public endpoint or cron
    const lead = await this.prisma.$system.lead.create({
      data: {
        conversationId: conversation.id,
        tenantId: conversation.tenantId,
        contactName: contactInfo.contactName,
        contactEmail: contactInfo.contactEmail,
        contactPhone: contactInfo.contactPhone,
        score,
        tier,
        summary,
        status: 'NEW',
      },
    });

    this.logger.log(`Created lead ${lead.id} for conversation ${conversation.id}`);
    return lead;
  }

  private extractContactInfo(data: ExtractedData[]): {
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
  } {
    const find = (...keys: string[]) =>
      data.find(d => keys.includes(d.fieldKey) && d.fieldValue)?.fieldValue ?? null;

    return {
      contactName: find('name', 'contact_name', 'full_name', 'customer_name'),
      contactEmail: find('email', 'contact_email', 'email_address'),
      contactPhone: find('phone', 'contact_phone', 'phone_number', 'mobile'),
    };
  }
}
