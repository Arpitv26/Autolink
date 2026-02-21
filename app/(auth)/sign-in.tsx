import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../lib/theme';

export default function SignInScreen() {
  const { signInWithGoogle, profileSetupError, clearProfileSetupError } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = useCallback(async (): Promise<void> => {
    setIsSigningIn(true);
    setErrorMessage(null);
    clearProfileSetupError();

    try {
      await signInWithGoogle();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not sign in. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsSigningIn(false);
    }
  }, [clearProfileSetupError, signInWithGoogle]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to AutoLink</Text>
      <Text style={styles.subtitle}>
        Sign in to sync your garage, builds, and community feed.
      </Text>
      <Pressable
        onPress={handleGoogleSignIn}
        style={({ pressed }) => [
          styles.button,
          isSigningIn && styles.buttonDisabled,
          pressed && styles.buttonPressed,
        ]}
        disabled={isSigningIn}
      >
        {isSigningIn ? (
          <ActivityIndicator color={theme.colors.textInverse} />
        ) : (
          <Text style={styles.buttonText}>Sign in with Google</Text>
        )}
      </Pressable>
      <Text style={styles.helper}>You will be redirected to Google, then back to the app.</Text>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      {profileSetupError ? <Text style={styles.error}>{profileSetupError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: theme.colors.appBackground,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.textHeading,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    marginBottom: 24,
  },
  button: {
    backgroundColor: theme.colors.buttonSignIn,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: theme.colors.textInverse,
    fontWeight: '700',
  },
  helper: {
    marginTop: 12,
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  error: {
    marginTop: 10,
    color: theme.colors.textDanger,
    fontSize: 13,
  },
});
