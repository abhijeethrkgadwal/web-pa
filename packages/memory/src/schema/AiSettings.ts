/**
 * Local-first AI / voice settings persisted in chrome.storage.
 *
 * Provider values:
 * - `heuristic` — offline rules only (default)
 * - `ollama` — local Ollama chat API
 * - `openai` — OpenAI-compatible chat (`/v1/chat/completions`)
 * - `anthropic` — Anthropic Messages API
 *
 * API keys are stored only on-device. Prefer local providers when possible.
 */
export type AiProviderId = 'heuristic' | 'ollama' | 'openai' | 'anthropic';

export type TtsProviderId = 'none' | 'browser' | 'openai';

export interface AiSettings {
  readonly enabled: boolean;
  readonly provider: AiProviderId;

  /** Ollama HTTP base (no trailing slash). */
  readonly ollamaBaseUrl?: string;
  readonly ollamaModel?: string;

  /**
   * OpenAI-compatible chat base URL (no trailing `/v1`).
   * Works with OpenAI, Groq, Together, Fireworks, Azure OpenAI gateways,
   * LM Studio, vLLM, OpenRouter, etc.
   */
  readonly openaiBaseUrl?: string;
  readonly openaiModel?: string;
  /** Stored locally only. Never sent to Browser AI servers (there are none). */
  readonly openaiApiKey?: string;

  readonly anthropicBaseUrl?: string;
  readonly anthropicModel?: string;
  readonly anthropicApiKey?: string;

  /** OpenAI-compatible Whisper STT base URL (no trailing `/v1`). */
  readonly sttBaseUrl?: string;
  readonly sttModel?: string;
  /** Optional bearer token for cloud STT endpoints. */
  readonly sttApiKey?: string;

  /** Spoken feedback after review / fill (optional). */
  readonly ttsProvider?: TtsProviderId;
  readonly ttsBaseUrl?: string;
  readonly ttsModel?: string;
  readonly ttsVoice?: string;
  readonly ttsApiKey?: string;
}

export const DEFAULT_AI_SETTINGS: AiSettings = {
  enabled: false,
  provider: 'heuristic',
  ollamaBaseUrl: 'http://127.0.0.1:11434',
  ollamaModel: 'llama3.2',
  openaiBaseUrl: 'https://api.openai.com',
  openaiModel: 'gpt-4o-mini',
  openaiApiKey: '',
  anthropicBaseUrl: 'https://api.anthropic.com',
  anthropicModel: 'claude-3-5-haiku-latest',
  anthropicApiKey: '',
  sttBaseUrl: 'http://127.0.0.1:8090',
  sttModel: 'Xenova/whisper-tiny.en',
  sttApiKey: '',
  ttsProvider: 'none',
  ttsBaseUrl: 'https://api.openai.com',
  ttsModel: 'gpt-4o-mini-tts',
  ttsVoice: 'alloy',
  ttsApiKey: '',
};

export const AI_SETTINGS_KEY = 'ai-settings';

export const AI_PROVIDER_IDS: readonly AiProviderId[] = [
  'heuristic',
  'ollama',
  'openai',
  'anthropic',
] as const;

export const TTS_PROVIDER_IDS: readonly TtsProviderId[] = [
  'none',
  'browser',
  'openai',
] as const;
