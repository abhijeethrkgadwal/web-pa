/**
 * TODO: Register command implementations and expose a command API.
 */
export interface CommandDefinition {
  readonly id: string;
  readonly description: string;
}

export class CommandSkeleton implements CommandDefinition {
  readonly id = 'placeholder-command';
  readonly description = 'Placeholder command';
}

export * from './interfaces';
export * from './registry';
export * from './implementations';
