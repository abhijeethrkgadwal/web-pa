import type { AIMessage, AIProvider } from '@browser-ai/contracts';

export interface AnthropicProviderOptions {
  readonly baseUrl?: string;
  readonly model?: string;
  readonly apiKey?: string;
  readonly maxTokens?: number;
}

/**
 * Anthropic Messages API provider (Claude).
 */
export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly apiKey?: string;
  private readonly maxTokens: number;

  constructor(options: AnthropicProviderOptions = {}) {
    this.baseUrl = (options.baseUrl ?? 'https://api.anthropic.com').replace(/\/$/, '');
    this.model = options.model ?? 'claude-3-5-haiku-latest';
    this.apiKey = options.apiKey?.trim() || undefined;
    this.maxTokens = options.maxTokens ?? 1024;
  }

  async generate(messages: AIMessage[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key is required');
    }

    const system = messages
      .filter((message) => message.role === 'system')
      .map((message) => message.content)
      .join('\n\n');
    const chatMessages = messages
      .filter((message) => message.role !== 'system')
      .map((message) => ({
        role: message.role === 'assistant' ? 'assistant' : 'user',
        content: message.content,
      }));

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.maxTokens,
        ...(system ? { system } : {}),
        messages: chatMessages,
      }),
    });

    const raw = await response.text();
    let data: {
      content?: Array<{ type?: string; text?: string }>;
      error?: { message?: string };
    } = {};
    try {
      data = raw ? (JSON.parse(raw) as typeof data) : {};
    } catch {
      data = { error: { message: raw || response.statusText } };
    }

    if (!response.ok) {
      throw new Error(
        `Anthropic request failed: ${data.error?.message ?? response.statusText}`,
      );
    }

    const text = data.content
      ?.filter((block) => block.type === 'text' && block.text)
      .map((block) => block.text)
      .join('\n')
      .trim();

    if (!text) {
      throw new Error('Anthropic returned an empty response');
    }

    return text;
  }
}

/** @deprecated Use AnthropicProvider */
export class AnthropicProviderSkeleton extends AnthropicProvider {}
