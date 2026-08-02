export interface BrowserAction {
  readonly type: string;
  readonly target?: string;
  readonly value?: unknown;
}

export interface BrowserActionResult {
  readonly success: boolean;
  readonly error?: string;
}

export interface BrowserControllerContract {
  click(target: string): Promise<BrowserActionResult>;
  fill(target: string, value: string): Promise<BrowserActionResult>;
  focus(target: string): Promise<BrowserActionResult>;
  select(target: string, value: string): Promise<BrowserActionResult>;
  upload(target: string, file: File): Promise<BrowserActionResult>;
  scroll(options?: ScrollOptions): Promise<BrowserActionResult>;
}

export interface ScrollOptions {
  readonly x?: number;
  readonly y?: number;
  readonly behavior?: ScrollBehavior;
}

export interface PageScanResult {
  readonly url: string;
  readonly title: string;
  readonly scannedAt: number;
}
