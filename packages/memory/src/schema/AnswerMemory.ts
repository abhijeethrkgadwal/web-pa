export type AnswerScope = 'global' | 'site';

/**
 * One remembered answer the concierge can reuse across similar questions.
 */
export interface AnswerRecord {
  readonly id: string;
  /** Stable intent key, e.g. email, first_name, or custom:commute-preference */
  readonly intent: string;
  readonly value: string;
  /** Labels/questions previously associated with this answer */
  readonly labels: readonly string[];
  /** Hostnames where this answer was used (for site-scoped customs) */
  readonly sites: readonly string[];
  readonly scope: AnswerScope;
  readonly updatedAt: number;
}

export interface AnswerMemorySnapshot {
  readonly version: 1;
  readonly answers: readonly AnswerRecord[];
  readonly updatedAt: number;
}

export const ANSWER_MEMORY_KEY = 'answer-memory';

export const EMPTY_ANSWER_MEMORY: AnswerMemorySnapshot = {
  version: 1,
  answers: [],
  updatedAt: 0,
};
