export type {
  FieldConstraints,
  FieldOption,
  PageField as Field,
  PageModel as Page,
} from '@browser-ai/shared';

/** Section grouping will be filled in a later phase. */
export interface Section {
  readonly id: string;
  readonly title?: string;
  readonly fields: import('@browser-ai/shared').PageField[];
}
