import type { ExecutionPlan, ExecutionPlanStep } from '@browser-ai/contracts';

export type { ExecutionPlan, ExecutionPlanStep };

export function createExecutionPlan(
  id: string,
  steps: ExecutionPlanStep[],
): ExecutionPlan {
  return { id, steps };
}

export function step(
  id: string,
  action: string,
  params?: Record<string, unknown>,
): ExecutionPlanStep {
  return { id, action, params };
}
