import type { User } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type ProfileIdentityRow = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type UseProfileIdentityResult = {
  username: string;
  displayName: string;
  avatarUrl: string;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useProfileIdentity(user: User | null): UseProfileIdentityResult {
  const [username, setUsername] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (!user) {
      setUsername('');
      setDisplayName('');
      setAvatarUrl('');
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle<ProfileIdentityRow>();

    if (queryError) {
      setError('Could not load profile.');
      setLoading(false);
      return;
    }

    setUsername(data?.username ?? '');
    setDisplayName(data?.display_name ?? '');
    setAvatarUrl(data?.avatar_url ?? '');
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    username,
    displayName,
    avatarUrl,
    loading,
    error,
    refresh,
  };
}
