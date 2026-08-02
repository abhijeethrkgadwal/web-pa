import { PageModelBuilder } from '@browser-ai/page-model';
import { FieldType } from '@browser-ai/shared';

import { extractField } from '../utils/extractField';

export function scanButtons(builder: PageModelBuilder) {
  const buttons = document.querySelectorAll('button');

  buttons.forEach((button) => {
    builder.addField(extractField(button, FieldType.BUTTON));
  });
}
