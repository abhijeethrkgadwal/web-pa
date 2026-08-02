import type { FieldMapping } from '@browser-ai/contracts';

declare global {
  interface Window {
    BrowserAIHarness: {
      seedProfile: (profile: Record<string, unknown>) => Promise<boolean>;
      preview: () => Promise<{
        ok: boolean;
        mappings: FieldMapping[];
        missingFields?: Array<{
          selector: string;
          name: string;
          type: string;
          label?: string;
        }>;
        mappingSource: 'heuristic' | 'ai';
        error?: string;
      }>;
      confirm: (mappings: FieldMapping[]) => Promise<{
        success: boolean;
        completed: number;
        total: number;
        error?: string;
      }>;
      scan: () => unknown;
    };
  }
}

export {};
