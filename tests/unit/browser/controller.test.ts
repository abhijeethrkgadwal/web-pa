import { beforeEach, describe, expect, it } from 'vitest';

import { BrowserController } from '@browser-ai/browser';
import { fillDemoValues } from '@browser-ai/browser';

describe('BrowserController actions', () => {
  const controller = new BrowserController();

  beforeEach(() => {
    document.body.innerHTML = `
      <form id="demo-form">
        <label for="email">Email</label>
        <input id="email" name="email" type="email" />

        <label for="country">Country</label>
        <select id="country" name="country">
          <option value="">Select</option>
          <option value="in">India</option>
          <option value="us">United States</option>
        </select>

        <label>
          <input id="relocate" type="checkbox" name="relocate" value="yes" />
          Willing to relocate
        </label>

        <button id="save" type="button">Save</button>
        <input id="resume" type="file" name="resume" />
      </form>
    `;
  });

  it('fills text/email inputs and dispatches input/change events', async () => {
    const email = document.querySelector<HTMLInputElement>('#email')!;
    let inputEvents = 0;
    let changeEvents = 0;
    email.addEventListener('input', () => {
      inputEvents += 1;
    });
    email.addEventListener('change', () => {
      changeEvents += 1;
    });

    const result = await controller.fill('#email', 'abhijeeth@example.com');

    expect(result.success).toBe(true);
    expect(email.value).toBe('abhijeeth@example.com');
    expect(inputEvents).toBe(1);
    expect(changeEvents).toBe(1);
  });

  it('selects options by value and by label', async () => {
    const country = document.querySelector<HTMLSelectElement>('#country')!;

    await expect(controller.select('#country', 'in')).resolves.toMatchObject({
      success: true,
    });
    expect(country.value).toBe('in');

    await expect(controller.select('#country', 'United States')).resolves.toMatchObject({
      success: true,
    });
    expect(country.value).toBe('us');
  });

  it('checks checkboxes and focuses elements', async () => {
    const relocate = document.querySelector<HTMLInputElement>('#relocate')!;
    const result = await controller.fill('#relocate', 'true');
    expect(result.success).toBe(true);
    expect(relocate.checked).toBe(true);

    const focusResult = await controller.focus('#email');
    expect(focusResult.success).toBe(true);
    expect(document.activeElement).toBe(document.querySelector('#email'));
  });

  it('clicks buttons', async () => {
    const button = document.querySelector<HTMLButtonElement>('#save')!;
    let clicked = 0;
    button.addEventListener('click', () => {
      clicked += 1;
    });

    const result = await controller.click('#save');
    expect(result.success).toBe(true);
    expect(clicked).toBe(1);
  });

  it('uploads a file to a file input', async () => {
    const input = document.querySelector<HTMLInputElement>('#resume')!;
    const file = new File(['resume'], 'resume.pdf', { type: 'application/pdf' });

    const result = await controller.upload('#resume', file);
    expect(result.success).toBe(true);
    expect(input.files).toHaveLength(1);
    expect(input.files?.[0]?.name).toBe('resume.pdf');
  });

  it('returns errors for missing targets', async () => {
    const result = await controller.fill('#missing', 'x');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/i);
  });
});

describe('fillDemoValues', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form>
        <label for="first-name">First Name</label>
        <input id="first-name" name="firstName" type="text" />
        <label for="email">Email Address</label>
        <input id="email" name="email" type="email" />
        <label for="country">Country</label>
        <select id="country" name="country">
          <option value="">Select</option>
          <option value="in">India</option>
        </select>
        <label>
          <input id="relocate" type="checkbox" name="relocate" value="yes" />
          Willing to relocate
        </label>
      </form>
    `;
  });

  it('fills matched demo profile fields on the page', async () => {
    const result = await fillDemoValues();

    expect(result.filled).toBeGreaterThanOrEqual(3);
    expect(document.querySelector<HTMLInputElement>('#first-name')?.value).toBe('Abhijeeth');
    expect(document.querySelector<HTMLInputElement>('#email')?.value).toBe(
      'abhijeeth@example.com',
    );
    expect(document.querySelector<HTMLSelectElement>('#country')?.value).toBe('in');
    expect(document.querySelector<HTMLInputElement>('#relocate')?.checked).toBe(true);
  });
});
