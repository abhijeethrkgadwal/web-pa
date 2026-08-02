import type { MemoryStore } from '@browser-ai/contracts';

/**
 * Chrome extension local storage adapter.
 */
export class ChromeMemoryStore implements MemoryStore {
  readonly name = 'chrome-storage';

  async get(key: string): Promise<unknown> {
    const result = await chrome.storage.local.get(key);
    return result[key];
  }

  async set(key: string, value: unknown): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  }

  async delete(key: string): Promise<void> {
    await chrome.storage.local.remove(key);
  }
}

export function isChromeStorageAvailable(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
}
