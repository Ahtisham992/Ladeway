/**
 * Analytics types — dashboard metrics, time series data, and funnel data.
 */

/** Summary metrics for the analytics dashboard */
export interface AnalyticsSummary {
  totalConversations: number;
  completedConversations: number;
  conversionRate: number;
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  averageTurnCount: number;
  byStatus: {
    qualifying: number;
    closed: number;
    transferred: number;
    abandoned: number;
  };
  byIndustry: {
    configId: string;
    industryName: string;
    conversations: number;
    leads: number;
    conversionRate: number;
  }[];
}

/** Time-series data point for charting */
export interface TimeSeriesDataPoint {
  date: string;
  count: number;
}

/** Query parameters for analytics endpoints */
export interface AnalyticsQuery {
  from?: string;
  to?: string;
}
