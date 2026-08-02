/**
 * Aggregate encryption, permissions, and secrets abstractions.
 */
export interface PermissionGrant {
  readonly resource: string;
  readonly action: string;
}

export class SecuritySkeleton implements PermissionGrant {
  readonly resource = 'placeholder';
  readonly action = 'read';
}

export * from './encryption';
export * from './permissions';
export * from './secrets';
