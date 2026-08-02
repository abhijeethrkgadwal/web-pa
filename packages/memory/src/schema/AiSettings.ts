export interface AiSettings {
  readonly enabled: boolean;
  readonly provider: 'heuristic' | 'ollama';
  readonly ollamaBaseUrl?: string;
  readonly ollamaModel?: string;
}

export const DEFAULT_AI_SETTINGS: AiSettings = {
  enabled: false,
  provider: 'heuristic',
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaModel: 'llama3.2',
};

export const AI_SETTINGS_KEY = 'ai-settings';
