import type { AIProvider, FieldMapping, FieldMappingResult } from '@browser-ai/contracts';
import type { UserProfile } from '@browser-ai/memory';
import type { PageField } from '@browser-ai/shared';

import { mapProfileToFieldsWithAI, parseFieldMappings } from './aiMapper';
import { mapProfileToFieldsHeuristic } from './heuristic';

export interface MapFieldsOptions {
  readonly profile: UserProfile;
  readonly fields: PageField[];
  readonly useAi?: boolean;
  readonly provider?: AIProvider;
}

/**
 * Map profile → fields. Prefer AI when enabled; always fall back to heuristics.
 */
export async function mapProfileToFields(
  options: MapFieldsOptions,
): Promise<FieldMappingResult> {
  const { profile, fields, useAi = false, provider } = options;

  if (useAi && provider) {
    try {
      const mappings = await mapProfileToFieldsWithAI(provider, profile, fields);
      if (mappings.length > 0) {
        return { mappings, source: 'ai' };
      }
    } catch (error) {
      const heuristic = mapProfileToFieldsHeuristic(profile, fields);
      return {
        mappings: heuristic,
        source: 'heuristic',
        error: error instanceof Error ? error.message : 'AI mapping failed',
      };
    }
  }

  return {
    mappings: mapProfileToFieldsHeuristic(profile, fields),
    source: 'heuristic',
  };
}

export type { FieldMapping };
export { mapProfileToFieldsHeuristic, mapProfileToFieldsWithAI, parseFieldMappings };
