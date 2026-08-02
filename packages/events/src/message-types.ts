/**
 * Message payload contracts for app-to-app communication.
 */
export interface MessageEnvelope {
  readonly type: string;
  readonly data?: unknown;
}
