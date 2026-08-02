import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { beforeEach, describe, expect, it } from 'vitest';

import { confirmSmartFill, previewSmartFill } from '@browser-ai/engine';
import { InMemoryStore, saveAiSettings, saveUserProfile } from '@browser-ai/memory';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const fixtureHtml = readFileSync(
  path.join(rootDir, '../../fixtures/job-application.html'),
  'utf8',
);

describe('preview + confirm smart fill', () => {
  let store: InMemoryStore;

  beforeEach(() => {
    store = new InMemoryStore();
    const parsed = new DOMParser().parseFromString(fixtureHtml, 'text/html');
    document.title = parsed.title;
    document.body.innerHTML = parsed.body.innerHTML;
  });

  it('previews mappings without mutating the DOM', async () => {
    await saveUserProfile(
      {
        firstName: 'Abhijeeth',
        email: 'abhijeeth@example.com',
        country: 'in',
      },
      store,
    );
    await saveAiSettings({ enabled: false, provider: 'heuristic' }, store);

    const preview = await previewSmartFill(store);

    expect(preview.ok).toBe(true);
    expect(preview.mappings.length).toBeGreaterThan(0);
    expect(document.querySelector<HTMLInputElement>('#first-name')?.value).toBe('');
    expect(document.querySelector<HTMLInputElement>('#email')?.value).toBe('');
  });

  it('fills only after confirm', async () => {
    await saveUserProfile(
      {
        firstName: 'Abhijeeth',
        email: 'abhijeeth@example.com',
        country: 'in',
        willingToRelocate: true,
      },
      store,
    );

    const preview = await previewSmartFill(store);
    expect(preview.ok).toBe(true);

    const result = await confirmSmartFill(preview.mappings);
    expect(result.success).toBe(true);
    expect(document.querySelector<HTMLInputElement>('#first-name')?.value).toBe('Abhijeeth');
    expect(document.querySelector<HTMLInputElement>('#email')?.value).toBe(
      'abhijeeth@example.com',
    );
  });
});
