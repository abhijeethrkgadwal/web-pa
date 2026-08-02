import type { FieldMapping } from '@browser-ai/contracts';

export const MESSAGE_TYPES = {
  PING: 'browser-ai:ping',
  SCAN_PAGE: 'browser-ai:scan-page',
  FILL_DEMO: 'browser-ai:fill-demo',
  RUN_PLAN: 'browser-ai:run-plan',
  PREVIEW_FILL: 'browser-ai:preview-fill',
  CONFIRM_FILL: 'browser-ai:confirm-fill',
  CANCEL_FILL: 'browser-ai:cancel-fill',
} as const;

export type MessageType = (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];

export interface PingRequest {
  readonly type: typeof MESSAGE_TYPES.PING;
}

export interface PingResponse {
  readonly ok: true;
  readonly message: string;
  readonly href: string;
}

export interface ScanPageRequest {
  readonly type: typeof MESSAGE_TYPES.SCAN_PAGE;
}

export interface ScanPageResponse {
  readonly ok: true;
  readonly fieldCount: number;
  readonly forms: number;
  readonly title: string;
  readonly url: string;
  readonly fields: Array<{
    name: string;
    type: string;
    label?: string;
    selector: string;
    visible: boolean;
  }>;
}

export interface FillDemoRequest {
  readonly type: typeof MESSAGE_TYPES.FILL_DEMO;
}

export interface FillDemoResponse {
  readonly ok: true;
  readonly attempted: number;
  readonly filled: number;
  readonly failed: Array<{ selector: string; error: string }>;
}

export interface RunPlanRequest {
  readonly type: typeof MESSAGE_TYPES.RUN_PLAN;
}

export interface RunPlanResponse {
  readonly ok: true;
  readonly planId: string;
  readonly success: boolean;
  readonly completed: number;
  readonly total: number;
  readonly mappingSource?: 'heuristic' | 'ai';
  readonly mappingCount?: number;
  readonly error?: string;
}

export interface PreviewFillRequest {
  readonly type: typeof MESSAGE_TYPES.PREVIEW_FILL;
}

export interface PreviewFillResponse {
  readonly ok: boolean;
  readonly mappings: FieldMapping[];
  readonly mappingSource: 'heuristic' | 'ai';
  readonly missingFields?: Array<{
    selector: string;
    name: string;
    type: string;
    label?: string;
  }>;
  readonly error?: string;
}

export interface ConfirmFillRequest {
  readonly type: typeof MESSAGE_TYPES.CONFIRM_FILL;
  readonly mappings: FieldMapping[];
}

export interface ConfirmFillResponse {
  readonly ok: true;
  readonly success: boolean;
  readonly completed: number;
  readonly total: number;
  readonly mappingSource?: 'heuristic' | 'ai';
  readonly error?: string;
}

export interface CancelFillRequest {
  readonly type: typeof MESSAGE_TYPES.CANCEL_FILL;
}

export interface CancelFillResponse {
  readonly ok: true;
  readonly cancelled: true;
}

export type ExtensionRequest =
  | PingRequest
  | ScanPageRequest
  | FillDemoRequest
  | RunPlanRequest
  | PreviewFillRequest
  | ConfirmFillRequest
  | CancelFillRequest;

export type ExtensionResponse =
  | PingResponse
  | ScanPageResponse
  | FillDemoResponse
  | RunPlanResponse
  | PreviewFillResponse
  | ConfirmFillResponse
  | CancelFillResponse;
