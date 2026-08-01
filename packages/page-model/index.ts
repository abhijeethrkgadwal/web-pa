/**
 * TODO: Define page model construction, validation, and serialization.
 */
export interface PageModelShape {
  readonly title: string;
}

export class PageModelSkeleton implements PageModelShape {
  readonly title = 'placeholder-page';
}

export * from './interfaces';
export * from './models';
export * from './validators';

export * from './builders/pageModelBuilder';
