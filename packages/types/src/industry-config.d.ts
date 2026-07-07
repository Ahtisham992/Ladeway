export type FieldType = 'text' | 'number' | 'date' | 'enum';
export type ConversationTone = 'professional' | 'friendly' | 'formal';
export interface QualificationField {
    key: string;
    label: string;
    type: FieldType;
    required: boolean;
    options?: string[];
    extractionHint: string;
}
export type ScoringCondition = 'present' | 'equals' | 'greater_than' | 'less_than' | 'in';
export type LeadTier = 'HOT' | 'WARM' | 'COLD';
export interface ScoringRule {
    field: string;
    condition: ScoringCondition;
    value?: string | number | string[];
    weight: number;
    tier?: LeadTier;
}
export interface IndustryConfig {
    id: string;
    tenantId: string;
    industryName: string;
    personaName: string;
    personaRole: string;
    greeting: string;
    tone: ConversationTone;
    qualificationFields: QualificationField[];
    scoringRules: ScoringRule[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateIndustryConfigDto {
    industryName: string;
    personaName: string;
    personaRole: string;
    greeting: string;
    tone: ConversationTone;
    qualificationFields: QualificationField[];
    scoringRules: ScoringRule[];
    isActive?: boolean;
}
export interface UpdateIndustryConfigDto extends Partial<CreateIndustryConfigDto> {
}
