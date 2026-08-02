import type {
  Command,
  CommandContext,
  CommandHandler,
  CommandRegistryContract,
  CommandResult,
} from '@browser-ai/contracts';

export class CommandRegistry implements CommandRegistryContract {
  private readonly handlers = new Map<string, CommandHandler>();

  register(name: string, handler: CommandHandler): void {
    this.handlers.set(name, handler);
  }

  has(name: string): boolean {
    return this.handlers.has(name);
  }

  async execute(command: Command, context: CommandContext): Promise<CommandResult> {
    const handler = this.handlers.get(command.name);
    if (!handler) {
      return {
        success: false,
        error: `Unknown command: ${command.name}`,
      };
    }

    try {
      return await handler.execute(command, context);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Command execution failed',
      };
    }
  }
}
