import { describe, expect, it } from 'vitest';
import { getOnboardingSnapshot } from './onboarding';

describe('getOnboardingSnapshot', () => {
  it('requires both a display name and a vehicle', () => {
    expect(getOnboardingSnapshot('Arpit', 1)).toEqual({
      profileComplete: true,
      garageComplete: true,
      complete: true,
    });
  });

  it('treats blank names as incomplete', () => {
    expect(getOnboardingSnapshot('   ', 1).complete).toBe(false);
  });

  it('requires at least one vehicle', () => {
    expect(getOnboardingSnapshot('Arpit', 0).complete).toBe(false);
  });
});
