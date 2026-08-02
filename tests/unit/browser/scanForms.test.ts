import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { scanForms } from '@browser-ai/browser';
import { FieldType } from '@browser-ai/shared';
import { beforeEach, describe, expect, it } from 'vitest';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const fixtureHtml = readFileSync(
  path.join(rootDir, '../../fixtures/job-application.html'),
  'utf8',
);

function loadFixture(html: string = fixtureHtml) {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  document.title = parsed.title;
  document.body.innerHTML = parsed.body.innerHTML;
}

describe('scanForms', () => {
  beforeEach(() => {
    loadFixture();
  });

  it('detects form fields with labels, types, selectors, and constraints', () => {
    const model = scanForms();

    expect(model.title).toBe('Job Application Fixture');
    expect(model.forms).toBe(1);
    expect(model.fields.length).toBeGreaterThanOrEqual(6);

    const firstName = model.fields.find((field) => field.name === 'firstName');
    expect(firstName).toMatchObject({
      type: FieldType.TEXT,
      label: 'First Name',
      selector: '#first-name',
      visible: true,
      constraints: {
        required: true,
        maxLength: 50,
      },
    });

    const email = model.fields.find((field) => field.name === 'email');
    expect(email).toMatchObject({
      type: FieldType.EMAIL,
      label: 'Email Address',
      selector: '#email',
      visible: true,
    });

    const country = model.fields.find((field) => field.name === 'country');
    expect(country?.type).toBe(FieldType.SELECT);
    expect(country?.options).toEqual([
      { label: 'Select', value: '' },
      { label: 'India', value: 'in' },
      { label: 'United States', value: 'us' },
    ]);

    const summary = model.fields.find((field) => field.name === 'summary');
    expect(summary).toMatchObject({
      type: FieldType.TEXTAREA,
      label: 'Summary',
    });

    const relocate = model.fields.find((field) => field.name === 'relocate');
    expect(relocate?.type).toBe(FieldType.CHECKBOX);
    expect(relocate?.label).toMatch(/Willing to relocate/i);

    const submit = model.fields.find((field) => field.type === FieldType.BUTTON);
    expect(submit?.label || submit?.value).toMatch(/Submit Application/i);
  });

  it('skips hidden inputs and marks display:none fields as not visible', () => {
    const model = scanForms();

    const csrf = model.fields.find((field) => field.name === 'csrf');
    expect(csrf).toBeUndefined();

    const hiddenNotes = model.fields.find((field) => field.name === 'hiddenNotes');
    expect(hiddenNotes).toBeDefined();
    expect(hiddenNotes?.visible).toBe(false);
  });

  it('resolves aria-label when no label element exists', () => {
    loadFixture(`
      <!doctype html>
      <html>
        <body>
          <form>
            <input name="search" type="text" aria-label="Search jobs" />
          </form>
        </body>
      </html>
    `);

    const model = scanForms();
    const search = model.fields.find((field) => field.name === 'search');
    expect(search?.label).toBe('Search jobs');
    expect(search?.type).toBe(FieldType.TEXT);
  });
});
