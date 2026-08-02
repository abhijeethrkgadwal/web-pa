import {
  FieldType,
  type FieldConstraints,
  type FieldOption,
  type PageField,
} from '@browser-ai/shared';

import { resolveLabel } from './label';
import { buildSelector } from './selector';
import { isVisible } from './visibility';

type FormControl =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement
  | HTMLButtonElement;

export function extractField(element: Element, type: FieldType): PageField {
  const selector = buildSelector(element);
  const name =
    element.getAttribute('name')?.trim() ||
    (element instanceof HTMLElement ? element.id : '') ||
    selector;

  const field: PageField = {
    id: (element instanceof HTMLElement && element.id) || name || selector,
    name,
    type,
    label: resolveLabel(element),
    selector,
    visible: isVisible(element),
    placeholder: readPlaceholder(element),
    value: readValue(element),
    constraints: readConstraints(element),
    options: readOptions(element),
  };

  return field;
}

function readPlaceholder(element: Element): string | undefined {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return element.placeholder || undefined;
  }
  return undefined;
}

function readValue(element: Element): string | undefined {
  if (element instanceof HTMLInputElement) {
    if (element.type === 'checkbox' || element.type === 'radio') {
      return String(element.checked);
    }
    return element.value || undefined;
  }

  if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
    return element.value || undefined;
  }

  if (element instanceof HTMLButtonElement) {
    return element.value || element.textContent?.trim() || undefined;
  }

  return undefined;
}

function readConstraints(element: Element): FieldConstraints | undefined {
  if (!(isFormControl(element))) {
    return undefined;
  }

  const constraints: FieldConstraints = {};

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
    if (element.required) {
      constraints.required = true;
    }
  }

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    if (element.minLength >= 0 && element.getAttribute('minlength') !== null) {
      constraints.minLength = element.minLength;
    }
    if (element.maxLength >= 0 && element.getAttribute('maxlength') !== null) {
      constraints.maxLength = element.maxLength;
    }
  }

  if (element instanceof HTMLInputElement) {
    if (element.pattern) {
      constraints.pattern = element.pattern;
    }
    if (element.min !== '') {
      const min = Number(element.min);
      if (!Number.isNaN(min)) {
        constraints.min = min;
      }
    }
    if (element.max !== '') {
      const max = Number(element.max);
      if (!Number.isNaN(max)) {
        constraints.max = max;
      }
    }
  }

  return Object.keys(constraints).length > 0 ? constraints : undefined;
}

function readOptions(element: Element): FieldOption[] | undefined {
  if (!(element instanceof HTMLSelectElement)) {
    return undefined;
  }

  const options = Array.from(element.options).map((option) => ({
    label: option.label || option.textContent?.trim() || option.value,
    value: option.value,
  }));

  return options.length > 0 ? options : undefined;
}

function isFormControl(element: Element): element is FormControl {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLButtonElement
  );
}
