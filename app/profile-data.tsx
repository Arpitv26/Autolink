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
          <Ionicons name="arrow-back" size={20} color="#334155" />
        </Pressable>

        <Text style={styles.title}>Data & Personal Info</Text>
        <Text style={styles.subtitle}>Manage your standard profile information.</Text>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#0F172A" />
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
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />

            <Text style={styles.label}>Pronouns (optional)</Text>
            <TextInput
              value={pronouns}
              onChangeText={setPronouns}
              placeholder="e.g. she/her, he/him, they/them"
              placeholderTextColor="#94A3B8"
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
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>Save Changes</Text>}
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
    backgroundColor: '#F2F4F7',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 14,
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 14,
    color: '#64748B',
    fontSize: 14,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#334155',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  label: {
    marginBottom: 6,
    marginTop: 4,
    color: '#1F2937',
    fontWeight: '600',
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
  },
  inputReadOnly: {
    backgroundColor: '#F8FAFC',
    color: '#475569',
  },
  saveButton: {
    marginTop: 14,
    backgroundColor: '#0B1635',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.55,
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  errorText: {
    marginTop: 10,
    color: '#B91C1C',
  },
  successText: {
    marginTop: 10,
    color: '#166534',
  },
  buttonPressed: {
    transform: [{ scale: 0.985 }],
  },
});
