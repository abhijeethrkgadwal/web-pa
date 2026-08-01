/**
 * TODO: Define shared AI interfaces such as model providers and message contracts.
 */
export interface AIMessage {
  readonly role: 'system' | 'user' | 'assistant';
  readonly content: string;
}

export interface AIProvider {
  readonly name: string;
  generate(messages: AIMessage[]): Promise<string>;
}
