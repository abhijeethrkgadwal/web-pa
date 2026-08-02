import { describe, expect, it } from 'vitest';

import { parseVoiceIntent } from '@browser-ai/voice';

describe('parseVoiceIntent', () => {
  it('detects fill personal details from natural phrases', () => {
    expect(parseVoiceIntent('Fill my personal details').kind).toBe('fill_personal_details');
    expect(parseVoiceIntent('please autofill this form').kind).toBe('fill_personal_details');
    expect(parseVoiceIntent('smart fill').kind).toBe('fill_personal_details');
  });

  it('detects scan intents', () => {
    expect(parseVoiceIntent('scan the page').kind).toBe('scan_page');
  });

  it('returns unknown for unrelated text', () => {
    expect(parseVoiceIntent('what time is it').kind).toBe('unknown');
  });
});
