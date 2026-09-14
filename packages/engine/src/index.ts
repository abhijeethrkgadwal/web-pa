import {
  createDefaultMemoryStore,
  type MemoryStore,
  type UserProfile,
} from '@browser-ai/memory';

import { createDefaultEngine } from './createEngine';
import type { EngineRunResult } from './Engine';
import { buildJobApplicationPlanFromProfile } from './plans/jobApplicationFromProfile';
import { runSmartFill } from './smartFill';

/** Default Phase 5 path: scan page → map profile → execute commands. */
export async function runJobApplicationDemoPlan(
  store: MemoryStore = createDefaultMemoryStore(),
): Promise<EngineRunResult> {
  return runSmartFill(store);
}

export async function runPlanFromProfile(
  profile: UserProfile,
  source = 'engine',
): Promise<EngineRunResult> {
  const plan = buildJobApplicationPlanFromProfile(profile);
  if (plan.steps.length === 0) {
    return {
      planId: plan.id,
      success: false,
      completed: 0,
      total: 0,
      steps: [],
      error: 'Profile has no fillable values.',
    };
  }

  const engine = createDefaultEngine(source);
  return engine.run(plan);
}

export { createDefaultEngine } from './createEngine';
export * from './Context';
export * from './Engine';
export * from './ExecutionPlan';
export * from './plans/jobApplicationFromProfile';
export * from './plans/jobApplicationDemo';
export * from './smartFill';
export * from './concierge';
