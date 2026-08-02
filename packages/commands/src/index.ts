import type { BrowserControllerContract } from '@browser-ai/contracts';

import {
  clickButtonCommand,
  fillFieldCommand,
  focusFieldCommand,
  scrollPageCommand,
  selectOptionCommand,
} from './implementations';
import { COMMAND_NAMES } from './names';
import { CommandRegistry } from './registry';

export function createDefaultCommandRegistry(
  _controller?: BrowserControllerContract,
): CommandRegistry {
  const registry = new CommandRegistry();

  registry.register(COMMAND_NAMES.FILL_FIELD, fillFieldCommand);
  registry.register(COMMAND_NAMES.SELECT_OPTION, selectOptionCommand);
  registry.register(COMMAND_NAMES.CLICK_BUTTON, clickButtonCommand);
  registry.register(COMMAND_NAMES.FOCUS_FIELD, focusFieldCommand);
  registry.register(COMMAND_NAMES.SCROLL_PAGE, scrollPageCommand);

  return registry;
}

export * from './interfaces';
export * from './names';
export * from './registry';
export * from './implementations';
