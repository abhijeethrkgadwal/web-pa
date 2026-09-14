import type { AIMessage, AIProvider } from '@browser-ai/contracts';

export interface OpenAICompatibleProviderOptions {
  /** Base URL without trailing slash or `/v1` (e.g. `https://api.openai.com`). */
  readonly baseUrl?: string;
  readonly model?: string;
  readonly apiKey?: string;
  /** Extra headers (e.g. OpenRouter `HTTP-Referer`). */
  readonly headers?: Record<string, string>;
}

/**
 * OpenAI Chat Completions–compatible provider.
 *
 * Works with OpenAI, Groq, Together, Fireworks, OpenRouter, Azure OpenAI
 * gateways, LM Studio, vLLM, and any server exposing `/v1/chat/completions`.
 */
export class OpenAICompatibleProvider implements AIProvider {
  readonly name = 'openai';
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly apiKey?: string;
  private readonly headers: Record<string, string>;

  constructor(options: OpenAICompatibleProviderOptions = {}) {
    this.baseUrl = (options.baseUrl ?? 'https://api.openai.com').replace(/\/$/, '');
    this.model = options.model ?? 'gpt-4o-mini';
    this.apiKey = options.apiKey?.trim() || undefined;
    this.headers = options.headers ?? {};
  }

  async generate(messages: AIMessage[]): Promise<string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.headers,
    };
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.2,
      }),
    });

    const raw = await response.text();
    let data: {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string } | string;
    } = {};
    try {
      data = raw ? (JSON.parse(raw) as typeof data) : {};
    } catch {
      data = { error: raw || response.statusText };
    }

    if (!response.ok) {
      const message =
        typeof data.error === 'string'
          ? data.error
          : data.error?.message || `${response.status} ${response.statusText}`;
      throw new Error(`OpenAI-compatible request failed: ${message}`);
    }

    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('OpenAI-compatible provider returned an empty response');
    }

    return content;
  }
}

/** @deprecated Use OpenAICompatibleProvider */
export class OpenAIProviderSkeleton extends OpenAICompatibleProvider {}
