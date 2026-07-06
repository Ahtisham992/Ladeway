import { z } from 'zod';

export const QualificationFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'number', 'date', 'enum']),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  extractionHint: z.string().min(1),
});

export const ScoringRuleSchema = z.object({
  field: z.string().min(1),
  condition: z.enum(['present', 'equals', 'greater_than', 'less_than', 'in']),
  value: z.union([z.string(), z.number(), z.array(z.string())]).optional(),
  weight: z.number().min(0).max(1),
  tier: z.enum(['HOT', 'WARM', 'COLD']).optional(),
});

export const CreateIndustryConfigDtoSchema = z.object({
  industryName: z.string().min(1),
  personaName: z.string().min(1),
  personaRole: z.string().min(1),
  greeting: z.string().min(1),
  tone: z.string().min(1).default('professional'),
  fieldsJson: z.array(QualificationFieldSchema),
  scoringRulesJson: z.array(ScoringRuleSchema),
  isActive: z.boolean().default(true),
});

export const UpdateIndustryConfigDtoSchema = CreateIndustryConfigDtoSchema.partial();

export type CreateIndustryConfigDto = z.infer<typeof CreateIndustryConfigDtoSchema>;
export type UpdateIndustryConfigDto = z.infer<typeof UpdateIndustryConfigDtoSchema>;
