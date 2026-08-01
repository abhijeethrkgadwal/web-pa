/**
 * TODO: Aggregate telemetry logging, metrics, and tracing abstractions.
 */
export interface TelemetryEvent {
  readonly name: string;
  readonly timestamp: string;
}

export class TelemetrySkeleton implements TelemetryEvent {
  readonly name = 'telemetry';
  readonly timestamp = new Date().toISOString();
}

export * from './logger';
export * from './metrics';
export * from './tracing';
