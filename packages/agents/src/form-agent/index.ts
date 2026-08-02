import {
  mapProfileToFields,
  type MapFieldsOptions,
  OllamaProvider,
} from '@browser-ai/ai';
import type { FieldMappingResult } from '@browser-ai/contracts';

export interface FormAgentOptions extends MapFieldsOptions {
  readonly ollamaBaseUrl?: string;
  readonly ollamaModel?: string;
}

/**
 * Form agent: suggest fill mappings from profile + scanned fields.
 */
export class FormAgent {
  async suggestMappings(options: FormAgentOptions): Promise<FieldMappingResult> {
    const provider =
      options.provider ??
      (options.useAi
        ? new OllamaProvider({
            baseUrl: options.ollamaBaseUrl,
            model: options.ollamaModel,
          })
        : undefined);

    return mapProfileToFields({
      ...options,
      provider,
    });
  }
}
