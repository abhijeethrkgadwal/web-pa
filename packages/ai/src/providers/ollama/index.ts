import type { AIMessage, AIProvider } from '@browser-ai/contracts';

export interface OllamaProviderOptions {
  readonly baseUrl?: string;
  readonly model?: string;
}

/**
 * Local Ollama chat provider.
 */
export class OllamaProvider implements AIProvider {
  readonly name = 'ollama';
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(options: OllamaProviderOptions = {}) {
    this.baseUrl = (options.baseUrl ?? 'http://localhost:11434').replace(/\/$/, '');
    this.model = options.model ?? 'llama3.2';
  }

  async generate(messages: AIMessage[]): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as {
      message?: { content?: string };
      error?: string;
    };

    if (data.error) {
      throw new Error(data.error);
    }

    const content = data.message?.content?.trim();
    if (!content) {
      throw new Error('Ollama returned an empty response');
    }

    return content;
  }
}
