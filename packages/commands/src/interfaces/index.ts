/**
 * TODO: Define command interfaces and payload contracts.
 */
export interface CommandContext {
  readonly source: string;
}

export interface CommandHandler {
  execute(context: CommandContext): Promise<void>;
}
