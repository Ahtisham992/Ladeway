/**
 * Lead types — the structured business output of the qualification process.
 *
 * A Lead is created when a conversation completes (or is abandoned with
 * sufficient data). It contains extracted fields, a score, a tier, and
 * a plain-language summary.
 */

import { LeadTier } from './industry-config';

/** Pipeline status for a lead */
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';

/** Assignment status for lead assignments */
export type AssignmentStatus = 'ACTIVE' | 'REASSIGNED' | 'COMPLETED';

/** A qualified lead produced by the AI conversation engine */
export interface Lead {
  id: string;
  conversationId: string;
  tenantId: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  score: number;
  tier: LeadTier;
  status: LeadStatus;
  summary: string;
  createdAt: Date;
}

/** Extracted data field from a conversation */
export interface ExtractedField {
  id: string;
  conversationId: string;
  fieldKey: string;
  fieldValue: string | null;
  confidence: number;
  extractedAt: Date;
}

/** Lead assignment record */
export interface LeadAssignment {
  id: string;
  leadId: string;
  userId: string;
  assignedAt: Date;
  notes: string | null;
  status: AssignmentStatus;
}

/** Result of the scoring engine */
export interface ScoringResult {
  score: number;
  tier: LeadTier;
  matchedRules: string[];
}

/** Result of the extraction engine */
export interface ExtractionResult {
  fields: Record<string, string | null>;
  confidence: Record<string, number>;
}

/** DTO for updating a lead */
export interface UpdateLeadDto {
  status?: LeadStatus;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

/** Lead list query parameters */
export interface LeadListQuery {
  status?: LeadStatus;
  tier?: LeadTier;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'score';
  sortOrder?: 'asc' | 'desc';
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
