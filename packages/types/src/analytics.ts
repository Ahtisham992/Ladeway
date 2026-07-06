/**
 * Analytics types — dashboard metrics, time series data, and funnel data.
 */

import { LeadTier } from './industry-config';
import { LeadStatus } from './lead';
import { ConversationStatus } from './conversation';

/** Summary metrics for the analytics dashboard */
export interface AnalyticsSummary {
  totalConversations: number;
  conversationsByStatus: Record<ConversationStatus, number>;
  totalLeads: number;
  leadsByTier: Record<LeadTier, number>;
  conversionRate: number;
  averageConversationLength: number;
}

/** Time-series data point for charting */
export interface TimeSeriesDataPoint {
  date: string;
  count: number;
}

/** Lead funnel data for pipeline visualization */
export interface LeadFunnelData {
  stage: LeadStatus;
  count: number;
}

/** Query parameters for analytics endpoints */
export interface AnalyticsQuery {
  from?: string;
  to?: string;
}
