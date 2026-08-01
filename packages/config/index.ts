/**
 * TODO: Aggregate monorepo-wide configuration values.
 */
export interface RuntimeConfig {
  readonly environment: string;
}

export const defaults = {
  environment: 'development',
};

export * from './constants';
export * from './defaults';
