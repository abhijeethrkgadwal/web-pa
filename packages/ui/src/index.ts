/**
 * Shared UI primitives, providers, and layout components.
 */
export interface UIComponentProps {
  readonly id?: string;
}

export class UIRootSkeleton implements UIComponentProps {
  readonly id = 'ui-root';
}

export * from './components';
export * from './hooks';
export * from './layouts';
export * from './providers';
