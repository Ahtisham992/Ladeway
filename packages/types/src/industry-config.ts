/**
 * IndustryConfig — The central architectural entity of Ladeway.
 *
 * Every qualification field, persona, tone, and scoring rule lives in an
 * IndustryConfig database record. A new industry = a new database row, not a
 * code change. The AI engine has zero industry-specific code.
 */

/** Type of data a qualification field captures */
export type FieldType = 'text' | 'number' | 'date' | 'enum';

/** Tone of the AI persona during conversations */
export type ConversationTone = 'professional' | 'friendly' | 'formal';

/**
 * A single qualification field that the AI needs to extract from a conversation.
 * Defined per-industry in IndustryConfig.fieldsJson.
 */
export interface QualificationField {
  /** Unique key for this field (e.g., "origin", "property_type") */
  key: string;
  /** Human-readable label (e.g., "Origin City", "Property Type") */
  label: string;
  /** Data type of the field value */
  type: FieldType;
  /** Whether this field must be captured before qualification is complete */
  required: boolean;
  /** Valid options for enum fields */
  options?: string[];
  /** Guides the extractor LLM: "city the customer is moving from" */
  extractionHint: string;
}

/** Condition operators for scoring rules */
export type ScoringCondition = 'present' | 'equals' | 'greater_than' | 'less_than' | 'in';

/** Lead tier classification */
export type LeadTier = 'HOT' | 'WARM' | 'COLD';

/**
 * A scoring rule that evaluates extracted data to determine lead quality.
 * Defined per-industry in IndustryConfig.scoringRulesJson.
 */
export interface ScoringRule {
  /** The qualification field key this rule evaluates */
  field: string;
  /** The comparison operator */
  condition: ScoringCondition;
  /** The value to compare against (type depends on condition) */
  value?: string | number | string[];
  /** Weight of this rule in the overall score (0-100) */
  weight: number;
  /** Override tier if this rule fires */
  tier?: LeadTier;
}

/**
 * Complete industry configuration record.
 * This is the single source of truth for all AI behaviour for a given industry.
 */
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

/**
 * DTO for creating a new IndustryConfig.
 * Omits auto-generated fields.
 */
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

/**
 * DTO for updating an existing IndustryConfig.
 * All fields optional for partial updates.
 */
export interface UpdateIndustryConfigDto extends Partial<CreateIndustryConfigDto> {}
