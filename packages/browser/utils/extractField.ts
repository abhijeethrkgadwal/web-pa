import {
  FieldConstraints,
  FieldOption,
  FieldType,
  PageField,
} from '@browser-ai/shared/types';

import { getLabel } from './label';
import { createSelector } from './selector';
import { isVisible } from './visibility';

export function extractField(element: HTMLElement, type: FieldType): PageField {
  const options: FieldOption[] = [];

  if (element instanceof HTMLSelectElement) {
    element.querySelectorAll('option').forEach((option) => {
      options.push({
        value: option.value,

        label: option.textContent ?? '',

        selected: option.selected,
      });
    });
  }

  const constraints: FieldConstraints = {
    required: (element as HTMLInputElement).required ?? false,

    disabled: (element as HTMLInputElement).disabled ?? false,

    readOnly: (element as HTMLInputElement).readOnly ?? false,

    multiple: (element as HTMLSelectElement).multiple ?? false,

    maxLength:
      (element as HTMLInputElement).maxLength > -1
        ? (element as HTMLInputElement).maxLength
        : undefined,

    minLength: (element as HTMLInputElement).minLength,

    min: (element as HTMLInputElement).min,

    max: (element as HTMLInputElement).max,

    pattern: (element as HTMLInputElement).pattern,

    step: (element as HTMLInputElement).step,

    accept: (element as HTMLInputElement).accept,
  };

  return {
    id: element.id,

    name: (element as HTMLInputElement).name,

    label: getLabel(element),

    placeholder: (element as HTMLInputElement).placeholder,

    selector: createSelector(element),

    visible: isVisible(element),

    value: (element as HTMLInputElement).value,

    type,

    constraints,

    options,
  };
}
