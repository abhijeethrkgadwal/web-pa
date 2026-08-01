import { FieldConstraints } from './field-constraints';
import { FieldOption } from './field-option';
import { FieldType } from './field';

export interface PageField {
  id: string;

  name?: string;

  label: string;

  placeholder?: string;

  type: FieldType;

  selector: string;

  xpath?: string;

  visible: boolean;

  value?: string;

  constraints: FieldConstraints;

  options?: FieldOption[];

  section?: string;
}
