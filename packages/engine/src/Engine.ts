import type { CommandResult, ExecutionPlan } from '@browser-ai/contracts';
import { logEvent } from '@browser-ai/telemetry';

import type { EngineContext } from './Context';

export interface StepExecutionResult {
  readonly stepId: string;
  readonly action: string;
  readonly result: CommandResult;
  readonly attempts: number;
}

export interface EngineRunResult {
  readonly planId: string;
  readonly success: boolean;
  readonly completed: number;
  readonly total: number;
  readonly steps: StepExecutionResult[];
  readonly error?: string;
}

export interface EngineRunOptions {
  readonly retries?: number;
  readonly retryDelayMs?: number;
}

const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 40;

export class Engine {
  constructor(private readonly context: EngineContext) {}

  async run(
    plan: ExecutionPlan,
    options: EngineRunOptions = {},
  ): Promise<EngineRunResult> {
    const retries = options.retries ?? DEFAULT_RETRIES;
    const retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
    const steps: StepExecutionResult[] = [];

    logEvent('engine.plan.start', {
      planId: plan.id,
      total: plan.steps.length,
      retries,
    });

    for (const planStep of plan.steps) {
      let result: CommandResult = { success: false, error: 'Not executed' };
      let attempts = 0;

      while (attempts <= retries) {
        attempts += 1;
        result = await this.context.registry.execute(
          {
            name: planStep.action,
            params: planStep.params,
          },
          {
            source: this.context.source,
            controller: this.context.controller,
            metadata: {
              ...this.context.metadata,
              planId: plan.id,
              stepId: planStep.id,
              attempt: attempts,
            },
          },
        );

        if (result.success) {
          break;
        }

        if (attempts <= retries) {
          logEvent('engine.step.retry', {
            planId: plan.id,
            stepId: planStep.id,
            attempt: attempts,
            error: result.error,
          });
          await delay(retryDelayMs * attempts);
        }
      }

      steps.push({
        stepId: planStep.id,
        action: planStep.action,
        result,
        attempts,
      });

      if (!result.success) {
        logEvent('engine.plan.failed', {
          planId: plan.id,
          stepId: planStep.id,
          error: result.error,
        });
        return {
          planId: plan.id,
          success: false,
          completed: steps.length - 1,
          total: plan.steps.length,
          steps,
          error: result.error ?? `Step failed: ${planStep.id}`,
        };
      }
    }

    logEvent('engine.plan.success', {
      planId: plan.id,
      completed: steps.length,
    });

    return {
      planId: plan.id,
      success: true,
      completed: steps.length,
      total: plan.steps.length,
      steps,
    };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
