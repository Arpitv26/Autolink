export type OnboardingSnapshot = {
  profileComplete: boolean;
  garageComplete: boolean;
  complete: boolean;
};

export function getOnboardingSnapshot(
  displayName: string | null | undefined,
  vehicleCount: number
): OnboardingSnapshot {
  const profileComplete = Boolean(displayName?.trim());
  const garageComplete = vehicleCount > 0;
  return {
    profileComplete,
    garageComplete,
    complete: profileComplete && garageComplete,
  };
}
