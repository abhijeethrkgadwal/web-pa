import type { MemoryStore } from '@browser-ai/contracts';

import { createDefaultMemoryStore } from '../profile';
import {
  ANSWER_MEMORY_KEY,
  EMPTY_ANSWER_MEMORY,
  type AnswerMemorySnapshot,
  type AnswerRecord,
  type AnswerScope,
} from '../schema/AnswerMemory';
import type { UserProfile } from '../schema/UserProfile';
import { getUserProfile } from '../profile';
import { inferIntent, labelSimilarity, normalizeLabel } from './intent';

export async function getAnswerMemory(
  store: MemoryStore = createDefaultMemoryStore(),
): Promise<AnswerMemorySnapshot> {
  const value = await store.get(ANSWER_MEMORY_KEY);
  if (!isAnswerMemory(value)) {
    const seeded = await seedFromProfile(store);
    return seeded;
  }
  if (value.answers.length === 0) {
    return seedFromProfile(store);
  }
  return value;
}

export async function saveAnswerMemory(
  memory: AnswerMemorySnapshot,
  store: MemoryStore = createDefaultMemoryStore(),
): Promise<AnswerMemorySnapshot> {
  const next: AnswerMemorySnapshot = {
    version: 1,
    answers: memory.answers,
    updatedAt: Date.now(),
  };
  await store.set(ANSWER_MEMORY_KEY, next);
  return next;
}

export async function upsertAnswers(
  updates: Array<{
    readonly intent: string;
    readonly value: string;
    readonly label?: string;
    readonly site?: string;
    readonly scope?: AnswerScope;
  }>,
  store: MemoryStore = createDefaultMemoryStore(),
): Promise<AnswerMemorySnapshot> {
  const memory = await getAnswerMemory(store);
  const byIntent = new Map(memory.answers.map((answer) => [answerKey(answer), answer]));

  for (const update of updates) {
    if (!update.value.trim()) {
      continue;
    }
    const scope = update.scope ?? (update.intent.startsWith('custom:') ? 'site' : 'global');
    const key =
      scope === 'site' && update.site
        ? `${update.intent}@@${update.site}`
        : update.intent;
    const existing = byIntent.get(key);
    const labels = mergeUnique(existing?.labels ?? [], update.label ? [update.label] : []);
    const sites = mergeUnique(existing?.sites ?? [], update.site ? [update.site] : []);

    byIntent.set(key, {
      id: existing?.id ?? createId(update.intent),
      intent: update.intent,
      value: update.value.trim(),
      labels,
      sites,
      scope,
      updatedAt: Date.now(),
    });
  }

  return saveAnswerMemory(
    {
      version: 1,
      answers: [...byIntent.values()],
      updatedAt: Date.now(),
    },
    store,
  );
}

export function findBestAnswer(input: {
  readonly answers: readonly AnswerRecord[];
  readonly name?: string;
  readonly label?: string;
  readonly type?: string;
  readonly placeholder?: string;
  readonly site?: string;
}): { answer: AnswerRecord; confidence: number; intent: string } | undefined {
  const inferred = inferIntent(input);
  const haystack = `${input.label ?? ''} ${input.name ?? ''}`;
  let best:
    | {
        answer: AnswerRecord;
        confidence: number;
        intent: string;
      }
    | undefined;

  for (const answer of input.answers) {
    if (answer.scope === 'site' && input.site && !answer.sites.includes(input.site)) {
      // Allow unused site answers only if no site filter — still skip mismatch.
      continue;
    }

    let confidence = 0;
    if (answer.intent === inferred.intent) {
      confidence = Math.max(confidence, 0.92);
    }

    for (const label of answer.labels) {
      confidence = Math.max(confidence, labelSimilarity(label, haystack) * 0.95);
    }

    // Soft match intent token to label for global intents.
    if (!answer.intent.startsWith('custom:')) {
      const intentAsLabel = answer.intent.replace(/_/g, ' ');
      confidence = Math.max(confidence, labelSimilarity(intentAsLabel, haystack) * 0.8);
    }

    if (confidence < 0.72) {
      continue;
    }

    if (!best || confidence > best.confidence) {
      best = { answer, confidence, intent: answer.intent };
    }
  }

  return best;
}

async function seedFromProfile(
  store: MemoryStore,
): Promise<AnswerMemorySnapshot> {
  const profile = await getUserProfile(store);
  const seeded = profileToAnswers(profile);
  if (seeded.length === 0) {
    return saveAnswerMemory(
      {
        version: 1,
        answers: [],
        updatedAt: Date.now(),
      },
      store,
    );
  }
  return saveAnswerMemory(
    {
      version: 1,
      answers: seeded,
      updatedAt: Date.now(),
    },
    store,
  );
}

export function profileToAnswers(profile: UserProfile): AnswerRecord[] {
  const now = Date.now();
  const entries: Array<{ intent: string; value?: string }> = [
    { intent: 'first_name', value: profile.firstName },
    { intent: 'last_name', value: profile.lastName },
    {
      intent: 'full_name',
      value: [profile.firstName, profile.lastName].filter(Boolean).join(' ') || undefined,
    },
    { intent: 'email', value: profile.email },
    { intent: 'phone', value: profile.phone },
    { intent: 'country', value: profile.country ?? profile.address?.country },
    { intent: 'summary', value: profile.summary },
    {
      intent: 'relocate',
      value:
        typeof profile.willingToRelocate === 'boolean'
          ? String(profile.willingToRelocate)
          : undefined,
    },
    { intent: 'city', value: profile.address?.city },
    { intent: 'state', value: profile.address?.state },
    { intent: 'postal_code', value: profile.address?.postalCode },
    { intent: 'address', value: profile.address?.line1 },
  ];

  return entries
    .filter((entry) => entry.value && entry.value.trim())
    .map((entry) => ({
      id: createId(entry.intent),
      intent: entry.intent,
      value: entry.value!.trim(),
      labels: [entry.intent.replace(/_/g, ' ')],
      sites: [],
      scope: 'global' as const,
      updatedAt: now,
    }));
}

function isAnswerMemory(value: unknown): value is AnswerMemorySnapshot {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const snapshot = value as AnswerMemorySnapshot;
  return snapshot.version === 1 && Array.isArray(snapshot.answers);
}

function answerKey(answer: AnswerRecord): string {
  if (answer.scope === 'site' && answer.sites[0]) {
    return `${answer.intent}@@${answer.sites[0]}`;
  }
  return answer.intent;
}

function mergeUnique(existing: readonly string[], incoming: readonly string[]): string[] {
  const set = new Set(
    [...existing, ...incoming].map((item) => item.trim()).filter(Boolean),
  );
  return [...set].slice(0, 20);
}

function createId(intent: string): string {
  return `ans_${normalizeLabel(intent).replace(/\s+/g, '_')}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
