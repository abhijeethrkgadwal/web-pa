/**
 * Minimal local-first telemetry for MVP debugging.
 */
export type TelemetryPayload = Record<string, unknown>;

export function logEvent(name: string, payload: TelemetryPayload = {}): void {
  const event = {
    name,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  console.info(`[Browser AI:telemetry] ${name}`, event);
}

export class TelemetryLoggerSkeleton {
  public readonly kind = 'telemetry-logger';

  log(name: string, payload?: TelemetryPayload): void {
    logEvent(name, payload);
  }
}
