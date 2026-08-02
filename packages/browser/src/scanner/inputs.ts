import { PageModelBuilder } from '@browser-ai/page-model';
import { FieldType } from '@browser-ai/shared';

import { extractField } from '../utils/extractField';

export function scanInputs(builder: PageModelBuilder) {
  const inputs = document.querySelectorAll<HTMLInputElement>('input');

  inputs.forEach((input) => {
    if (input.type === 'hidden') return;

    builder.addField(extractField(input, mapInputType(input)));
  });
}

function mapInputType(input: HTMLInputElement): FieldType {
  switch (input.type) {
    case 'email':
      return FieldType.EMAIL;

    case 'password':
      return FieldType.PASSWORD;

    case 'checkbox':
      return FieldType.CHECKBOX;

    case 'radio':
      return FieldType.RADIO;

    case 'file':
      return FieldType.FILE;

    case 'number':
      return FieldType.NUMBER;

    case 'date':
      return FieldType.DATE;

    case 'tel':
      return FieldType.TEL;

    case 'url':
      return FieldType.URL;

    case 'submit':
      return FieldType.SUBMIT;

    default:
      return FieldType.TEXT;
  }
}
