import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useProfileDataForm } from '../hooks/useProfileDataForm';
import { theme } from '../lib/theme';

export default function ProfileDataScreen() {
  const { user } = useAuth();
  const {
    displayName,
    pronouns,
    bio,
    avatarUrl,
    username,
    loading,
    saving,
    avatarUploading,
    error,
    success,
    setDisplayName,
    setPronouns,
    setBio,
    pickAvatarFromLibrary,
    save,
  } = useProfileDataForm(user);

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
          <Ionicons name="arrow-back" size={20} color={theme.colors.accentGreen} />
        </Pressable>

        <Text style={styles.title}>Edit Profile</Text>
        <Text style={styles.subtitle}>Manage your public profile information.</Text>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={theme.colors.accentGreen} />
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

            <Text style={styles.label}>Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell people about your build style"
              placeholderTextColor={theme.colors.textSignInHelper}
              style={[styles.input, styles.inputMultiline]}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Text style={styles.label}>Profile Photo</Text>
            <View style={styles.avatarPickerRow}>
              <View style={styles.avatarPreviewCircle}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarPreviewImage} />
                ) : (
                  <Ionicons name="person-outline" size={22} color={theme.colors.accentGreenMuted} />
                )}
              </View>
              <View style={styles.avatarPickerCopy}>
                <Text style={styles.avatarPickerTitle}>Choose from camera roll</Text>
                <Text style={styles.avatarPickerHint}>Square photos look best.</Text>
              </View>
            </View>
            <Pressable
              onPress={() => void pickAvatarFromLibrary()}
              disabled={loading || saving || avatarUploading}
              style={({ pressed }) => [
                styles.avatarPickButton,
                (loading || saving || avatarUploading) && styles.saveButtonDisabled,
                pressed && styles.buttonPressed,
              ]}
            >
              {avatarUploading ? (
                <ActivityIndicator color={theme.colors.textInverse} />
              ) : (
                <Text style={styles.avatarPickButtonText}>Choose Photo</Text>
              )}
            </Pressable>

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
          onPress={() => void save()}
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
    color: theme.colors.accentGreen,
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
    color: theme.colors.accentGreen,
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
    color: theme.colors.accentGreen,
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
    color: theme.colors.accentGreen,
  },
  inputReadOnly: {
    backgroundColor: theme.colors.surfaceMuted,
    color: theme.colors.accentGreen,
  },
  inputMultiline: {
    minHeight: 80,
  },
  avatarPickerRow: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderInput,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceMuted,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarPreviewCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPreviewImage: {
    width: '100%',
    height: '100%',
  },
  avatarPickerCopy: {
    flex: 1,
  },
  avatarPickerTitle: {
    color: theme.colors.accentGreen,
    fontWeight: '700',
    fontSize: 14,
  },
  avatarPickerHint: {
    marginTop: 2,
    color: theme.colors.accentGreenMuted,
    fontSize: 12,
  },
  avatarPickButton: {
    marginBottom: 8,
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: 10,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPickButtonText: {
    color: theme.colors.textInverse,
    fontWeight: '700',
    fontSize: 14,
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
