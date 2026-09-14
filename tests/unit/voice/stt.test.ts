import { afterEach, describe, expect, it, vi } from 'vitest';

import { transcribeWithOpenAiCompatible } from '@browser-ai/voice';

describe('transcribeWithOpenAiCompatible', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts base64 wav audio as JSON to the STT endpoint', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ text: 'Fill my personal details' }),
    );
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('btoa', (value: string) => Buffer.from(value, 'binary').toString('base64'));

    // Large enough to pass the client-side size guard.
    const wavHeader = new Uint8Array(2048);
    wavHeader.set([0x52, 0x49, 0x46, 0x46], 0); // RIFF
    const blob = new Blob([wavHeader], { type: 'audio/wav' });

    const result = await transcribeWithOpenAiCompatible(blob, {
      baseUrl: 'http://127.0.0.1:8090',
      model: 'Xenova/whisper-tiny.en',
    });

    expect(result.text).toBe('Fill my personal details');
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('http://127.0.0.1:8090/v1/audio/transcriptions');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' });
    const body = JSON.parse(String(init?.body));
    expect(body.model).toBe('Xenova/whisper-tiny.en');
    expect(typeof body.audio_base64).toBe('string');
    expect(body.audio_base64.length).toBeGreaterThan(10);
  });
});
