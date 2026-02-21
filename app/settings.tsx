import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../lib/theme';

const FAQ_URL = 'https://autolink.app/faq';
const TERMS_URL = 'https://autolink.app/terms';
const PRIVACY_URL = 'https://autolink.app/privacy';
const SUPPORT_EMAIL = 'support@autolink.app';

type SettingsRowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
};

function SettingsRow({ icon, label, onPress }: SettingsRowProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={18} color={theme.colors.accentGreen} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.iconSubtle} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth();

  const openExternalLink = useCallback(async (url: string, label: string): Promise<void> => {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('Link unavailable', `Could not open ${label}.`);
      return;
    }
    await Linking.openURL(url);
  }, []);

  const openSupportEmail = useCallback(async (): Promise<void> => {
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=AutoLink%20Support`;
    const canOpen = await Linking.canOpenURL(mailto);
    if (!canOpen) {
      Alert.alert('Email unavailable', `Please email us at ${SUPPORT_EMAIL}.`);
      return;
    }
    await Linking.openURL(mailto);
  }, []);

  const openBugReportEmail = useCallback(async (): Promise<void> => {
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=AutoLink%20Bug%20Report`;
    const canOpen = await Linking.canOpenURL(mailto);
    if (!canOpen) {
      Alert.alert('Email unavailable', `Please email us at ${SUPPORT_EMAIL}.`);
      return;
    }
    await Linking.openURL(mailto);
  }, []);

  const openFeatureRequestEmail = useCallback(async (): Promise<void> => {
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=AutoLink%20Feature%20Request`;
    const canOpen = await Linking.canOpenURL(mailto);
    if (!canOpen) {
      Alert.alert('Email unavailable', `Please email us at ${SUPPORT_EMAIL}.`);
      return;
    }
    await Linking.openURL(mailto);
  }, []);

  const handleSignOut = useCallback(async (): Promise<void> => {
    await signOut();
    router.replace('/(auth)/sign-in');
  }, [signOut]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
                return;
              }
              router.replace('/(tabs)/profile');
            }}
            style={({ pressed }) => [styles.backButton, pressed && styles.rowPressed]}
          >
            <Ionicons name="arrow-back" size={18} color={theme.colors.accentGreen} />
          </Pressable>
          <View>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>Support, legal, and account resources.</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account</Text>
          <SettingsRow
            icon="person-outline"
            label="Edit Profile"
            onPress={() => router.push('/profile-data')}
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Support</Text>
          <SettingsRow icon="help-circle-outline" label="FAQs" onPress={() => void openExternalLink(FAQ_URL, 'FAQs')} />
          <SettingsRow icon="mail-outline" label="Contact Support" onPress={() => void openSupportEmail()} />
          <SettingsRow icon="bug-outline" label="Report a Bug" onPress={() => void openBugReportEmail()} />
          <SettingsRow
            icon="sparkles-outline"
            label="Request a Feature"
            onPress={() => void openFeatureRequestEmail()}
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <SettingsRow
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => void openExternalLink(TERMS_URL, 'Terms of Service')}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => void openExternalLink(PRIVACY_URL, 'Privacy Policy')}
          />
        </View>

        <Pressable onPress={() => void handleSignOut()} style={({ pressed }) => [styles.signOutButton, pressed && styles.rowPressed]}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>

        <View style={styles.aboutCard}>
          <Text style={styles.aboutText}>User ID: {user?.id ?? 'Unavailable'}</Text>
          <Text style={styles.aboutText}>AutoLink v1.0 - Phase 1</Text>
          <Text style={styles.aboutHint}>Update FAQ / Terms / Privacy URLs before App Store submission.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.appBackground,
  },
  container: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.accentGreen,
  },
  subtitle: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 8,
    marginLeft: 2,
    color: theme.colors.accentGreen,
    fontWeight: '700',
    fontSize: 16,
  },
  row: {
    minHeight: 44,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowPressed: {
    transform: [{ scale: 0.985 }],
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowLabel: {
    color: theme.colors.textSubtle,
    fontSize: 15,
    fontWeight: '600',
  },
  aboutCard: {
    marginTop: 2,
    paddingHorizontal: 8,
  },
  signOutButton: {
    marginTop: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderDangerSoft,
    backgroundColor: theme.colors.surfaceDangerSoft,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  signOutText: {
    color: theme.colors.textDangerStrong,
    fontSize: 17,
    fontWeight: '700',
  },
  aboutText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  aboutHint: {
    marginTop: 6,
    color: theme.colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
});
