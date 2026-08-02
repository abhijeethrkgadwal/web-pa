import { browserController } from '@browser-ai/browser';
import { createDefaultCommandRegistry } from '@browser-ai/commands';

import { createEngineContext } from './Context';
import { Engine } from './Engine';

export function createDefaultEngine(source = 'engine'): Engine {
  const controller = browserController;
  const registry = createDefaultCommandRegistry(controller);

  return new Engine(
    createEngineContext({
      source,
      controller,
      registry,
    }),
  );
}
