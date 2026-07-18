import type { User } from '@supabase/supabase-js';
import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getOnboardingSnapshot,
  type OnboardingSnapshot,
} from '../lib/onboarding';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

type ProfileCompletionRow = {
  display_name: string | null;
};

type OnboardingContextValue = OnboardingSnapshot & {
  loading: boolean;
  error: string | null;
  refresh: () => Promise<OnboardingSnapshot>;
};

type OnboardingProviderProps = {
  children: ReactNode;
};

const EMPTY_SNAPSHOT: OnboardingSnapshot = {
  profileComplete: false,
  garageComplete: false,
  complete: false,
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

async function loadSnapshot(user: User | null): Promise<OnboardingSnapshot> {
  if (!user) return EMPTY_SNAPSHOT;

  const [profileResult, vehicleResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle<ProfileCompletionRow>(),
    supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ]);

  if (profileResult.error || vehicleResult.error) {
    throw new Error('Could not check your setup progress.');
  }

  return getOnboardingSnapshot(
    profileResult.data?.display_name,
    vehicleResult.count ?? 0
  );
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { user, initializing: authInitializing } = useAuth();
  const [snapshot, setSnapshot] = useState<OnboardingSnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<OnboardingSnapshot> => {
    if (authInitializing) {
      return EMPTY_SNAPSHOT;
    }

    setLoading(true);
    setError(null);

    try {
      const nextSnapshot = await loadSnapshot(user);
      setSnapshot(nextSnapshot);
      return nextSnapshot;
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : 'Could not check your setup progress.'
      );
      return EMPTY_SNAPSHOT;
    } finally {
      setLoading(false);
    }
  }, [authInitializing, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      ...snapshot,
      loading: authInitializing || loading,
      error,
      refresh,
    }),
    [authInitializing, error, loading, refresh, snapshot]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider.');
  }
  return context;
}
