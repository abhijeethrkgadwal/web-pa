/**
 * TODO: Provide shared utilities, constants, logging, errors, and types.
 */
export interface SharedResult<T> {
  readonly ok: boolean;
  readonly value?: T;
}

export class SharedSkeleton<T> implements SharedResult<T> {
  readonly ok = true;
}

export * from './constants';
export * from './errors';
export * from './logger';
export * from './types';
export * from './utils';
