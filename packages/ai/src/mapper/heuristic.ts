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
    match: /full\s*name|your\s*name/i,
    read: (profile) =>
      [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.firstName,
  },
  {
    match: /first\s*name|firstname|given\s*name/i,
    read: (profile) => profile.firstName,
  },
  {
    match: /last\s*name|lastname|surname|family\s*name/i,
    read: (profile) => profile.lastName,
  },
  {
    match: /e-?mail/i,
    read: (profile) => profile.email,
  },
  {
    match: /phone|mobile|tel|cell/i,
    read: (profile) => profile.phone,
  },
  {
    match: /country/i,
    read: (profile) => profile.country ?? profile.address?.country,
  },
  {
    match: /summary|about|bio|cover|description|message/i,
    read: (profile) => profile.summary,
  },
  {
    match: /relocate|relocation/i,
    read: (profile) =>
      typeof profile.willingToRelocate === 'boolean'
        ? String(profile.willingToRelocate)
        : undefined,
  },
  {
    match: /city/i,
    read: (profile) => profile.address?.city,
  },
  {
    match: /state|province|region/i,
    read: (profile) => profile.address?.state,
  },
  {
    match: /zip|postal|post\s*code/i,
    read: (profile) => profile.address?.postalCode,
  },
  {
    match: /address|street/i,
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

  if (field.type === FieldType.EMAIL || field.type === 'email') {
    return profile.email;
  }

  if (field.type === FieldType.TEL || field.type === 'tel') {
    return profile.phone;
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
