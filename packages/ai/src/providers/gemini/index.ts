import type { AIMessage, AIProvider } from '@browser-ai/contracts';

import { OpenAICompatibleProvider } from '../openai';

export interface GeminiProviderOptions {
  readonly baseUrl?: string;
  readonly model?: string;
  readonly apiKey?: string;
}

/**
 * Gemini via Google’s OpenAI-compatible endpoint (or any compatible proxy).
 * Default: `https://generativelanguage.googleapis.com/v1beta/openai`
 */
export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  private readonly inner: OpenAICompatibleProvider;

  constructor(options: GeminiProviderOptions = {}) {
    this.inner = new OpenAICompatibleProvider({
      baseUrl:
        options.baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta/openai',
      model: options.model ?? 'gemini-2.0-flash',
      apiKey: options.apiKey,
    });
  }

  generate(messages: AIMessage[]): Promise<string> {
    return this.inner.generate(messages);
  }
}

/** @deprecated Use GeminiProvider */
export class GeminiProviderSkeleton extends GeminiProvider {}
