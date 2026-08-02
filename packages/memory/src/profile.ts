import type { MemoryStore } from '@browser-ai/contracts';

import {
  EMPTY_USER_PROFILE,
  hasProfileValues,
  isUserProfile,
  type UserProfile,
} from './schema/UserProfile';
import {
  AI_SETTINGS_KEY,
  DEFAULT_AI_SETTINGS,
  type AiSettings,
} from './schema/AiSettings';
import { ChromeMemoryStore, isChromeStorageAvailable } from './storage/chrome';
import { InMemoryStore } from './storage/memory';

export const USER_PROFILE_KEY = 'user-profile';

export function createDefaultMemoryStore(): MemoryStore {
  if (isChromeStorageAvailable()) {
    return new ChromeMemoryStore();
  }
  return new InMemoryStore();
}

export async function getUserProfile(
  store: MemoryStore = createDefaultMemoryStore(),
): Promise<UserProfile> {
  const value = await store.get(USER_PROFILE_KEY);
  if (!isUserProfile(value)) {
    return { ...EMPTY_USER_PROFILE };
  }
  return value;
}

export async function saveUserProfile(
  profile: UserProfile,
  store: MemoryStore = createDefaultMemoryStore(),
): Promise<UserProfile> {
  const next: UserProfile = {
    ...profile,
    updatedAt: Date.now(),
  };
  await store.set(USER_PROFILE_KEY, next);
  return next;
}

export async function clearUserProfile(
  store: MemoryStore = createDefaultMemoryStore(),
): Promise<void> {
  await store.delete(USER_PROFILE_KEY);
}

export async function getAiSettings(
  store: MemoryStore = createDefaultMemoryStore(),
): Promise<AiSettings> {
  const value = await store.get(AI_SETTINGS_KEY);
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_AI_SETTINGS };
  }

  const settings = value as Partial<AiSettings>;
  return {
    enabled: Boolean(settings.enabled),
    provider: settings.provider === 'ollama' ? 'ollama' : 'heuristic',
    ollamaBaseUrl: settings.ollamaBaseUrl ?? DEFAULT_AI_SETTINGS.ollamaBaseUrl,
    ollamaModel: settings.ollamaModel ?? DEFAULT_AI_SETTINGS.ollamaModel,
  };
}

export async function saveAiSettings(
  settings: AiSettings,
  store: MemoryStore = createDefaultMemoryStore(),
): Promise<AiSettings> {
  const next: AiSettings = {
    enabled: Boolean(settings.enabled),
    provider: settings.provider === 'ollama' ? 'ollama' : 'heuristic',
    ollamaBaseUrl: settings.ollamaBaseUrl ?? DEFAULT_AI_SETTINGS.ollamaBaseUrl,
    ollamaModel: settings.ollamaModel ?? DEFAULT_AI_SETTINGS.ollamaModel,
  };
  await store.set(AI_SETTINGS_KEY, next);
  return next;
}

export { hasProfileValues };
export type { AiSettings };
