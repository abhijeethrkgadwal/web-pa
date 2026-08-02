export interface EventEnvelope {
  readonly type: string;
  readonly payload?: unknown;
  readonly timestamp?: number;
}

export interface EventBusContract {
  publish(event: EventEnvelope): void;
  subscribe(type: string, handler: (event: EventEnvelope) => void): () => void;
}

export interface MessageEnvelope {
  readonly type: string;
  readonly data?: unknown;
}
