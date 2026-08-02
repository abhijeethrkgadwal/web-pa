import type { BrowserControllerContract, CommandRegistryContract } from '@browser-ai/contracts';

export interface EngineContext {
  readonly source: string;
  readonly controller: BrowserControllerContract;
  readonly registry: CommandRegistryContract;
  readonly metadata?: Record<string, unknown>;
}

export function createEngineContext(
  partial: EngineContext,
): EngineContext {
  return partial;
}
