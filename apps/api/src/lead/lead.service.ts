import { Injectable, Logger, Inject, forwardRef, NotFoundException } from '@nestjs/common';
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
    
    // Strip common LLM preambles from summary
    summary = summary
      .replace(/^here is.*?:\s*/i, '')
      .replace(/^summary:\s*/i, '')
      .trim();

    let leadStatus = 'NEW';
    if (conversation.status === 'ABANDONED') {
      leadStatus = 'ABANDONED';
      summary = `[PARTIAL] ${summary}`;
    } else if (conversation.status === 'TRANSFERRED') {
      leadStatus = 'TRANSFERRED';
    }

    // 3. Contact Info
    const contactInfo = this.extractContactInfo(extractedData);

    // 4. Create Lead
    // Using $system to bypass RLS in case this is running from public endpoint or cron
    const lead = await this.prisma.$system.lead.upsert({
      where: { conversationId: conversation.id },
      create: {
        conversationId: conversation.id,
        tenantId: conversation.tenantId,
        contactName: contactInfo.contactName,
        contactEmail: contactInfo.contactEmail,
        contactPhone: contactInfo.contactPhone,
        score,
        tier,
        summary,
        status: leadStatus,
      },
      update: {
        contactName: contactInfo.contactName,
        contactEmail: contactInfo.contactEmail,
        contactPhone: contactInfo.contactPhone,
        score,
        tier,
        summary,
        status: leadStatus,
      }
    });

    this.logger.log(`Created lead ${lead.id} for conversation ${conversation.id}`);
    return lead;
  }

  private extractContactInfo(data: ExtractedData[]): {
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
  } {
    const find = (...keys: string[]) => {
      const found = [...data].reverse().find(d => {
        if (!keys.includes(d.fieldKey) || !d.fieldValue) return false;
        const val = d.fieldValue.toLowerCase();
        return val !== 'null' && val !== 'none' && val !== 'not explicitly stated' && val !== 'not specified';
      });
      return found?.fieldValue ?? null;
    };

    return {
      contactName: find('name', 'contact_name', 'full_name', 'customer_name'),
      contactEmail: find('email', 'contact_email', 'email_address'),
      contactPhone: find('phone', 'contact_phone', 'phone_number', 'mobile'),
    };
  }

  async findAll(tenantId: string, options: {
    page: number;
    limit: number;
    tier?: string;
    status?: string;
    sortBy: string;
    order: string;
  }) {
    const where: any = { tenantId };
    if (options.tier) where.tier = options.tier;
    if (options.status) where.status = options.status;

    let orderBy: any = { createdAt: 'desc' };
    if (options.sortBy === 'score') orderBy = { score: options.order };
    if (options.sortBy === 'date') orderBy = { createdAt: options.order };

    const leads = await this.prisma.lead.findMany({
      where,
      include: {
        conversation: {
          include: {
            config: {
              select: { industryName: true, personaName: true }
            }
          }
        }
      },
      orderBy,
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    });

    const total = await this.prisma.lead.count({ where });

    return {
      data: leads,
      meta: {
        total,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(total / options.limit),
      }
    };
  }

  async findOne(id: string, tenantId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, tenantId },
      include: {
        conversation: {
          include: {
            messages: { orderBy: { timestamp: 'asc' } },
            extractedData: true,
            config: {
              select: { industryName: true, personaName: true }
            }
          }
        }
      }
    });

    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async updateStatus(id: string, status: string, tenantId: string) {
    const lead = await this.prisma.lead.findFirst({ where: { id, tenantId } });
    if (!lead) throw new NotFoundException('Lead not found');

    return this.prisma.lead.update({
      where: { id },
      data: { status }
    });
  }
}
