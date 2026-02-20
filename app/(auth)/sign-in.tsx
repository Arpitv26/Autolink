import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export default function SignInScreen() {
  const { signInWithGoogle } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = useCallback(async (): Promise<void> => {
    setIsSigningIn(true);
    setErrorMessage(null);

    try {
      await signInWithGoogle();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not sign in. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsSigningIn(false);
    }
  }, [signInWithGoogle]);

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
          <ActivityIndicator color="#0F172A" />
        ) : (
          <Text style={styles.buttonText}>Sign in with Google</Text>
        )}
      </Pressable>
      <Text style={styles.helper}>You will be redirected to Google, then back to the app.</Text>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#CBD5F5',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#FF6B35',
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
    color: '#0F172A',
    fontWeight: '700',
  },
  helper: {
    marginTop: 12,
    color: '#94A3B8',
    fontSize: 12,
  },
  error: {
    marginTop: 10,
    color: '#FCA5A5',
    fontSize: 13,
  },
});
