import { PageModel } from '@browser-ai/shared/types';
import { PageModelBuilder } from '@browser-ai/page-model';

import { scanInputs } from './inputs';
import { scanSelects } from './selects';
import { scanTextareas } from './textareas';
import { scanButtons } from './buttons';

export function scanForms(): PageModel {
  const builder = new PageModelBuilder();

  scanInputs(builder);
  scanSelects(builder);
  scanTextareas(builder);
  scanButtons(builder);

  return builder.build();
}
