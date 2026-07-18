import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VehicleSetupForm } from '../components/profile/VehicleSetupForm';
import { useAuth } from '../hooks/useAuth';
import { useGarageSetup } from '../hooks/useGarageSetup';
import { useOnboarding } from '../hooks/useOnboarding';
import { useProfileDataForm } from '../hooks/useProfileDataForm';
import { theme } from '../lib/theme';

type SetupStep = 'profile' | 'vehicle' | 'finishing';

export default function OnboardingScreen() {
  const { user, signOut } = useAuth();
  const onboarding = useOnboarding();
  const profile = useProfileDataForm(user);
  const garage = useGarageSetup(user);
  const [step, setStep] = useState<SetupStep>('profile');

  useEffect(() => {
    if (!onboarding.loading && onboarding.profileComplete && step === 'profile') {
      setStep('vehicle');
    }
  }, [onboarding.loading, onboarding.profileComplete, step]);

  const handleProfileContinue = useCallback(async (): Promise<void> => {
    const saved = await profile.save();
    if (!saved) return;

    await onboarding.refresh();
    setStep('vehicle');
  }, [onboarding, profile]);

  const handleVehicleContinue = useCallback(async (): Promise<void> => {
    setStep('finishing');
    await garage.saveSelectedVehicle();
    const nextSnapshot = await onboarding.refresh();

    if (nextSnapshot.complete) {
      router.replace('/(tabs)/feed');
      return;
    }

    setStep('vehicle');
  }, [garage, onboarding]);

  const handleSignOut = useCallback(async (): Promise<void> => {
    await signOut();
    router.replace('/(auth)/sign-in');
  }, [signOut]);

  if (onboarding.loading || profile.loading || garage.loadingSavedVehicles) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={theme.colors.brandPrimary} />
        <Text style={styles.loadingText}>Checking your setup…</Text>
      </SafeAreaView>
    );
  }

  if (onboarding.error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={32} color={theme.colors.textDanger} />
        <Text style={styles.errorTitle}>Setup could not load</Text>
        <Text style={styles.errorBody}>{onboarding.error}</Text>
        <Pressable style={styles.primaryButton} onPress={() => void onboarding.refresh()}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </Pressable>
        <Pressable style={styles.textButton} onPress={() => void handleSignOut()}>
          <Text style={styles.textButtonLabel}>Sign out</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Ionicons name="car-sport-outline" size={23} color={theme.colors.textIconDark} />
          </View>
          <Text style={styles.brand}>AutoLink</Text>
        </View>

        <View style={styles.progressRow}>
          <View style={styles.progressItem}>
            <View style={[styles.progressDot, styles.progressDotActive]}>
              <Text style={styles.progressNumber}>1</Text>
            </View>
            <Text style={styles.progressLabel}>Profile</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressItem}>
            <View
              style={[
                styles.progressDot,
                (step === 'vehicle' || step === 'finishing') && styles.progressDotActive,
              ]}
            >
              <Text style={styles.progressNumber}>2</Text>
            </View>
            <Text style={styles.progressLabel}>Vehicle</Text>
          </View>
        </View>

        {step === 'profile' ? (
          <View style={styles.card}>
            <Text style={styles.eyebrow}>Step 1 of 2</Text>
            <Text style={styles.title}>Create your driver profile</Text>
            <Text style={styles.subtitle}>
              Your name is required. Everything else can be added later.
            </Text>

            <Text style={styles.label}>Display name</Text>
            <TextInput
              value={profile.displayName}
              onChangeText={profile.setDisplayName}
              placeholder="How should people know you?"
              placeholderTextColor={theme.colors.textPlaceholder}
              style={styles.input}
              autoCapitalize="words"
              maxLength={80}
            />

            <Text style={styles.label}>Bio (optional)</Text>
            <TextInput
              value={profile.bio}
              onChangeText={profile.setBio}
              placeholder="Tell the community about your build style"
              placeholderTextColor={theme.colors.textPlaceholder}
              style={[styles.input, styles.bioInput]}
              multiline
              maxLength={240}
              textAlignVertical="top"
            />

            {profile.error ? <Text style={styles.inlineError}>{profile.error}</Text> : null}

            <Pressable
              disabled={profile.saving || profile.displayName.trim().length === 0}
              onPress={() => void handleProfileContinue()}
              style={({ pressed }) => [
                styles.primaryButton,
                (profile.saving || profile.displayName.trim().length === 0) &&
                  styles.buttonDisabled,
                pressed && styles.pressed,
              ]}
            >
              {profile.saving ? (
                <ActivityIndicator color={theme.colors.textInverse} />
              ) : (
                <Text style={styles.primaryButtonText}>Continue to Vehicle</Text>
              )}
            </Pressable>
          </View>
        ) : step === 'vehicle' ? (
          <View style={styles.card}>
            <Text style={styles.eyebrow}>Step 2 of 2</Text>
            <Text style={styles.title}>Add your primary vehicle</Text>
            <Text style={styles.subtitle}>
              AutoLink uses this context to personalize your Feed, Planner, and AI advice.
            </Text>

            <VehicleSetupForm
              year={garage.year}
              yearOptions={garage.yearOptions}
              makes={garage.makes}
              models={garage.models}
              selectedMakeId={garage.selectedMakeId}
              selectedModelId={garage.selectedModelId}
              loadingMakes={garage.loadingMakes}
              loadingModels={garage.loadingModels}
              actionLabel="Finish Setup"
              actionEnabled={garage.canSaveVehicle}
              actionBusy={garage.savingVehicle}
              onYearChange={garage.setYear}
              onMakeChange={garage.setSelectedMakeId}
              onModelChange={garage.setSelectedModelId}
              onSubmit={() => void handleVehicleContinue()}
            />

            {garage.error ? <Text style={styles.inlineError}>{garage.error}</Text> : null}

            <Pressable style={styles.textButton} onPress={() => setStep('profile')}>
              <Text style={styles.textButtonLabel}>Back to profile</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.card, styles.finishingCard]}>
            <ActivityIndicator size="large" color={theme.colors.brandPrimary} />
            <Text style={styles.title}>Finishing your garage…</Text>
            <Text style={styles.subtitle}>You will land in the community Feed next.</Text>
          </View>
        )}

        <Pressable style={styles.signOutButton} onPress={() => void handleSignOut()}>
          <Text style={styles.signOutLabel}>Use a different account</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.appBackground,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 28,
    backgroundColor: theme.colors.appBackground,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 30,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.brandPrimary,
  },
  brand: {
    color: theme.colors.textHeading,
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  progressRow: {
    marginVertical: 28,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  progressItem: {
    alignItems: 'center',
    gap: 5,
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
    backgroundColor: theme.colors.surfaceMuted,
  },
  progressDotActive: {
    borderColor: theme.colors.borderBrand,
    backgroundColor: theme.colors.surfaceProBadge,
  },
  progressNumber: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  progressLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  progressLine: {
    width: 76,
    height: 1,
    marginTop: 16,
    backgroundColor: theme.colors.borderMuted,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.surface,
    padding: 18,
  },
  finishingCard: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    color: theme.colors.accentGreenMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 8,
    color: theme.colors.textHeading,
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    marginBottom: 6,
    color: theme.colors.accentGreenMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    minHeight: 48,
    marginBottom: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderInput,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 12,
    color: theme.colors.textPrimary,
    fontSize: 15,
  },
  bioInput: {
    minHeight: 92,
    paddingTop: 12,
  },
  primaryButton: {
    minWidth: 180,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderBrand,
    backgroundColor: theme.colors.buttonPrimary,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: theme.colors.textInverse,
    fontSize: 15,
    fontWeight: '800',
  },
  textButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  textButtonLabel: {
    color: theme.colors.accentGreenMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  signOutButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  signOutLabel: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  inlineError: {
    marginBottom: 12,
    color: theme.colors.textDanger,
    fontSize: 13,
    lineHeight: 18,
  },
  errorTitle: {
    color: theme.colors.textHeading,
    fontSize: 22,
    fontWeight: '800',
  },
  errorBody: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
});
