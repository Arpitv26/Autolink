import type { Session, User } from '@supabase/supabase-js';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';
import { ensureUserProfile } from '../lib/profile';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type UseAuthResult = {
  session: Session | null;
  user: User | null;
  initializing: boolean;
  profileSetupError: string | null;
  clearProfileSetupError: () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

type AuthProviderProps = {
  children: ReactNode;
};

const AUTH_CODE_PATTERN = /[?&]code=([^&]+)/;
const ACCESS_TOKEN_PATTERN = /[?#&]access_token=([^&]+)/;
const REFRESH_TOKEN_PATTERN = /[?#&]refresh_token=([^&]+)/;
const AUTH_ERROR_DESCRIPTION_PATTERN = /[?#&]error_description=([^&]+)/;

function getAuthCodeFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('code');
  } catch {
    const match = url.match(AUTH_CODE_PATTERN);
    if (!match?.[1]) return null;
    return decodeURIComponent(match[1]);
  }
}

function getTokensFromUrl(
  url: string
): { accessToken: string; refreshToken: string } | null {
  const accessTokenMatch = url.match(ACCESS_TOKEN_PATTERN);
  const refreshTokenMatch = url.match(REFRESH_TOKEN_PATTERN);

  if (!accessTokenMatch?.[1] || !refreshTokenMatch?.[1]) {
    return null;
  }

  return {
    accessToken: decodeURIComponent(accessTokenMatch[1]),
    refreshToken: decodeURIComponent(refreshTokenMatch[1]),
  };
}

function getAuthErrorFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const searchError = parsed.searchParams.get('error_description');
    if (searchError) return searchError;

    const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''));
    const hashError = hashParams.get('error_description');
    if (hashError) return hashError;
    return null;
  } catch {
    const match = url.match(AUTH_ERROR_DESCRIPTION_PATTERN);
    if (!match?.[1]) return null;
    return decodeURIComponent(match[1]);
  }
}

function buildOAuthRedirectUri(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.origin) {
    return `${window.location.origin}/auth/callback`;
  }

  // Native must include a callback path so it matches redirect allow-list rules.
  // - Expo Go: exp://.../--/auth/callback
  // - Dev build / standalone: autolink://auth/callback
  return makeRedirectUri({
    scheme: 'autolink',
    path: 'auth/callback',
    preferLocalhost: false,
  });
}

const AuthContext = createContext<UseAuthResult | null>(null);

function useProvideAuth(): UseAuthResult {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);
  const [profileSetupError, setProfileSetupError] = useState<string | null>(null);

  const syncUserProfile = useCallback(async (nextUser: User | null): Promise<void> => {
    if (!nextUser) {
      setProfileSetupError(null);
      return;
    }

    try {
      await ensureUserProfile(nextUser);
      setProfileSetupError(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not initialize your profile.';
      setProfileSetupError(message);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initSession = async (): Promise<void> => {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (error) {
        setSession(null);
        setUser(null);
      } else {
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
        await syncUserProfile(data.session?.user ?? null);
      }

      setInitializing(false);
    };

    void initSession();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        void syncUserProfile(nextSession?.user ?? null);
      }
    );

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [syncUserProfile]);

  const clearProfileSetupError = useCallback((): void => {
    setProfileSetupError(null);
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<void> => {
    const redirectTo = buildOAuthRedirectUri();
    if (__DEV__) {
      console.log('[auth] redirectTo', redirectTo);
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    const authUrl = data?.url;
    if (!authUrl) {
      throw new Error('Could not start Google sign-in. Please try again.');
    }
    if (!authUrl.includes('/auth/v1/authorize')) {
      throw new Error('Supabase returned an invalid OAuth URL. Check Supabase URL env config.');
    }
    if (__DEV__) {
      console.log('[auth] authUrl', authUrl);
    }

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo);

    if (result.type !== 'success' || !result.url) {
      if (result.type === 'cancel' || result.type === 'dismiss') {
        throw new Error('Google sign-in was cancelled.');
      }
      throw new Error('Google sign-in did not complete. Please try again.');
    }

    if (result.url.includes('.supabase.co')) {
      throw new Error(
        `OAuth callback stayed on Supabase. Configure redirect URL "${redirectTo}" and set Site URL to your app URL (not Supabase URL).`
      );
    }
    if (result.url.includes('localhost')) {
      throw new Error(
        `OAuth redirected to localhost. Set Supabase Site URL to a real app URL (for mobile: autolink://auth/callback).`
      );
    }

    const authError = getAuthErrorFromUrl(result.url);
    if (authError) {
      throw new Error(authError);
    }

    const code = getAuthCodeFromUrl(result.url);
    if (code) {
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        throw new Error(exchangeError.message);
      }
      return;
    }

    const tokens = getTokensFromUrl(result.url);
    if (!tokens) {
      throw new Error(
        `Google callback did not include a usable auth session. Verify Supabase redirect allow-list includes: ${redirectTo}`
      );
    }

    const { error: setSessionError } = await supabase.auth.setSession({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });
    if (setSessionError) {
      throw new Error(setSessionError.message);
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut();
  }, []);

  return useMemo(
    () => ({
      session,
      user,
      initializing,
      profileSetupError,
      clearProfileSetupError,
      signInWithGoogle,
      signOut,
    }),
    [
      clearProfileSetupError,
      initializing,
      profileSetupError,
      session,
      signInWithGoogle,
      signOut,
      user,
    ]
  );
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useProvideAuth();
  return React.createElement(AuthContext.Provider, { value: auth }, children);
}

export function useAuth(): UseAuthResult {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error('useAuth must be used within AuthProvider.');
  }
  return auth;
}
