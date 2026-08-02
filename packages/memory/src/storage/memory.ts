import type { MemoryStore } from '@browser-ai/contracts';

/**
 * In-memory store for unit tests and non-extension environments.
 */
export class InMemoryStore implements MemoryStore {
  readonly name = 'in-memory';
  private readonly data = new Map<string, unknown>();

  async get(key: string): Promise<unknown> {
    return this.data.has(key) ? this.data.get(key) : undefined;
  }

  async set(key: string, value: unknown): Promise<void> {
    this.data.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }
}
