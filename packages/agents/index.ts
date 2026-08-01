/**
 * TODO: Define agent contracts, lifecycle hooks, and orchestration entrypoints.
 */
export interface AgentDefinition {
  readonly id: string;
  readonly name: string;
}

export class BaseAgent implements AgentDefinition {
  readonly id = 'base-agent';
  readonly name = 'BaseAgent';
}

export * from './base';
export * from './form-agent';
export * from './memory-agent';
export * from './navigator-agent';
export * from './planner-agent';
