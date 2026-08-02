import type { BrowserActionResult } from '@browser-ai/contracts';

import { fail, ok, queryTarget, setCheckboxOrRadio, setElementValue } from './dom';

export async function fill(target: string, value: string): Promise<BrowserActionResult> {
  const element = queryTarget(target);
  if (!element) {
    return fail(`Element not found: ${target}`);
  }

  if (element instanceof HTMLSelectElement) {
    return selectByValueOrLabel(element, value);
  }

  if (element instanceof HTMLInputElement) {
    if (element.type === 'checkbox' || element.type === 'radio') {
      return setCheckboxOrRadio(element, value);
    }

    if (element.type === 'file') {
      return fail('Use upload() for file inputs');
    }

    setElementValue(element, value);
    return ok();
  }

  if (element instanceof HTMLTextAreaElement) {
    setElementValue(element, value);
    return ok();
  }

  if (element instanceof HTMLElement && element.isContentEditable) {
    element.textContent = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    return ok();
  }

  return fail(`Unsupported fill target: ${element.tagName.toLowerCase()}`);
}

function selectByValueOrLabel(
  element: HTMLSelectElement,
  value: string,
): BrowserActionResult {
  const byValue = Array.from(element.options).find((option) => option.value === value);
  if (byValue) {
    setElementValue(element, byValue.value);
    return ok();
  }

  const byLabel = Array.from(element.options).find(
    (option) =>
      option.label === value || option.textContent?.trim() === value,
  );
  if (byLabel) {
    setElementValue(element, byLabel.value);
    return ok();
  }

  return fail(`Option not found for select: ${value}`);
}
