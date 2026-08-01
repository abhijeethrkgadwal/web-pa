/**
 * TODO: Expose shared UI primitives, providers, and layout components.
 */
export interface UIComponentProps {
  readonly id?: string;
}

export class UIComponentSkeleton implements UIComponentProps {
  readonly id = 'ui-component';
}

export * from './components';
export * from './hooks';
export * from './layouts';
export * from './providers';
