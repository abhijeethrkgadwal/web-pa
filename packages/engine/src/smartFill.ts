import { FormAgent, PlannerAgent } from '@browser-ai/agents';
import { scanForms } from '@browser-ai/browser';
import type { FieldMapping } from '@browser-ai/contracts';
import {
  createDefaultMemoryStore,
  getAiSettings,
  getUserProfile,
  hasProfileValues,
  type MemoryStore,
} from '@browser-ai/memory';
import type { PageField } from '@browser-ai/shared';
import { logEvent } from '@browser-ai/telemetry';

import { createDefaultEngine } from './createEngine';
import type { EngineRunResult } from './Engine';

export interface SmartFillResult extends EngineRunResult {
  readonly mappingSource: 'heuristic' | 'ai';
  readonly mappingCount: number;
  readonly mappingError?: string;
}

export interface MissingField {
  readonly selector: string;
  readonly name: string;
  readonly type: string;
  readonly label?: string;
}

export interface SmartFillPreview {
  readonly ok: boolean;
  readonly mappings: FieldMapping[];
  readonly mappingSource: 'heuristic' | 'ai';
  readonly missingFields: MissingField[];
  readonly mappingError?: string;
  readonly error?: string;
}

function isFillableField(field: PageField): boolean {
  return (
    field.visible &&
    field.type !== 'button' &&
    field.type !== 'submit' &&
    field.type !== 'file'
  );
}

export function findMissingRequiredFields(
  fields: PageField[],
  mappings: FieldMapping[],
): MissingField[] {
  const mapped = new Set(mappings.map((mapping) => mapping.selector));

  return fields
    .filter(isFillableField)
    .filter((field) => field.constraints?.required)
    .filter((field) => !mapped.has(field.selector))
    .map((field) => ({
      selector: field.selector,
      name: field.name,
      type: String(field.type),
      label: field.label,
    }));
}

async function buildMappings(store: MemoryStore): Promise<SmartFillPreview> {
  const profile = await getUserProfile(store);
  if (!hasProfileValues(profile)) {
    return {
      ok: false,
      mappings: [],
      missingFields: [],
      mappingSource: 'heuristic',
      error: 'No profile saved. Open Options and save your details first.',
    };
  }

  const pageModel = scanForms();
  const aiSettings = await getAiSettings(store);
  const formAgent = new FormAgent();

  const mappingResult = await formAgent.suggestMappings({
    profile,
    fields: pageModel.fields,
    aiSettings,
  });

  const missingFields = findMissingRequiredFields(
    pageModel.fields,
    mappingResult.mappings,
  );

  logEvent('smartfill.preview', {
    mappingCount: mappingResult.mappings.length,
    missingCount: missingFields.length,
    source: mappingResult.source,
  });

  if (mappingResult.mappings.length === 0 && missingFields.length === 0) {
    return {
      ok: false,
      mappings: [],
      missingFields: [],
      mappingSource: mappingResult.source,
      mappingError: mappingResult.error,
      error: 'No field mappings found for this page and profile.',
    };
  }

  return {
    ok: true,
    mappings: mappingResult.mappings,
    missingFields,
    mappingSource: mappingResult.source,
    mappingError: mappingResult.error,
  };
}

/**
 * Preview mappings without mutating the page.
 */
export async function previewSmartFill(
  store: MemoryStore = createDefaultMemoryStore(),
): Promise<SmartFillPreview> {
  return buildMappings(store);
}

/**
 * Execute a previously previewed set of mappings.
 */
export async function confirmSmartFill(
  mappings: FieldMapping[],
): Promise<SmartFillResult> {
  if (mappings.length === 0) {
    return {
      planId: 'smart-fill',
      success: false,
      completed: 0,
      total: 0,
      steps: [],
      mappingSource: 'heuristic',
      mappingCount: 0,
      error: 'Nothing to confirm.',
    };
  }

  const planner = new PlannerAgent();
  const plan = planner.planFromMappings(mappings, 'smart-fill');
  const engine = createDefaultEngine('smart-fill');
  const result = await engine.run(plan);

  logEvent('smartfill.confirm', {
    success: result.success,
    completed: result.completed,
    total: result.total,
  });

  return {
    ...result,
    mappingSource: mappings[0]?.source ?? 'heuristic',
    mappingCount: mappings.length,
  };
}

/**
 * Scan page → map profile to fields (AI optional) → execute plan.
 */
export async function runSmartFill(
  store: MemoryStore = createDefaultMemoryStore(),
): Promise<SmartFillResult> {
  const preview = await buildMappings(store);
  if (!preview.ok || preview.mappings.length === 0) {
    return {
      planId: 'smart-fill',
      success: false,
      completed: 0,
      total: 0,
      steps: [],
      mappingSource: preview.mappingSource,
      mappingCount: 0,
      mappingError: preview.mappingError,
      error: preview.error ?? 'No mappings available.',
    };
  }

  return confirmSmartFill(preview.mappings);
}
