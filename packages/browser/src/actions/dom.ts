import type { BrowserActionResult } from '@browser-ai/contracts';

export function queryTarget(target: string): Element | null {
  try {
    return document.querySelector(target);
  } catch {
    return null;
  }
}

export function fail(error: string): BrowserActionResult {
  return { success: false, error };
}

export function ok(): BrowserActionResult {
  return { success: true };
}

/**
 * Set a control value in a way that works for native and React-controlled inputs.
 */
export function setElementValue(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  value: string,
): void {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : element instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;

  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
  if (descriptor?.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }

  dispatchInputEvents(element);
}

export function dispatchInputEvents(element: Element): void {
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

export function setCheckboxOrRadio(
  element: HTMLInputElement,
  value: string,
): BrowserActionResult {
  const normalized = value.trim().toLowerCase();
  const shouldCheck =
    normalized === 'true' ||
    normalized === '1' ||
    normalized === 'yes' ||
    normalized === 'on' ||
    normalized === element.value.toLowerCase();

  if (element.type === 'radio') {
    if (!shouldCheck && normalized !== element.value.toLowerCase()) {
      return fail(`Radio value "${value}" does not match "${element.value}"`);
    }
    element.checked = true;
  } else {
    element.checked = shouldCheck;
  }

  dispatchInputEvents(element);
  return ok();
}
