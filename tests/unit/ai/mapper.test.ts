import { describe, expect, it } from 'vitest';

import { mapProfileToFields, mapProfileToFieldsHeuristic, parseFieldMappings } from '@browser-ai/ai';
import type { UserProfile } from '@browser-ai/memory';
import { FieldType, type PageField } from '@browser-ai/shared';

const profile: UserProfile = {
  firstName: 'Abhijeeth',
  lastName: 'Rao',
  email: 'abhijeeth@example.com',
  phone: '+919876543210',
  country: 'in',
  summary: 'Building Browser AI',
  willingToRelocate: true,
};

const fields: PageField[] = [
  {
    id: 'first-name',
    name: 'firstName',
    type: FieldType.TEXT,
    label: 'First Name',
    selector: '#first-name',
    visible: true,
  },
  {
    id: 'email',
    name: 'email',
    type: FieldType.EMAIL,
    label: 'Email Address',
    selector: '#email',
    visible: true,
  },
  {
    id: 'country',
    name: 'country',
    type: FieldType.SELECT,
    label: 'Country',
    selector: '#country',
    visible: true,
    options: [
      { label: 'Select', value: '' },
      { label: 'India', value: 'in' },
      { label: 'United States', value: 'us' },
    ],
  },
  {
    id: 'relocate',
    name: 'relocate',
    type: FieldType.CHECKBOX,
    label: 'Willing to relocate',
    selector: 'input[name="relocate"]',
    visible: true,
  },
  {
    id: 'hidden',
    name: 'secret',
    type: FieldType.TEXT,
    label: 'Secret',
    selector: '#secret',
    visible: false,
  },
];

describe('heuristic field mapper', () => {
  it('maps profile values onto matching visible fields', () => {
    const mappings = mapProfileToFieldsHeuristic(profile, fields);

    expect(mappings.find((item) => item.selector === '#first-name')?.value).toBe('Abhijeeth');
    expect(mappings.find((item) => item.selector === '#email')?.value).toBe(
      'abhijeeth@example.com',
    );
    expect(mappings.find((item) => item.selector === '#country')?.value).toBe('in');
    expect(mappings.find((item) => item.selector === 'input[name="relocate"]')?.value).toBe(
      'true',
    );
    expect(mappings.some((item) => item.selector === '#secret')).toBe(false);
  });

  it('falls back to heuristics when AI is disabled', async () => {
    const result = await mapProfileToFields({
      profile,
      fields,
      useAi: false,
    });

    expect(result.source).toBe('heuristic');
    expect(result.mappings.length).toBeGreaterThanOrEqual(3);
  });

  it('parses AI JSON mappings and ignores unknown selectors', () => {
    const parsed = parseFieldMappings(
      'Here you go:\n[{"selector":"#email","value":"a@b.com"},{"selector":"#nope","value":"x"}]',
      new Set(['#email']),
    );

    expect(parsed).toEqual([
      {
        selector: '#email',
        value: 'a@b.com',
        confidence: 0.7,
        source: 'ai',
      },
    ]);
  });
});
