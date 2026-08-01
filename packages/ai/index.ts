/**
 * TODO: Aggregate AI provider, parser, planner, executor, and tool abstractions.
 */
export interface AIModelConfig {
  readonly provider: string;
  readonly model: string;
}

export class AIClientSkeleton implements AIModelConfig {
  readonly provider = 'placeholder';
  readonly model = 'placeholder-model';
}

export * from './executor';
export * from './parser';
export * from './planner';
export * from './prompts';
export * from './providers';
export * from './tools';
export * from './interfaces';
