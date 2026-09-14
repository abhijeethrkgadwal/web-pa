import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AnthropicProvider,
  OpenAICompatibleProvider,
  createAIProviderFromSettings,
} from '@browser-ai/ai';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('OpenAICompatibleProvider', () => {
  it('posts chat completions and returns content', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          choices: [{ message: { content: '  hello  ' } }],
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const provider = new OpenAICompatibleProvider({
      baseUrl: 'https://api.openai.com',
      model: 'gpt-4o-mini',
      apiKey: 'sk-test',
    });

    await expect(
      provider.generate([{ role: 'user', content: 'hi' }]),
    ).resolves.toBe('hello');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test',
        }),
      }),
    );
  });
});

describe('AnthropicProvider', () => {
  it('requires an api key', async () => {
    const provider = new AnthropicProvider({ apiKey: '' });
    await expect(
      provider.generate([{ role: 'user', content: 'hi' }]),
    ).rejects.toThrow(/API key/i);
  });

  it('calls messages API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          content: [{ type: 'text', text: 'claude says hi' }],
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const provider = new AnthropicProvider({
      apiKey: 'sk-ant',
      model: 'claude-3-5-haiku-latest',
    });

    await expect(
      provider.generate([
        { role: 'system', content: 'be brief' },
        { role: 'user', content: 'hi' },
      ]),
    ).resolves.toBe('claude says hi');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-api-key': 'sk-ant',
        }),
      }),
    );
  });
});

describe('createAIProviderFromSettings', () => {
  it('returns undefined for heuristic / disabled', () => {
    expect(
      createAIProviderFromSettings({
        enabled: false,
        provider: 'ollama',
      }),
    ).toBeUndefined();

    expect(
      createAIProviderFromSettings({
        enabled: true,
        provider: 'heuristic',
      }),
    ).toBeUndefined();
  });

  it('builds openai provider when enabled', () => {
    const provider = createAIProviderFromSettings({
      enabled: true,
      provider: 'openai',
      openaiBaseUrl: 'https://api.groq.com/openai',
      openaiModel: 'llama-3.1-8b-instant',
      openaiApiKey: 'gsk',
    });
    expect(provider?.name).toBe('openai');
  });
});
