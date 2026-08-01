import { PageModelBuilder } from '@browser-ai/page-model';
import { FieldType } from '@browser-ai/shared/types';

import { extractField } from '../utils/extractField';

export function scanSelects(builder: PageModelBuilder) {
  const selects = document.querySelectorAll('select');

  selects.forEach((select) => {
    builder.addField(
      extractField(
        select,
        select.multiple ? FieldType.MULTI_SELECT : FieldType.SELECT,
      ),
    );
  });
}
