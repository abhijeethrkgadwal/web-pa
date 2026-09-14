import { describe, expect, it, vi, afterEach } from 'vitest';

import {
  OpenAICompatibleTtsProvider,
  createTtsProvider,
} from '@browser-ai/voice';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('TTS providers', () => {
  it('createTtsProvider returns undefined for none', () => {
    expect(createTtsProvider('none')).toBeUndefined();
    expect(createTtsProvider(undefined)).toBeUndefined();
  });

  it('OpenAICompatibleTtsProvider posts /v1/audio/speech', async () => {
    const blob = new Blob(['audio'], { type: 'audio/mpeg' });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => blob,
    });
    vi.stubGlobal('fetch', fetchMock);

    const provider = new OpenAICompatibleTtsProvider();
    const result = await provider.speak('Filled 3 of 3 fields.', {
      baseUrl: 'https://api.openai.com',
      apiKey: 'sk-test',
      model: 'gpt-4o-mini-tts',
      voice: 'alloy',
    });

    expect(result?.contentType).toContain('audio');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/audio/speech',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
