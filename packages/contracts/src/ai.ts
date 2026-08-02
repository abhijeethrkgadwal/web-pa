export interface AIMessage {
  readonly role: 'system' | 'user' | 'assistant';
  readonly content: string;
}

export interface AIProvider {
  readonly name: string;
  generate(messages: AIMessage[]): Promise<string>;
}

export interface AIResponse {
  readonly content: string;
  readonly model?: string;
}

export interface IntentParseResult {
  readonly intent: string;
  readonly confidence?: number;
  readonly entities?: Record<string, unknown>;
}

export interface ExecutionPlan {
  readonly id: string;
  readonly steps: ExecutionPlanStep[];
}

export interface ExecutionPlanStep {
  readonly id: string;
  readonly action: string;
  readonly params?: Record<string, unknown>;
}
