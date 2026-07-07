import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AnalyticsSummary, TimeSeriesDataPoint } from '@ladeway/types';
import { tenantContext } from '../tenant/tenant.context';

import { Prisma } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(startDate?: string, endDate?: string): Promise<AnalyticsSummary> {
    const tenantId = tenantContext.getStore();
    if (!tenantId) throw new Error('Tenant context missing');

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.startedAt = {};
      if (startDate) dateFilter.startedAt.gte = new Date(startDate);
      if (endDate) dateFilter.startedAt.lte = new Date(endDate);
    }
    // Convert dates to SQL timestamps if present
    const startFilter = startDate ? new Date(startDate) : null;
    const endFilter = endDate ? new Date(endDate) : null;

    const startSqlConv = startFilter ? Prisma.sql`AND "startedAt" >= ${startFilter}` : Prisma.empty;
    const endSqlConv = endFilter ? Prisma.sql`AND "startedAt" <= ${endFilter}` : Prisma.empty;
    const startSqlLead = startFilter ? Prisma.sql`AND "createdAt" >= ${startFilter}` : Prisma.empty;
    const endSqlLead = endFilter ? Prisma.sql`AND "createdAt" <= ${endFilter}` : Prisma.empty;
    const startSqlMsg = startFilter ? Prisma.sql`AND c."startedAt" >= ${startFilter}` : Prisma.empty;
    const endSqlMsg = endFilter ? Prisma.sql`AND c."startedAt" <= ${endFilter}` : Prisma.empty;

    // Run independent raw SQL queries in parallel to avoid Prisma middleware transaction overhead
    // and reduce latency significantly. We manually enforce tenantId in WHERE clauses.
    const [
      statusCountsRaw,
      totalMessagesRaw,
      leadCountsRaw,
      byIndustryRaw,
      conversationsWithLeadsRaw
    ] = await Promise.all([
      this.prisma.$queryRaw<{status: string, count: bigint}[]>`
        SELECT status, COUNT(*)::bigint as count
        FROM "Conversation"
        WHERE "tenantId" = ${tenantId}
        ${startSqlConv}
        ${endSqlConv}
        GROUP BY status
      `,
      this.prisma.$queryRaw<{count: bigint}[]>`
        SELECT COUNT(*)::bigint as count
        FROM "Message" m
        JOIN "Conversation" c ON c.id = m."conversationId"
        WHERE c."tenantId" = ${tenantId}
        ${startSqlMsg}
        ${endSqlMsg}
      `,
      this.prisma.$queryRaw<{tier: string, count: bigint}[]>`
        SELECT tier, COUNT(*)::bigint as count
        FROM "Lead"
        WHERE "tenantId" = ${tenantId}
        ${startSqlLead}
        ${endSqlLead}
        GROUP BY tier
      `,
      this.prisma.$queryRaw<{configId: string, count: bigint}[]>`
        SELECT "configId", COUNT(*)::bigint as count
        FROM "Conversation"
        WHERE "tenantId" = ${tenantId}
        ${startSqlConv}
        ${endSqlConv}
        GROUP BY "configId"
      `,
      this.prisma.$queryRaw<{configId: string, count: bigint}[]>`
        SELECT c."configId", COUNT(*)::bigint as count
        FROM "Conversation" c
        JOIN "Lead" l ON l."conversationId" = c.id
        WHERE c."tenantId" = ${tenantId}
        ${startSqlMsg}
        ${endSqlMsg}
        GROUP BY c."configId"
      `
    ]);

    let totalConversations = 0;
    let qualifying = 0;
    let closed = 0;
    let transferred = 0;
    let abandoned = 0;

    for (const row of statusCountsRaw) {
      const c = Number(row.count);
      totalConversations += c;
      if (row.status === 'QUALIFYING' || row.status === 'GREETING' || row.status === 'EXTRACTING' || row.status === 'SCORED') qualifying += c;
      else if (row.status === 'CLOSED') closed += c;
      else if (row.status === 'TRANSFERRED') transferred += c;
      else if (row.status === 'ABANDONED') abandoned += c;
    }

    const totalMessages = totalMessagesRaw.length > 0 ? Number(totalMessagesRaw[0].count) : 0;
    const averageTurnCount = totalConversations > 0 ? Math.round(((totalMessages / 2) / totalConversations) * 10) / 10 : 0;

    let totalLeads = 0;
    let hotLeads = 0;
    let warmLeads = 0;
    let coldLeads = 0;

    for (const row of leadCountsRaw) {
      const c = Number(row.count);
      totalLeads += c;
      if (row.tier === 'HOT') hotLeads += c;
      else if (row.tier === 'WARM') warmLeads += c;
      else if (row.tier === 'COLD') coldLeads += c;
    }

    const completedConversations = closed + transferred;
    const conversionRate = totalConversations > 0 ? (totalLeads / totalConversations) * 100 : 0;

    const configs = await this.prisma.industryConfig.findMany({
      where: { tenantId, id: { in: byIndustryRaw.map(r => r.configId) } },
      select: { id: true, industryName: true }
    });
    
    const leadCountsByConfig = new Map(conversationsWithLeadsRaw.map(r => [r.configId, Number(r.count)]));

    const byIndustry = byIndustryRaw.map(row => {
      const config = configs.find(c => c.id === row.configId);
      const leads = leadCountsByConfig.get(row.configId) || 0;
      const convs = Number(row.count);
      return {
        configId: row.configId,
        industryName: config ? config.industryName : 'Unknown',
        conversations: convs,
        leads: leads,
        conversionRate: convs > 0 ? (leads / convs) * 100 : 0
      };
    });

    return {
      totalConversations,
      completedConversations,
      conversionRate: Math.round(conversionRate * 10) / 10,
      totalLeads,
      hotLeads,
      warmLeads,
      coldLeads,
      averageTurnCount,
      byStatus: {
        qualifying,
        closed,
        transferred,
        abandoned
      },
      byIndustry
    };
  }

  async getConversationTimeSeries(startDate: string, endDate: string): Promise<TimeSeriesDataPoint[]> {
    const tenantId = tenantContext.getStore();
    if (!tenantId) throw new Error('Tenant context missing');

    const timeSeries = await this.prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT 
        DATE_TRUNC('day', "startedAt")::date::text as date,
        COUNT(*)::bigint as count
      FROM "Conversation"
      WHERE "tenantId" = ${tenantId}
        AND "startedAt" >= ${new Date(startDate)}::timestamp
        AND "startedAt" <= ${new Date(endDate)}::timestamp
      GROUP BY DATE_TRUNC('day', "startedAt")
      ORDER BY date ASC
    `;

    return timeSeries.map(row => ({
      date: row.date,
      count: Number(row.count)
    }));
  }

  async getLeadTimeSeries(startDate: string, endDate: string): Promise<TimeSeriesDataPoint[]> {
    const tenantId = tenantContext.getStore();
    if (!tenantId) throw new Error('Tenant context missing');

    const timeSeries = await this.prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT 
        DATE_TRUNC('day', "createdAt")::date::text as date,
        COUNT(*)::bigint as count
      FROM "Lead"
      WHERE "tenantId" = ${tenantId}
        AND "createdAt" >= ${new Date(startDate)}::timestamp
        AND "createdAt" <= ${new Date(endDate)}::timestamp
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `;

    return timeSeries.map(row => ({
      date: row.date,
      count: Number(row.count)
    }));
  }
}
