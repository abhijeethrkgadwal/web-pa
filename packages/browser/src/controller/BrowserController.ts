import type {
  BrowserActionResult,
  BrowserControllerContract,
  ScrollOptions,
} from '@browser-ai/contracts';

import { click } from '../actions/click';
import { fill } from '../actions/fill';
import { focus } from '../actions/focus';
import { scroll } from '../actions/scroll';
import { select } from '../actions/select';
import { upload } from '../actions/upload';

export class BrowserController implements BrowserControllerContract {
  click(target: string): Promise<BrowserActionResult> {
    return click(target);
  }

  fill(target: string, value: string): Promise<BrowserActionResult> {
    return fill(target, value);
  }

  focus(target: string): Promise<BrowserActionResult> {
    return focus(target);
  }

  select(target: string, value: string): Promise<BrowserActionResult> {
    return select(target, value);
  }

  upload(target: string, file: File): Promise<BrowserActionResult> {
    return upload(target, file);
  }

  scroll(options?: ScrollOptions): Promise<BrowserActionResult> {
    return scroll(options);
  }
}

export const browserController = new BrowserController();
