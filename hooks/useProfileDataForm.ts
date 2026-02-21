import type { User } from '@supabase/supabase-js';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AVATAR_BUCKET = 'avatars';

type ProfileRow = {
  display_name: string | null;
  username: string;
  avatar_url: string | null;
};

type UseProfileDataFormResult = {
  displayName: string;
  pronouns: string;
  bio: string;
  avatarUrl: string;
  username: string;
  loading: boolean;
  saving: boolean;
  avatarUploading: boolean;
  error: string | null;
  success: string | null;
  setDisplayName: (value: string) => void;
  setPronouns: (value: string) => void;
  setBio: (value: string) => void;
  pickAvatarFromLibrary: () => Promise<void>;
  save: () => Promise<void>;
  refresh: () => Promise<void>;
};

function getFileExtension(asset: ImagePicker.ImagePickerAsset): string {
  const byName = asset.fileName?.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
  if (byName) return byName;

  const byUri = asset.uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/)?.[1]?.toLowerCase();
  if (byUri) return byUri;

  return 'jpg';
}

function getContentType(asset: ImagePicker.ImagePickerAsset, extension: string): string {
  if (asset.mimeType) return asset.mimeType;

  switch (extension) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    default:
      return 'image/jpeg';
  }
}

export function useProfileDataForm(user: User | null): UseProfileDataFormResult {
  const [displayName, setDisplayName] = useState<string>('');
  const [pronouns, setPronouns] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [avatarUploading, setAvatarUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (!user) {
      setLoading(false);
      setError('No active user session.');
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('display_name, username, avatar_url')
      .eq('id', user.id)
      .maybeSingle<ProfileRow>();

    if (profileError) {
      setError('Could not load profile data.');
      setLoading(false);
      return;
    }

    setDisplayName(data?.display_name ?? '');
    setUsername(data?.username ?? '');
    setAvatarUrl(data?.avatar_url ?? '');
    setPronouns(
      typeof user.user_metadata?.pronouns === 'string' ? user.user_metadata.pronouns : ''
    );
    setBio(typeof user.user_metadata?.bio === 'string' ? user.user_metadata.bio : '');
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pickAvatarFromLibrary = useCallback(async (): Promise<void> => {
    if (!user) {
      setError('No active user session.');
      return;
    }

    setError(null);
    setSuccess(null);

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      setError('Photo access is required to choose a profile picture.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
      selectionLimit: 1,
    });

    if (pickerResult.canceled || pickerResult.assets.length === 0) {
      return;
    }

    const selectedAsset = pickerResult.assets[0];
    const extension = getFileExtension(selectedAsset);
    const contentType = getContentType(selectedAsset, extension);
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).slice(2, 10);
    const filePath = `${user.id}/${timestamp}-${randomSuffix}.${extension}`;

    setAvatarUploading(true);

    try {
      const fileResponse = await fetch(selectedAsset.uri);
      const fileBuffer = await fileResponse.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(filePath, fileBuffer, {
          cacheControl: '3600',
          contentType,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(
          'Could not upload image. Ensure the "avatars" storage bucket exists and allows uploads.'
        );
      }

      const { data: publicUrlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error('Could not generate public URL for selected image.');
      }

      setAvatarUrl(publicUrlData.publicUrl);
      setSuccess('Profile photo selected. Tap Save Changes to apply.');
    } catch (uploadErr) {
      setError(
        uploadErr instanceof Error ? uploadErr.message : 'Could not use selected profile photo.'
      );
    } finally {
      setAvatarUploading(false);
    }
  }, [user]);

  const save = useCallback(async (): Promise<void> => {
    if (!user) {
      setError('No active user session.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const trimmedName = displayName.trim();
    const trimmedPronouns = pronouns.trim();
    const trimmedBio = bio.trim();
    const trimmedAvatarUrl = avatarUrl.trim();

    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        display_name: trimmedName.length > 0 ? trimmedName : null,
        avatar_url: trimmedAvatarUrl.length > 0 ? trimmedAvatarUrl : null,
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
        bio: trimmedBio.length > 0 ? trimmedBio : null,
      },
    });

    if (updateUserError) {
      setSaving(false);
      setError('Saved name, but could not save pronouns.');
      return;
    }

    setSaving(false);
    setSuccess('Profile details saved.');
  }, [avatarUrl, bio, displayName, pronouns, user]);

  return {
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
    refresh,
  };
}
