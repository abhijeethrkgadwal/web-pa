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
  return normalizeAiSettings(settings);
}

export async function saveAiSettings(
  settings: AiSettings,
  store: MemoryStore = createDefaultMemoryStore(),
): Promise<AiSettings> {
  const next = normalizeAiSettings(settings);
  await store.set(AI_SETTINGS_KEY, next);
  return next;
}

const AI_PROVIDERS = new Set(['heuristic', 'ollama', 'openai', 'anthropic']);
const TTS_PROVIDERS = new Set(['none', 'browser', 'openai']);

function normalizeAiSettings(settings: Partial<AiSettings>): AiSettings {
  const provider = AI_PROVIDERS.has(settings.provider as string)
    ? (settings.provider as AiSettings['provider'])
    : 'heuristic';

  const ttsProvider = TTS_PROVIDERS.has(settings.ttsProvider as string)
    ? (settings.ttsProvider as AiSettings['ttsProvider'])
    : DEFAULT_AI_SETTINGS.ttsProvider;

  return {
    enabled: Boolean(settings.enabled),
    provider: settings.enabled ? provider : 'heuristic',
    ollamaBaseUrl: settings.ollamaBaseUrl ?? DEFAULT_AI_SETTINGS.ollamaBaseUrl,
    ollamaModel: settings.ollamaModel ?? DEFAULT_AI_SETTINGS.ollamaModel,
    openaiBaseUrl: settings.openaiBaseUrl ?? DEFAULT_AI_SETTINGS.openaiBaseUrl,
    openaiModel: settings.openaiModel ?? DEFAULT_AI_SETTINGS.openaiModel,
    openaiApiKey: settings.openaiApiKey ?? DEFAULT_AI_SETTINGS.openaiApiKey,
    anthropicBaseUrl:
      settings.anthropicBaseUrl ?? DEFAULT_AI_SETTINGS.anthropicBaseUrl,
    anthropicModel: settings.anthropicModel ?? DEFAULT_AI_SETTINGS.anthropicModel,
    anthropicApiKey:
      settings.anthropicApiKey ?? DEFAULT_AI_SETTINGS.anthropicApiKey,
    sttBaseUrl: settings.sttBaseUrl ?? DEFAULT_AI_SETTINGS.sttBaseUrl,
    sttModel: settings.sttModel ?? DEFAULT_AI_SETTINGS.sttModel,
    sttApiKey: settings.sttApiKey ?? DEFAULT_AI_SETTINGS.sttApiKey,
    ttsProvider,
    ttsBaseUrl: settings.ttsBaseUrl ?? DEFAULT_AI_SETTINGS.ttsBaseUrl,
    ttsModel: settings.ttsModel ?? DEFAULT_AI_SETTINGS.ttsModel,
    ttsVoice: settings.ttsVoice ?? DEFAULT_AI_SETTINGS.ttsVoice,
    ttsApiKey: settings.ttsApiKey ?? DEFAULT_AI_SETTINGS.ttsApiKey,
  };
}

export { hasProfileValues };
export type { AiSettings };
