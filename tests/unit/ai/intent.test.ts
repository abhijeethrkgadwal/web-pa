import { describe, expect, it, vi } from 'vitest';

import { resolveVoiceIntent } from '@browser-ai/ai';
import type { AIProvider } from '@browser-ai/contracts';

describe('resolveVoiceIntent', () => {
  it('uses heuristics for known fill phrases without calling AI', async () => {
    const provider: AIProvider = {
      name: 'mock',
      generate: vi.fn(async () => '{"kind":"unknown","confidence":0}'),
    };

    const result = await resolveVoiceIntent('Fill my personal details', {
      useAi: true,
      provider,
    });

    expect(result.kind).toBe('fill_personal_details');
    expect(result.source).toBe('heuristic');
    expect(provider.generate).not.toHaveBeenCalled();
  });

  it('asks the LLM when heuristics return unknown', async () => {
    const provider: AIProvider = {
      name: 'mock',
      generate: vi.fn(async () =>
        JSON.stringify({ kind: 'fill_personal_details', confidence: 0.8 }),
      ),
    };

    const result = await resolveVoiceIntent('put my info in the blanks please', {
      useAi: true,
      provider,
    });

    expect(result.kind).toBe('fill_personal_details');
    expect(result.source).toBe('ai');
    expect(provider.generate).toHaveBeenCalledOnce();
  });

  it('falls back to unknown when AI is disabled', async () => {
    const result = await resolveVoiceIntent('hello there');
    expect(result.kind).toBe('unknown');
    expect(result.source).toBe('heuristic');
  });
});
