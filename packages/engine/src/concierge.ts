import { ConciergeAgent, PlannerAgent, type ConciergeFieldItem, type ConciergePreview } from '@browser-ai/agents';
import {
  clickSubmitCandidate,
  findSubmitCandidate,
  scanForms,
} from '@browser-ai/browser';
import {
  createDefaultMemoryStore,
  type MemoryStore,
} from '@browser-ai/memory';
import { logEvent } from '@browser-ai/telemetry';

import { createDefaultEngine } from './createEngine';
import type { EngineRunResult } from './Engine';

export type { ConciergeFieldItem, ConciergePreview };

export interface ConciergeConfirmResult extends EngineRunResult {
  readonly learned: number;
  readonly submit?: { selector: string; label: string };
}

/**
 * Scan page + recall answer memory → reviewable concierge plan (no DOM writes).
 */
export async function previewConcierge(
  store: MemoryStore = createDefaultMemoryStore(),
): Promise<ConciergePreview> {
  const pageModel = scanForms();
  const agent = new ConciergeAgent();
  const preview = await agent.buildPreview(pageModel.fields, {
    url: pageModel.url,
    title: pageModel.title,
  }, store);

  const submit = findSubmitCandidate() ?? undefined;
  const result = {
    ...preview,
    submit: submit ? { selector: submit.selector, label: submit.label } : undefined,
  };

  logEvent('concierge.preview', {
    known: result.knownCount,
    unknown: result.unknownCount,
    skippedUploads: result.skippedUploadCount,
    hasSubmit: Boolean(result.submit),
  });

  return result;
}

/**
 * Fill approved field values, then learn them into local answer memory.
 */
export async function confirmConcierge(
  fields: ConciergeFieldItem[],
  site: string,
  store: MemoryStore = createDefaultMemoryStore(),
): Promise<ConciergeConfirmResult> {
  const agent = new ConciergeAgent();
  const mappings = agent.toMappings(fields);

  if (mappings.length === 0) {
    return {
      planId: 'concierge-fill',
      success: false,
      completed: 0,
      total: 0,
      steps: [],
      learned: 0,
      error: 'Nothing to fill — add or keep at least one answer.',
    };
  }

  const planner = new PlannerAgent();
  const plan = planner.planFromMappings(mappings, 'concierge-fill');
  const engine = createDefaultEngine('concierge');
  const result = await engine.run(plan);

  let learned = 0;
  if (result.success) {
    await agent.learnFromFields(fields, site, store);
    learned = mappings.length;
  }

  const submit = findSubmitCandidate() ?? undefined;

  logEvent('concierge.confirm', {
    success: result.success,
    completed: result.completed,
    learned,
  });

  return {
    ...result,
    learned,
    submit: submit ? { selector: submit.selector, label: submit.label } : undefined,
  };
}

/**
 * User-triggered submit only (never automatic).
 */
export async function submitConciergeForm(selector?: string): Promise<{
  readonly success: boolean;
  readonly label?: string;
  readonly error?: string;
}> {
  const result = await clickSubmitCandidate(selector);
  logEvent('concierge.submit', {
    success: result.success,
    label: 'label' in result ? result.label : undefined,
    error: result.error,
  });
  return {
    success: result.success,
    label: 'label' in result ? result.label : undefined,
    error: result.error,
  };
}
