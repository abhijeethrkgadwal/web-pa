import { describe, expect, it } from 'vitest';

import { browserController } from '@browser-ai/browser';
import type { Command, CommandContext, CommandResult } from '@browser-ai/contracts';
import { Engine } from '@browser-ai/engine';
import { findMissingRequiredFields } from '@browser-ai/engine';
import { FieldType, type PageField } from '@browser-ai/shared';

describe('Engine retries', () => {
  it('retries a flaky step until it succeeds', async () => {
    let attempts = 0;

    const registry = {
      register() {},
      has() {
        return true;
      },
      async execute(_command: Command, _context: CommandContext): Promise<CommandResult> {
        attempts += 1;
        if (attempts < 3) {
          return { success: false, error: 'flaky' };
        }
        return { success: true };
      },
    };

    const engine = new Engine({
      source: 'test',
      controller: browserController,
      registry,
    });

    const result = await engine.run(
      {
        id: 'retry-demo',
        steps: [{ id: 'step-1', action: 'FillField', params: { target: '#x', value: '1' } }],
      },
      { retries: 2, retryDelayMs: 1 },
    );

    expect(result.success).toBe(true);
    expect(attempts).toBe(3);
    expect(result.steps[0]?.attempts).toBe(3);
  });
});

describe('findMissingRequiredFields', () => {
  it('returns required visible fields that were not mapped', () => {
    const fields: PageField[] = [
      {
        id: 'email',
        name: 'email',
        type: FieldType.EMAIL,
        label: 'Email',
        selector: '#email',
        visible: true,
        constraints: { required: true },
      },
      {
        id: 'phone',
        name: 'phone',
        type: FieldType.TEL,
        label: 'Phone',
        selector: '#phone',
        visible: true,
        constraints: { required: true },
      },
      {
        id: 'notes',
        name: 'notes',
        type: FieldType.TEXTAREA,
        label: 'Notes',
        selector: '#notes',
        visible: true,
      },
    ];

    const missing = findMissingRequiredFields(fields, [
      { selector: '#email', value: 'a@b.com', source: 'heuristic' },
    ]);

    expect(missing).toEqual([
      {
        selector: '#phone',
        name: 'phone',
        type: FieldType.TEL,
        label: 'Phone',
      },
    ]);
  });
});
