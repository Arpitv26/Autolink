import { StatusBar } from 'expo-status-bar';
import { Stack, router, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { OnboardingProvider, useOnboarding } from '../hooks/useOnboarding';

function RootNavigator() {
  const { session, initializing, profileSetupError } = useAuth();
  const {
    complete: onboardingComplete,
    loading: onboardingLoading,
    error: onboardingError,
  } = useOnboarding();
  const segments = useSegments();

  useEffect(() => {
    if (initializing || onboardingLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (profileSetupError) {
      if (!inAuthGroup) {
        router.replace('/(auth)/sign-in');
      }
      return;
    }

    if (session && onboardingError) {
      if (!inOnboarding) {
        router.replace('/onboarding');
      }
      return;
    }

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
      return;
    }

    if (session && !onboardingComplete && !inOnboarding) {
      router.replace('/onboarding');
      return;
    }

    if (session && onboardingComplete && (inAuthGroup || inOnboarding)) {
      router.replace('/(tabs)/feed');
    }
  }, [
    initializing,
    onboardingComplete,
    onboardingError,
    onboardingLoading,
    profileSetupError,
    segments,
    session,
  ]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen
        name="settings"
        options={{
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="profile-data"
        options={{
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </OnboardingProvider>
    </AuthProvider>
  );
}
