import { LeadTier } from './industry-config';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';
export type AssignmentStatus = 'ACTIVE' | 'REASSIGNED' | 'COMPLETED';
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
export interface ExtractedField {
    id: string;
    conversationId: string;
    fieldKey: string;
    fieldValue: string | null;
    confidence: number;
    extractedAt: Date;
}
export interface LeadAssignment {
    id: string;
    leadId: string;
    userId: string;
    assignedAt: Date;
    notes: string | null;
    status: AssignmentStatus;
}
export interface ScoringResult {
    score: number;
    tier: LeadTier;
    matchedRules: string[];
}
export interface ExtractionResult {
    fields: Record<string, string | null>;
    confidence: Record<string, number>;
}
export interface UpdateLeadDto {
    status?: LeadStatus;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
}
export interface LeadListQuery {
    status?: LeadStatus;
    tier?: LeadTier;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'score';
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
