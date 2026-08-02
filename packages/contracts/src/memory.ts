export interface MemoryRecord {
  readonly id: string;
  readonly key: string;
  readonly value: unknown;
  readonly category?: string;
  readonly updatedAt?: number;
}

export interface MemoryStore {
  readonly name: string;
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface MemoryRetrievalQuery {
  readonly query: string;
  readonly category?: string;
  readonly limit?: number;
}

export interface MemoryRetrievalResult {
  readonly records: MemoryRecord[];
}
