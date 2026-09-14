import {
  createAIProviderFromSettings,
  mapProfileToFields,
  type MapFieldsOptions,
} from '@browser-ai/ai';
import type { FieldMappingResult } from '@browser-ai/contracts';
import type { AiSettings } from '@browser-ai/memory';

export interface FormAgentOptions extends MapFieldsOptions {
  readonly ollamaBaseUrl?: string;
  readonly ollamaModel?: string;
  /** Prefer this when calling from engine / extension with full settings. */
  readonly aiSettings?: Pick<
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
  >;
}

/**
 * Form agent: suggest fill mappings from profile + scanned fields.
 */
export class FormAgent {
  async suggestMappings(options: FormAgentOptions): Promise<FieldMappingResult> {
    const provider =
      options.provider ??
      (options.aiSettings
        ? createAIProviderFromSettings(options.aiSettings)
        : undefined);

    return mapProfileToFields({
      ...options,
      useAi: Boolean(provider) || options.useAi,
      provider,
    });
  }
}
