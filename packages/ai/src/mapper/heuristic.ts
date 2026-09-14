import type { FieldMapping } from '@browser-ai/contracts';
import type { UserProfile } from '@browser-ai/memory';
import type { PageField } from '@browser-ai/shared';
import { FieldType } from '@browser-ai/shared';

type ProfileRule = {
  readonly match: RegExp;
  readonly read: (profile: UserProfile) => string | undefined;
};

const PROFILE_RULES: ProfileRule[] = [
  {
    match: /\b(full\s*name|your\s*name)\b/i,
    read: (profile) =>
      [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.firstName,
  },
  {
    match: /\b(first\s*name|firstname|given\s*name)\b/i,
    read: (profile) => profile.firstName,
  },
  {
    match: /\b(last\s*name|lastname|surname|family\s*name)\b/i,
    read: (profile) => profile.lastName,
  },
  {
    match: /\be-?mail\b/i,
    read: (profile) => profile.email,
  },
  {
    match: /\b(phone|mobile|tel|cell)\b/i,
    read: (profile) => profile.phone,
  },
  {
    match: /\bcountry\b/i,
    read: (profile) => profile.country ?? profile.address?.country,
  },
  {
    // Intentionally avoid bare "about" / "cover" / "description" — those match
    // consent and opinion questions ("feel about commuting", "contact me about…").
    match: /\b(summary|bio|cover\s*letter|about\s*me|message|notes?)\b/i,
    read: (profile) => profile.summary,
  },
  {
    match: /\b(relocate|relocation)\b/i,
    read: (profile) =>
      typeof profile.willingToRelocate === 'boolean'
        ? String(profile.willingToRelocate)
        : undefined,
  },
  {
    match: /\bcity\b/i,
    read: (profile) => profile.address?.city,
  },
  {
    match: /\b(state|province|region)\b/i,
    read: (profile) => profile.address?.state,
  },
  {
    match: /\b(zip|postal|post\s*code)\b/i,
    read: (profile) => profile.address?.postalCode,
  },
  {
    match: /\b(street\s*address|address\s*line|home\s*address)\b/i,
    read: (profile) => profile.address?.line1,
  },
];

/**
 * Offline mapper: match page fields to profile values by label/name/type.
 */
export function mapProfileToFieldsHeuristic(
  profile: UserProfile,
  fields: PageField[],
): FieldMapping[] {
  const mappings: FieldMapping[] = [];
  const usedSelectors = new Set<string>();

  for (const field of fields) {
    if (!field.visible) {
      continue;
    }

    if (
      field.type === FieldType.BUTTON ||
      field.type === FieldType.SUBMIT ||
      field.type === 'button' ||
      field.type === 'submit'
    ) {
      continue;
    }

    const value = resolveValue(profile, field);
    if (value === undefined || value === '') {
      continue;
    }

    if (usedSelectors.has(field.selector)) {
      continue;
    }

    usedSelectors.add(field.selector);
    mappings.push({
      selector: field.selector,
      value,
      confidence: 0.8,
      source: 'heuristic',
      fieldName: field.name,
      fieldLabel: field.label,
    });
  }

  return mappings;
}

function resolveValue(profile: UserProfile, field: PageField): string | undefined {
  const haystack = `${field.name} ${field.label ?? ''} ${field.placeholder ?? ''}`;

  if (isBooleanField(field)) {
    if (/\b(relocate|relocation)\b/i.test(haystack)) {
      return typeof profile.willingToRelocate === 'boolean'
        ? String(profile.willingToRelocate)
        : undefined;
    }
    // Never dump text profile values into consent / marketing checkboxes.
    return undefined;
  }

  if (field.type === FieldType.EMAIL || field.type === 'email') {
    return profile.email;
  }

  if (field.type === FieldType.TEL || field.type === 'tel') {
    return profile.phone;
  }

  if (looksLikeOpinionOrConsentQuestion(haystack)) {
    return undefined;
  }

  for (const rule of PROFILE_RULES) {
    if (rule.match.test(haystack)) {
      const value = rule.read(profile);
      if (value !== undefined && value !== '') {
        return adaptValueForField(field, value);
      }
    }
  }

  return undefined;
}

function isBooleanField(field: PageField): boolean {
  return (
    field.type === FieldType.CHECKBOX ||
    field.type === FieldType.RADIO ||
    field.type === 'checkbox' ||
    field.type === 'radio'
  );
}

function looksLikeOpinionOrConsentQuestion(haystack: string): boolean {
  return /\b(feel about|contact me|opportunit|commuting|agree to|i agree|consent|privacy policy|terms of|marketing|newsletter)\b/i.test(
    haystack,
  );
}

function adaptValueForField(field: PageField, value: string): string {
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
