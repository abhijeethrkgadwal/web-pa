import type { PageField } from '@browser-ai/shared';

import { browserController } from '../controller/BrowserController';
import { scanForms } from '../scanner/forms';

const DEMO_PROFILE: Array<{ match: RegExp; value: string }> = [
  { match: /first\s*name|firstname/i, value: 'Abhijeeth' },
  { match: /last\s*name|lastname|surname/i, value: 'Rao' },
  { match: /e-?mail/i, value: 'abhijeeth@example.com' },
  { match: /phone|mobile|tel/i, value: '+919876543210' },
  { match: /country/i, value: 'in' },
  { match: /summary|about|bio|cover/i, value: 'Product manager building Browser AI.' },
  { match: /relocate/i, value: 'true' },
];

export interface DemoFillResult {
  readonly attempted: number;
  readonly filled: number;
  readonly failed: Array<{ selector: string; error: string }>;
}

/**
 * Scan the page and fill fields using a hardcoded demo profile.
 * Useful for Phase 2 manual verification before Memory/AI exist.
 */
export async function fillDemoValues(): Promise<DemoFillResult> {
  const model = scanForms();
  const failed: Array<{ selector: string; error: string }> = [];
  let filled = 0;
  let attempted = 0;

  for (const field of model.fields) {
    if (!field.visible) {
      continue;
    }

    if (field.type === 'button' || field.type === 'submit') {
      continue;
    }

    const value = matchDemoValue(field);
    if (!value) {
      continue;
    }

    attempted += 1;
    const result = await browserController.fill(field.selector, value);
    if (result.success) {
      filled += 1;
    } else {
      failed.push({
        selector: field.selector,
        error: result.error ?? 'Unknown fill error',
      });
    }
  }

  return { attempted, filled, failed };
}

function matchDemoValue(field: PageField): string | undefined {
  const haystack = `${field.name} ${field.label ?? ''} ${field.placeholder ?? ''}`;

  if (field.type === 'email') {
    return 'abhijeeth@example.com';
  }

  for (const entry of DEMO_PROFILE) {
    if (entry.match.test(haystack)) {
      return entry.value;
    }
  }

  return undefined;
}
