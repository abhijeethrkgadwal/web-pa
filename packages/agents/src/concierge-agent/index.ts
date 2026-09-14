import type { FieldMapping } from '@browser-ai/contracts';
import {
  findBestAnswer,
  getAnswerMemory,
  inferIntent,
  upsertAnswers,
  type MemoryStore,
  createDefaultMemoryStore,
} from '@browser-ai/memory';
import type { PageField } from '@browser-ai/shared';
import { FieldType } from '@browser-ai/shared';

export type ConciergeFieldStatus = 'known' | 'unknown' | 'skipped_upload';

export interface ConciergeFieldItem {
  readonly selector: string;
  readonly name: string;
  readonly type: string;
  readonly label?: string;
  readonly required?: boolean;
  readonly options?: Array<{ label: string; value: string }>;
  readonly status: ConciergeFieldStatus;
  readonly value?: string;
  readonly intent?: string;
  readonly confidence?: number;
  readonly source?: 'memory' | 'user';
}

export interface ConciergePreview {
  readonly ok: boolean;
  readonly site: string;
  readonly title: string;
  readonly url: string;
  readonly fields: ConciergeFieldItem[];
  readonly knownCount: number;
  readonly unknownCount: number;
  readonly skippedUploadCount: number;
  readonly submit?: { selector: string; label: string };
  readonly error?: string;
}

/**
 * Concierge agent: scan form → recall answers → produce a review plan.
 * Never fills or submits by itself.
 */
export class ConciergeAgent {
  async buildPreview(
    fields: PageField[],
    meta: { url: string; title: string },
    store: MemoryStore = createDefaultMemoryStore(),
  ): Promise<ConciergePreview> {
    const site = safeHost(meta.url);
    const memory = await getAnswerMemory(store);
    const items: ConciergeFieldItem[] = [];

    for (const field of fields) {
      if (!field.visible) {
        continue;
      }

      if (isUploadField(field)) {
        items.push({
          selector: field.selector,
          name: field.name,
          type: String(field.type),
          label: field.label,
          required: field.constraints?.required,
          status: 'skipped_upload',
          intent: 'upload',
        });
        continue;
      }

      if (isNonFillable(field)) {
        continue;
      }

      const inferred = inferIntent({
        name: field.name,
        label: field.label,
        type: String(field.type),
        placeholder: field.placeholder,
      });

      const match = findBestAnswer({
        answers: memory.answers,
        name: field.name,
        label: field.label,
        type: String(field.type),
        placeholder: field.placeholder,
        site,
      });

      if (match) {
        items.push({
          selector: field.selector,
          name: field.name,
          type: String(field.type),
          label: field.label,
          required: field.constraints?.required,
          options: field.options?.map((option) => ({
            label: option.label,
            value: option.value,
          })),
          status: 'known',
          value: adaptForField(field, match.answer.value),
          intent: match.intent,
          confidence: match.confidence,
          source: 'memory',
        });
        continue;
      }

      items.push({
        selector: field.selector,
        name: field.name,
        type: String(field.type),
        label: field.label,
        required: field.constraints?.required,
        options: field.options?.map((option) => ({
          label: option.label,
          value: option.value,
        })),
        status: 'unknown',
        intent: inferred.intent,
        source: undefined,
      });
    }

    const knownCount = items.filter((item) => item.status === 'known').length;
    const unknownCount = items.filter((item) => item.status === 'unknown').length;
    const skippedUploadCount = items.filter(
      (item) => item.status === 'skipped_upload',
    ).length;

    return {
      ok: items.length > 0,
      site,
      title: meta.title,
      url: meta.url,
      fields: items,
      knownCount,
      unknownCount,
      skippedUploadCount,
      error:
        items.length === 0
          ? 'No fillable form fields found on this page.'
          : undefined,
    };
  }

  toMappings(fields: ConciergeFieldItem[]): FieldMapping[] {
    return fields
      .filter(
        (field) =>
          field.status !== 'skipped_upload' &&
          typeof field.value === 'string' &&
          field.value.trim() !== '',
      )
      .map((field) => ({
        selector: field.selector,
        value: field.value!.trim(),
        confidence: field.confidence ?? 1,
        source: 'heuristic' as const,
        fieldName: field.name,
        fieldLabel: field.label,
      }));
  }

  async learnFromFields(
    fields: ConciergeFieldItem[],
    site: string,
    store: MemoryStore = createDefaultMemoryStore(),
  ): Promise<void> {
    const updates = fields
      .filter(
        (field) =>
          field.status !== 'skipped_upload' &&
          typeof field.value === 'string' &&
          field.value.trim() !== '',
      )
      .map((field) => {
        const inferred = inferIntent({
          name: field.name,
          label: field.label,
          type: field.type,
        });
        return {
          intent: field.intent ?? inferred.intent,
          value: field.value!.trim(),
          label: field.label || field.name,
          site,
          scope: inferred.scope,
        };
      });

    if (updates.length > 0) {
      await upsertAnswers(updates, store);
    }
  }
}

function isUploadField(field: PageField): boolean {
  return field.type === FieldType.FILE || field.type === 'file';
}

function isNonFillable(field: PageField): boolean {
  return (
    field.type === FieldType.BUTTON ||
    field.type === FieldType.SUBMIT ||
    field.type === FieldType.PASSWORD ||
    field.type === 'button' ||
    field.type === 'submit' ||
    field.type === 'password'
  );
}

function adaptForField(field: PageField, value: string): string {
  if (
    (field.type === FieldType.SELECT ||
      field.type === FieldType.MULTI_SELECT ||
      field.type === 'select' ||
      field.type === 'multi-select') &&
    field.options?.length
  ) {
    const byValue = field.options.find((option) => option.value === value);
    if (byValue) {
      return byValue.value;
    }
    const byLabel = field.options.find(
      (option) =>
        option.label.toLowerCase() === value.toLowerCase() ||
        option.label.toLowerCase().includes(value.toLowerCase()),
    );
    if (byLabel) {
      return byLabel.value;
    }
  }
  return value;
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname || 'local';
  } catch {
    return 'local';
  }
}
