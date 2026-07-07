export interface ExtractedField {
  value: string | null;
  confidence: number;
}

export type ExtractionResult = Record<string, ExtractedField>;
