import type { User } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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
  error: string | null;
  success: string | null;
  setDisplayName: (value: string) => void;
  setPronouns: (value: string) => void;
  setBio: (value: string) => void;
  setAvatarUrl: (value: string) => void;
  save: () => Promise<void>;
  refresh: () => Promise<void>;
};

export function useProfileDataForm(user: User | null): UseProfileDataFormResult {
  const [displayName, setDisplayName] = useState<string>('');
  const [pronouns, setPronouns] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
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
    error,
    success,
    setDisplayName,
    setPronouns,
    setBio,
    setAvatarUrl,
    save,
    refresh,
  };
}
