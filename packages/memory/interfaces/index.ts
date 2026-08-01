/**
 * TODO: Define memory storage and retrieval contracts.
 */
export interface MemoryStore {
  readonly name: string;
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
}
