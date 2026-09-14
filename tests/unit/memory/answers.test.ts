import { describe, expect, it } from 'vitest';

import {
  findBestAnswer,
  inferIntent,
  labelSimilarity,
  profileToAnswers,
  type AnswerRecord,
} from '@browser-ai/memory';

describe('answer intent + matching', () => {
  it('infers global intents for common identity fields', () => {
    expect(inferIntent({ label: 'Email Address', type: 'email' }).intent).toBe('email');
    expect(inferIntent({ label: 'First Name' }).intent).toBe('first_name');
    expect(inferIntent({ label: 'Cover letter' }).intent).toBe('summary');
  });

  it('scopes opinion/consent questions to the site', () => {
    const result = inferIntent({
      label: 'How do you feel about commuting to the office 4 days a week?',
    });
    expect(result.scope).toBe('site');
    expect(result.intent.startsWith('custom:')).toBe(true);
  });

  it('matches remembered answers across similar labels', () => {
    const answers: AnswerRecord[] = [
      {
        id: '1',
        intent: 'email',
        value: 'abhijeeth@example.com',
        labels: ['Email Address'],
        sites: [],
        scope: 'global',
        updatedAt: Date.now(),
      },
    ];

    const match = findBestAnswer({
      answers,
      label: 'Work email',
      type: 'email',
    });

    expect(match?.answer.value).toBe('abhijeeth@example.com');
    expect(match?.confidence).toBeGreaterThan(0.7);
  });

  it('scores similar labels highly', () => {
    expect(labelSimilarity('Email Address', 'Work email')).toBeGreaterThan(0.3);
    expect(labelSimilarity('First Name', 'Given name')).toBeGreaterThan(0.3);
  });

  it('seeds answers from profile', () => {
    const seeded = profileToAnswers({
      firstName: 'Abhijeeth',
      email: 'abhijeeth@example.com',
    });
    expect(seeded.some((item) => item.intent === 'email')).toBe(true);
    expect(seeded.some((item) => item.intent === 'first_name')).toBe(true);
  });
});
