import { PageModelBuilder } from '@browser-ai/page-model';
import { FieldType } from '@browser-ai/shared';

import { extractField } from '../utils/extractField';

export function scanTextareas(builder: PageModelBuilder) {
  const nodes = document.querySelectorAll('textarea');

  nodes.forEach((node) => {
    builder.addField(extractField(node, FieldType.TEXTAREA));
  });
}
