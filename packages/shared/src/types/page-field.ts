import type { FieldType } from './field-type';
import type { FieldConstraints } from './field-constraints';
import type { FieldOption } from './field-option';

export interface PageField {
  id: string;
  name: string;
  type: FieldType | string;
  label?: string;
  selector: string;
  visible: boolean;
  value?: string;
  placeholder?: string;
  constraints?: FieldConstraints;
  options?: FieldOption[];
}
