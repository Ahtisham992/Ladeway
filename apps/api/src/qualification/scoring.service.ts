import { Injectable, Logger } from '@nestjs/common';
import { ScoringRule, LeadTier, ScoringResult } from '@ladeway/types';
import { ExtractedData } from '@prisma/client';

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);

  score(rules: ScoringRule[], extractedData: ExtractedData[]): ScoringResult {
    let totalScore = 0;
    let tierOverride: LeadTier | null = null;
    const matchedRules: string[] = [];

    for (const rule of rules) {
      const field = extractedData.find(d => d.fieldKey === rule.field);
      if (this.evaluateCondition(rule, field)) {
        totalScore += rule.weight;
        matchedRules.push(rule.field); // Tracking rule fields that matched
        if (rule.tier) tierOverride = rule.tier;  // Last matching override wins
      }
    }

    // Tier override from rules takes absolute priority
    if (tierOverride) return { score: totalScore, tier: tierOverride, matchedRules };

    // Fallback: derive tier from total weight (0-1 scale since weights are 0-1)
    const tier = totalScore >= 0.7 ? 'HOT'
               : totalScore >= 0.4 ? 'WARM'
               : 'COLD';

    return { score: totalScore, tier, matchedRules };
  }

  private evaluateCondition(rule: ScoringRule, field?: ExtractedData): boolean {
    if (!field || field.fieldValue === null || field.fieldValue === undefined) {
      return false;
    }

    const value = field.fieldValue;

    switch (rule.condition) {
      case 'present':
        return true;
      case 'equals':
        return value.toLowerCase() === String(rule.value).toLowerCase();
      case 'greater_than':
        return Number(value) > Number(rule.value);
      case 'less_than':
        return Number(value) < Number(rule.value);
      case 'in':
        if (Array.isArray(rule.value)) {
          return rule.value.map(String).map(s => s.toLowerCase()).includes(value.toLowerCase());
        }
        return false;
      default:
        return false;
    }
  }
}
