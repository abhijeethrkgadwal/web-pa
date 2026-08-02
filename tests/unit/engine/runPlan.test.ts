import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { beforeEach, describe, expect, it } from 'vitest';

import { runPlanFromProfile, runSmartFill } from '@browser-ai/engine';
import { InMemoryStore, saveAiSettings, saveUserProfile } from '@browser-ai/memory';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const fixtureHtml = readFileSync(
  path.join(rootDir, '../../fixtures/job-application.html'),
  'utf8',
);

describe('Engine smart fill', () => {
  let store: InMemoryStore;

  beforeEach(() => {
    store = new InMemoryStore();
    const parsed = new DOMParser().parseFromString(fixtureHtml, 'text/html');
    document.title = parsed.title;
    document.body.innerHTML = parsed.body.innerHTML;
  });

  it('fails when no profile is saved', async () => {
    const result = await runSmartFill(store);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/No profile saved/i);
  });

  it('scans the page and fills using heuristic mappings from memory', async () => {
    await saveUserProfile(
      {
        firstName: 'Abhijeeth',
        email: 'abhijeeth@example.com',
        phone: '+919876543210',
        country: 'in',
        summary: 'Product manager building Browser AI.',
        willingToRelocate: true,
      },
      store,
    );
    await saveAiSettings({ enabled: false, provider: 'heuristic' }, store);

    const result = await runSmartFill(store);

    expect(result.success).toBe(true);
    expect(result.mappingSource).toBe('heuristic');
    expect(result.mappingCount).toBeGreaterThanOrEqual(4);
    expect(document.querySelector<HTMLInputElement>('#first-name')?.value).toBe('Abhijeeth');
    expect(document.querySelector<HTMLInputElement>('#email')?.value).toBe(
      'abhijeeth@example.com',
    );
    expect(document.querySelector<HTMLSelectElement>('#country')?.value).toBe('in');
    expect(document.querySelector<HTMLInputElement>('input[name="relocate"]')?.checked).toBe(
      true,
    );
  });

  it('stops on the first failing step for fixture-specific plans', async () => {
    document.body.innerHTML = '<form><input id="first-name" /></form>';

    const result = await runPlanFromProfile({
      firstName: 'Abhijeeth',
      email: 'abhijeeth@example.com',
    });

    expect(result.success).toBe(false);
    expect(result.completed).toBeLessThan(result.total);
    expect(result.error).toBeTruthy();
  });
});
