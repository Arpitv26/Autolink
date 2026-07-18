import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useOnboarding } from '../hooks/useOnboarding';
import { theme } from '../lib/theme';

export default function Index() {
  const { session, initializing } = useAuth();
  const { complete, loading: onboardingLoading, error: onboardingError } = useOnboarding();

  if (initializing || onboardingLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={theme.colors.brandPrimary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!complete || onboardingError) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)/feed" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.appBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
