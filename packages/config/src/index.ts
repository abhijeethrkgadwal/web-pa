/**
 * Aggregate monorepo-wide configuration values.
 */
export interface RuntimeConfig {
  readonly environment: string;
}

export * from './constants';
export * from './defaults';
