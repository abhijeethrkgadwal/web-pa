import type { AIMessage, AIProvider, FieldMapping } from '@browser-ai/contracts';
import type { UserProfile } from '@browser-ai/memory';
import type { PageField } from '@browser-ai/shared';

export function buildFieldMappingPrompt(
  profile: UserProfile,
  fields: PageField[],
): AIMessage[] {
  const compactFields = fields
    .filter((field) => field.visible)
    .filter((field) => field.type !== 'button' && field.type !== 'submit')
    .map((field) => ({
      name: field.name,
      type: field.type,
      label: field.label,
      selector: field.selector,
      options: field.options?.map((option) => option.value),
    }));

  return [
    {
      role: 'system',
      content:
        'You map a user profile to web form fields. Reply with ONLY valid JSON: ' +
        '[{"selector":"...","value":"..."}]. Use selectors exactly as provided. ' +
        'Skip fields you cannot fill confidently.',
    },
    {
      role: 'user',
      content: JSON.stringify({ profile, fields: compactFields }),
    },
  ];
}

export function parseFieldMappings(
  content: string,
  allowedSelectors: Set<string>,
): FieldMapping[] {
  const jsonText = extractJson(content);
  const parsed = JSON.parse(jsonText) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error('AI mapping response is not an array');
  }

  const mappings: FieldMapping[] = [];

  for (const item of parsed) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const selector = (item as { selector?: unknown }).selector;
    const value = (item as { value?: unknown }).value;

    if (typeof selector !== 'string' || typeof value !== 'string') {
      continue;
    }

    if (!allowedSelectors.has(selector)) {
      continue;
    }

    if (!value.trim()) {
      continue;
    }

    mappings.push({
      selector,
      value,
      confidence: 0.7,
      source: 'ai',
    });
  }

  return mappings;
}

export async function mapProfileToFieldsWithAI(
  provider: AIProvider,
  profile: UserProfile,
  fields: PageField[],
): Promise<FieldMapping[]> {
  const messages = buildFieldMappingPrompt(profile, fields);
  const content = await provider.generate(messages);
  const allowed = new Set(fields.map((field) => field.selector));
  return parseFieldMappings(content, allowed);
}

function extractJson(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith('[')) {
    return trimmed;
  }

  const start = trimmed.indexOf('[');
  const end = trimmed.lastIndexOf(']');
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  throw new Error('No JSON array found in AI response');
}
