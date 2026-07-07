import { LeadTier } from './industry-config';
import { LeadStatus } from './lead';
import { ConversationStatus } from './conversation';
export interface AnalyticsSummary {
    totalConversations: number;
    conversationsByStatus: Record<ConversationStatus, number>;
    totalLeads: number;
    leadsByTier: Record<LeadTier, number>;
    conversionRate: number;
    averageConversationLength: number;
}
export interface TimeSeriesDataPoint {
    date: string;
    count: number;
}
export interface LeadFunnelData {
    stage: LeadStatus;
    count: number;
}
export interface AnalyticsQuery {
    from?: string;
    to?: string;
}
