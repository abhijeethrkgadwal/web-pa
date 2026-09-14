import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearUserProfile,
  getUserProfile,
  hasProfileValues,
  InMemoryStore,
  saveUserProfile,
} from '@browser-ai/memory';

describe('UserProfile memory', () => {
  let store: InMemoryStore;

  beforeEach(() => {
    store = new InMemoryStore();
  });

  it('returns empty profile when nothing is saved', async () => {
    const profile = await getUserProfile(store);
    expect(hasProfileValues(profile)).toBe(false);
  });

  it('saves and retrieves a profile', async () => {
    await saveUserProfile(
      {
        firstName: 'Abhijeeth',
        email: 'abhijeeth@example.com',
        phone: '+919876543210',
        country: 'in',
        summary: 'Building Browser AI',
        willingToRelocate: true,
      },
      store,
    );

    const profile = await getUserProfile(store);
    expect(profile.firstName).toBe('Abhijeeth');
    expect(profile.email).toBe('abhijeeth@example.com');
    expect(profile.country).toBe('in');
    expect(profile.willingToRelocate).toBe(true);
    expect(profile.updatedAt).toBeTypeOf('number');
    expect(hasProfileValues(profile)).toBe(true);
  });

  it('saves and retrieves address fields', async () => {
    await saveUserProfile(
      {
        firstName: 'Abhijeeth',
        address: {
          line1: '12 MG Road',
          city: 'Bengaluru',
          state: 'KA',
          postalCode: '560001',
          country: 'India',
        },
      },
      store,
    );

    const profile = await getUserProfile(store);
    expect(profile.address?.line1).toBe('12 MG Road');
    expect(profile.address?.city).toBe('Bengaluru');
    expect(profile.address?.postalCode).toBe('560001');
    expect(hasProfileValues(profile)).toBe(true);
  });

  it('clears a saved profile', async () => {
    await saveUserProfile({ firstName: 'Abhijeeth' }, store);
    await clearUserProfile(store);
    const profile = await getUserProfile(store);
    expect(hasProfileValues(profile)).toBe(false);
  });
});
