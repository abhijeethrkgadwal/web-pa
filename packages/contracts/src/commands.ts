import type { BrowserControllerContract } from './browser';

export interface CommandContext {
  readonly source: string;
  readonly controller: BrowserControllerContract;
  readonly metadata?: Record<string, unknown>;
}

export interface Command {
  readonly name: string;
  readonly params?: Record<string, unknown>;
}

export interface CommandResult {
  readonly success: boolean;
  readonly error?: string;
}

export interface CommandHandler {
  execute(command: Command, context: CommandContext): Promise<CommandResult>;
}

export interface CommandRegistryContract {
  register(name: string, handler: CommandHandler): void;
  has(name: string): boolean;
  execute(command: Command, context: CommandContext): Promise<CommandResult>;
}
