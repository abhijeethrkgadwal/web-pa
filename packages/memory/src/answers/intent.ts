const GLOBAL_INTENT_RULES: Array<{ intent: string; match: RegExp }> = [
  { intent: 'full_name', match: /\b(full\s*name|your\s*name)\b/i },
  { intent: 'first_name', match: /\b(first\s*name|firstname|given\s*name)\b/i },
  { intent: 'last_name', match: /\b(last\s*name|lastname|surname|family\s*name)\b/i },
  { intent: 'email', match: /\be-?mail\b/i },
  { intent: 'phone', match: /\b(phone|mobile|tel|cell)\b/i },
  { intent: 'country', match: /\bcountry\b/i },
  {
    intent: 'summary',
    match: /\b(summary|bio|cover\s*letter|about\s*me|message|notes?)\b/i,
  },
  { intent: 'relocate', match: /\b(relocate|relocation)\b/i },
  { intent: 'city', match: /\bcity\b/i },
  { intent: 'state', match: /\b(state|province|region)\b/i },
  { intent: 'postal_code', match: /\b(zip|postal|post\s*code)\b/i },
  { intent: 'address', match: /\b(street\s*address|address\s*line|home\s*address)\b/i },
];

const OPINION_OR_CONSENT =
  /\b(feel about|contact me|opportunit|commuting|agree to|i agree|consent|privacy policy|terms of|marketing|newsletter)\b/i;

export function normalizeLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/[*：:]/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeLabel(value: string): string[] {
  return normalizeLabel(value)
    .split(' ')
    .filter((token) => token.length > 1);
}

/**
 * Infer a reusable intent key from a field's label/name/type.
 */
export function inferIntent(input: {
  readonly name?: string;
  readonly label?: string;
  readonly type?: string;
  readonly placeholder?: string;
}): { intent: string; scope: 'global' | 'site' } {
  const haystack = `${input.name ?? ''} ${input.label ?? ''} ${input.placeholder ?? ''}`;

  if (input.type === 'email') {
    return { intent: 'email', scope: 'global' };
  }
  if (input.type === 'tel') {
    return { intent: 'phone', scope: 'global' };
  }

  if (OPINION_OR_CONSENT.test(haystack)) {
    const custom = normalizeLabel(input.label || input.name || 'question').slice(0, 80);
    return { intent: `custom:${custom || 'question'}`, scope: 'site' };
  }

  for (const rule of GLOBAL_INTENT_RULES) {
    if (rule.match.test(haystack)) {
      return { intent: rule.intent, scope: 'global' };
    }
  }

  const custom = normalizeLabel(input.label || input.name || 'field').slice(0, 80);
  return { intent: `custom:${custom || 'field'}`, scope: 'site' };
}

export function labelSimilarity(a: string, b: string): number {
  const na = normalizeLabel(a);
  const nb = normalizeLabel(b);
  if (!na || !nb) {
    return 0;
  }
  if (na === nb) {
    return 1;
  }
  if (na.includes(nb) || nb.includes(na)) {
    return 0.85;
  }

  const ta = new Set(tokenizeLabel(a));
  const tb = new Set(tokenizeLabel(b));
  if (ta.size === 0 || tb.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const token of ta) {
    if (tb.has(token)) {
      overlap += 1;
    }
  }
  return overlap / Math.max(ta.size, tb.size);
}
