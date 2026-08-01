/**
 * TODO: Aggregate storage, retrieval, ranking, embeddings, and model abstractions.
 */
export interface MemoryRecord {
  readonly id: string;
  readonly content: string;
}

export class MemorySkeleton implements MemoryRecord {
  readonly id = 'memory-placeholder';
  readonly content = 'placeholder';
}

export * from './embeddings';
export * from './models';
export * from './ranking';
export * from './retrieval';
export * from './storage';
export * from './interfaces';
