/**
 * TODO: Define shared error classes and helpers.
 */
export class SharedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SharedError';
  }
}
