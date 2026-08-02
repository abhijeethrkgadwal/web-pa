/**
 * Shared event bus and message contracts.
 */
export interface EventEnvelope {
  readonly type: string;
  readonly payload?: unknown;
}

export class EventBusSkeleton {
  public readonly kind = 'event-bus';
}

export * from './bus';
export * from './event-types';
export * from './message-types';
