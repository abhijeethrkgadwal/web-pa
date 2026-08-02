export interface AddressProfile {
  readonly line1?: string;
  readonly city?: string;
  readonly state?: string;
  readonly postalCode?: string;
  readonly country?: string;
}

export interface UserProfile {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly country?: string;
  readonly summary?: string;
  readonly willingToRelocate?: boolean;
  readonly address?: AddressProfile;
  readonly updatedAt?: number;
}

export const EMPTY_USER_PROFILE: UserProfile = {};

export function isUserProfile(value: unknown): value is UserProfile {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function hasProfileValues(profile: UserProfile): boolean {
  return Boolean(
    profile.firstName ||
      profile.lastName ||
      profile.email ||
      profile.phone ||
      profile.country ||
      profile.summary ||
      profile.willingToRelocate ||
      profile.address?.line1 ||
      profile.address?.city,
  );
}
