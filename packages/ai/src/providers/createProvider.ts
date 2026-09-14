import type { AIProvider } from '@browser-ai/contracts';
import type { AiSettings } from '@browser-ai/memory';

import { AnthropicProvider } from './anthropic';
import { OllamaProvider } from './ollama';
import { OpenAICompatibleProvider } from './openai';

/**
 * Build an AIProvider from persisted settings, or `undefined` for heuristics-only.
 */
export function createAIProviderFromSettings(
  settings: Pick<
    AiSettings,
    | 'enabled'
    | 'provider'
    | 'ollamaBaseUrl'
    | 'ollamaModel'
    | 'openaiBaseUrl'
    | 'openaiModel'
    | 'openaiApiKey'
    | 'anthropicBaseUrl'
    | 'anthropicModel'
    | 'anthropicApiKey'
  >,
): AIProvider | undefined {
  if (!settings.enabled || settings.provider === 'heuristic') {
    return undefined;
  }

  switch (settings.provider) {
    case 'ollama':
      return new OllamaProvider({
        baseUrl: settings.ollamaBaseUrl,
        model: settings.ollamaModel,
      });
    case 'openai':
      return new OpenAICompatibleProvider({
        baseUrl: settings.openaiBaseUrl,
        model: settings.openaiModel,
        apiKey: settings.openaiApiKey,
      });
    case 'anthropic':
      return new AnthropicProvider({
        baseUrl: settings.anthropicBaseUrl,
        model: settings.anthropicModel,
        apiKey: settings.anthropicApiKey,
      });
    default:
      return undefined;
  }
}
