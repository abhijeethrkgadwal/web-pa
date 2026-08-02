import type { Command, CommandContext, CommandHandler, CommandResult } from '@browser-ai/contracts';

function requireString(
  params: Record<string, unknown> | undefined,
  key: string,
): string | CommandResult {
  const value = params?.[key];
  if (typeof value !== 'string' || value.length === 0) {
    return { success: false, error: `Missing or invalid param: ${key}` };
  }
  return value;
}

export const fillFieldCommand: CommandHandler = {
  async execute(command: Command, context: CommandContext): Promise<CommandResult> {
    const target = requireString(command.params, 'target');
    if (typeof target !== 'string') {
      return target;
    }

    const value = requireString(command.params, 'value');
    if (typeof value !== 'string') {
      return value;
    }

    return context.controller.fill(target, value);
  },
};

export const selectOptionCommand: CommandHandler = {
  async execute(command: Command, context: CommandContext): Promise<CommandResult> {
    const target = requireString(command.params, 'target');
    if (typeof target !== 'string') {
      return target;
    }

    const value = requireString(command.params, 'value');
    if (typeof value !== 'string') {
      return value;
    }

    return context.controller.select(target, value);
  },
};

export const clickButtonCommand: CommandHandler = {
  async execute(command: Command, context: CommandContext): Promise<CommandResult> {
    const target = requireString(command.params, 'target');
    if (typeof target !== 'string') {
      return target;
    }

    return context.controller.click(target);
  },
};

export const focusFieldCommand: CommandHandler = {
  async execute(command: Command, context: CommandContext): Promise<CommandResult> {
    const target = requireString(command.params, 'target');
    if (typeof target !== 'string') {
      return target;
    }

    return context.controller.focus(target);
  },
};

export const scrollPageCommand: CommandHandler = {
  async execute(command: Command, context: CommandContext): Promise<CommandResult> {
    const x = typeof command.params?.x === 'number' ? command.params.x : undefined;
    const y = typeof command.params?.y === 'number' ? command.params.y : undefined;
    const behavior =
      command.params?.behavior === 'smooth' || command.params?.behavior === 'auto'
        ? command.params.behavior
        : undefined;

    return context.controller.scroll({ x, y, behavior });
  },
};
