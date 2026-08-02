import path from 'node:path';

import { expect, test } from '@playwright/test';

const harnessPath = path.resolve('tests/e2e/dist/harness.js');

async function loadHarness(page: import('@playwright/test').Page) {
  await page.addScriptTag({ path: harnessPath });
  await page.waitForFunction(() => Boolean(window.BrowserAIHarness));
}

test.describe('smart fill fixtures', () => {
  test('job application: preview leaves DOM empty, confirm fills fields', async ({
    page,
  }) => {
    await page.goto('/job-application.html');
    await loadHarness(page);

    await page.evaluate(async () => {
      await window.BrowserAIHarness.seedProfile({
        firstName: 'Abhijeeth',
        email: 'abhijeeth@example.com',
        phone: '+919876543210',
        country: 'in',
        summary: 'Building Browser AI',
        willingToRelocate: true,
      });
    });

    const preview = await page.evaluate(async () => window.BrowserAIHarness.preview());
    expect(preview.ok).toBe(true);
    expect(preview.mappings.length).toBeGreaterThanOrEqual(3);
    expect(await page.locator('#first-name').inputValue()).toBe('');
    expect(await page.locator('#email').inputValue()).toBe('');

    const result = await page.evaluate(
      async (mappings) => window.BrowserAIHarness.confirm(mappings),
      preview.mappings,
    );

    expect(result.success).toBe(true);
    expect(await page.locator('#first-name').inputValue()).toBe('Abhijeeth');
    expect(await page.locator('#email').inputValue()).toBe('abhijeeth@example.com');
    expect(await page.locator('#country').inputValue()).toBe('in');
    expect(await page.locator('input[name="relocate"]').isChecked()).toBe(true);
  });

  test('contact form: maps full name / email / message from profile', async ({ page }) => {
    await page.goto('/contact-form.html');
    await loadHarness(page);

    await page.evaluate(async () => {
      await window.BrowserAIHarness.seedProfile({
        firstName: 'Abhijeeth',
        lastName: 'Rao',
        email: 'abhijeeth@example.com',
        summary: 'Hello from Browser AI',
      });
    });

    const preview = await page.evaluate(async () => window.BrowserAIHarness.preview());
    expect(preview.ok).toBe(true);

    const result = await page.evaluate(
      async (mappings) => window.BrowserAIHarness.confirm(mappings),
      preview.mappings,
    );

    expect(result.success).toBe(true);
    expect(await page.locator('#full-name').inputValue()).toContain('Abhijeeth');
    expect(await page.locator('#contact-email').inputValue()).toBe('abhijeeth@example.com');
    expect(await page.locator('#message').inputValue()).toContain('Browser AI');
  });
});
