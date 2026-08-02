import type { BrowserActionResult, ScrollOptions } from '@browser-ai/contracts';

import { fail, ok } from './dom';

export async function scroll(options: ScrollOptions = {}): Promise<BrowserActionResult> {
  if (typeof window === 'undefined') {
    return fail('window is not available');
  }

  window.scrollTo({
    left: options.x ?? window.scrollX,
    top: options.y ?? window.scrollY,
    behavior: options.behavior ?? 'auto',
  });

  return ok();
}
