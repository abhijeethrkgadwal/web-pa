export interface FieldConstraints {
  required: boolean;

  disabled: boolean;

  readOnly: boolean;

  multiple: boolean;

  maxLength?: number;

  minLength?: number;

  min?: string;

  max?: string;

  pattern?: string;

  step?: string;

  accept?: string;
}
