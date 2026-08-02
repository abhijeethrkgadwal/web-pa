import type { BrowserActionResult } from '@browser-ai/contracts';

import { fail, ok, queryTarget } from './dom';

export async function click(target: string): Promise<BrowserActionResult> {
  const element = queryTarget(target);
  if (!element) {
    return fail(`Element not found: ${target}`);
  }

  if (!(element instanceof HTMLElement)) {
    return fail(`Cannot click non-HTML element: ${target}`);
  }

  element.click();
  return ok();
}
