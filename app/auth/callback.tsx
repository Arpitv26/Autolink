import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../lib/theme';

export default function AuthCallbackScreen() {
  useEffect(() => {
    // OAuth deep-link lands here; jump back into normal auth-gated flow.
    router.replace('/');
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={theme.colors.accentGreen} />
      <Text style={styles.text}>Finishing sign-in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.colors.appBackground,
  },
  text: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
});
