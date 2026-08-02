/**
 * Aggregate workflow engine, definitions, and executor abstractions.
 */
export interface WorkflowDefinition {
  readonly id: string;
}

export class WorkflowSkeleton implements WorkflowDefinition {
  readonly id = 'workflow-placeholder';
}

export * from './definitions';
export * from './engine';
export * from './executor';
