import type { BrowserActionResult } from '@browser-ai/contracts';

import { fill } from './fill';

/**
 * Select an option on a <select> by value or visible label.
 */
export async function select(
  target: string,
  value: string,
): Promise<BrowserActionResult> {
  return fill(target, value);
}
