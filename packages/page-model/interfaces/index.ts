/**
 * TODO: Define interfaces consumed by builders and validators.
 */
export interface PageModelProvider {
  build(): Promise<unknown>;
}
