import { COMMAND_NAMES } from '@browser-ai/commands';
import type { ExecutionPlan, FieldMapping } from '@browser-ai/contracts';

/**
 * Planner agent: convert field mappings into an executable plan.
 */
export class PlannerAgent {
  planFromMappings(
    mappings: FieldMapping[],
    planId = 'smart-fill',
  ): ExecutionPlan {
    return {
      id: planId,
      steps: mappings.map((mapping, index) => ({
        id: `fill-${index}-${sanitizeId(mapping.selector)}`,
        action: COMMAND_NAMES.FILL_FIELD,
        params: {
          target: mapping.selector,
          value: mapping.value,
        },
      })),
    };
  }
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 40);
}
