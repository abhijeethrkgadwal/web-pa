export interface FieldMapping {
  readonly selector: string;
  readonly value: string;
  readonly confidence?: number;
  readonly source?: 'heuristic' | 'ai';
  readonly fieldName?: string;
  readonly fieldLabel?: string;
}

export interface FieldMappingRequest {
  readonly profile: Record<string, unknown>;
  readonly fields: Array<{
    name: string;
    type: string;
    label?: string;
    selector: string;
    visible: boolean;
    options?: Array<{ label: string; value: string }>;
  }>;
}

export interface FieldMappingResult {
  readonly mappings: FieldMapping[];
  readonly source: 'heuristic' | 'ai';
  readonly error?: string;
}
