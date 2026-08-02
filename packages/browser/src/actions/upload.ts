import type { BrowserActionResult } from '@browser-ai/contracts';

import { dispatchInputEvents, fail, ok, queryTarget } from './dom';

export async function upload(target: string, file: File): Promise<BrowserActionResult> {
  const element = queryTarget(target);
  if (!element) {
    return fail(`Element not found: ${target}`);
  }

  if (!(element instanceof HTMLInputElement) || element.type !== 'file') {
    return fail(`Target is not a file input: ${target}`);
  }

  assignFiles(element, file);
  dispatchInputEvents(element);
  return ok();
}

function assignFiles(input: HTMLInputElement, file: File): void {
  if (typeof DataTransfer !== 'undefined') {
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    return;
  }

  // jsdom / environments without DataTransfer
  const fileList = {
    0: file,
    length: 1,
    item: (index: number) => (index === 0 ? file : null),
    *[Symbol.iterator]() {
      yield file;
    },
  } as unknown as FileList;

  Object.defineProperty(input, 'files', {
    configurable: true,
    value: fileList,
  });
}
