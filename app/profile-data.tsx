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
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { theme } from '../lib/theme';

type ProfileRow = {
  display_name: string | null;
  username: string;
};

export default function ProfileDataScreen() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string>('');
  const [pronouns, setPronouns] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async (): Promise<void> => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', user.id)
      .maybeSingle<ProfileRow>();

    if (profileError) {
      setError('Could not load profile data.');
      setLoading(false);
      return;
    }

    setDisplayName(data?.display_name ?? '');
    setUsername(data?.username ?? '');
    setPronouns(
      typeof user.user_metadata?.pronouns === 'string' ? user.user_metadata.pronouns : ''
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSave = useCallback(async (): Promise<void> => {
    if (!user) {
      setError('No active user session.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const trimmedName = displayName.trim();
    const trimmedPronouns = pronouns.trim();

    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        display_name: trimmedName.length > 0 ? trimmedName : null,
      })
      .eq('id', user.id);

    if (updateProfileError) {
      setSaving(false);
      setError('Could not save profile details.');
      return;
    }

    const { error: updateUserError } = await supabase.auth.updateUser({
      data: {
        pronouns: trimmedPronouns.length > 0 ? trimmedPronouns : null,
      },
    });

    if (updateUserError) {
      setSaving(false);
      setError('Saved name, but could not save pronouns.');
      return;
    }

    setSaving(false);
    setSuccess('Profile details saved.');
  }, [displayName, pronouns, user]);

  const handleBack = useCallback((): void => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/profile');
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
        >
          <Ionicons name="arrow-back" size={20} color={theme.colors.textSlate} />
        </Pressable>

        <Text style={styles.title}>Data & Personal Info</Text>
        <Text style={styles.subtitle}>Manage your standard profile information.</Text>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={theme.colors.textHeading} />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={user?.email ?? ''}
              editable={false}
              style={[styles.input, styles.inputReadOnly]}
            />

            <Text style={styles.label}>Username</Text>
            <TextInput
              value={username}
              editable={false}
              style={[styles.input, styles.inputReadOnly]}
            />

            <Text style={styles.label}>Name</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your name"
              placeholderTextColor={theme.colors.textSignInHelper}
              style={styles.input}
            />

            <Text style={styles.label}>Pronouns (optional)</Text>
            <TextInput
              value={pronouns}
              onChangeText={setPronouns}
              placeholder="e.g. she/her, he/him, they/them"
              placeholderTextColor={theme.colors.textSignInHelper}
              style={styles.input}
            />
          </View>
        )}

        <Pressable
          onPress={() => void handleSave()}
          disabled={loading || saving}
          style={({ pressed }) => [
            styles.saveButton,
            (loading || saving) && styles.saveButtonDisabled,
            pressed && styles.buttonPressed,
          ]}
        >
          {saving ? (
            <ActivityIndicator color={theme.colors.textInverse} />
          ) : (
            <Text style={styles.saveText}>Save Changes</Text>
          )}
        </Pressable>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{success}</Text> : null}
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 34,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 14,
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.textHeading,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 14,
    color: theme.colors.textHint,
    fontSize: 14,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: theme.colors.textSlate,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderInput,
  },
  label: {
    marginBottom: 6,
    marginTop: 4,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderInput,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
    color: theme.colors.textHeading,
  },
  inputReadOnly: {
    backgroundColor: theme.colors.surfaceMuted,
    color: theme.colors.textFieldReadOnly,
  },
  saveButton: {
    marginTop: 14,
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.55,
  },
  saveText: {
    color: theme.colors.textInverse,
    fontWeight: '700',
  },
  errorText: {
    marginTop: 10,
    color: theme.colors.textDanger,
  },
  successText: {
    marginTop: 10,
    color: theme.colors.textSuccess,
  },
  buttonPressed: {
    transform: [{ scale: 0.985 }],
  },
});
