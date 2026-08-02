import type { BrowserActionResult } from '@browser-ai/contracts';

import { fail, ok, queryTarget } from './dom';

export async function focus(target: string): Promise<BrowserActionResult> {
  const element = queryTarget(target);
  if (!element) {
    return fail(`Element not found: ${target}`);
  }

  if (!(element instanceof HTMLElement)) {
    return fail(`Cannot focus non-HTML element: ${target}`);
  }

  element.focus();
  element.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
  return ok();
}
