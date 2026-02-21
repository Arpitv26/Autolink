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
import { ensureUserProfile } from '../lib/profile';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type UseAuthResult = {
  session: Session | null;
  user: User | null;
  initializing: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

type AuthProviderProps = {
  children: ReactNode;
};

const AUTH_CODE_PATTERN = /[?&]code=([^&]+)/;
const ACCESS_TOKEN_PATTERN = /[?#&]access_token=([^&]+)/;
const REFRESH_TOKEN_PATTERN = /[?#&]refresh_token=([^&]+)/;

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

const AuthContext = createContext<UseAuthResult | null>(null);

function useProvideAuth(): UseAuthResult {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);

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
        if (data.session?.user) {
          void ensureUserProfile(data.session.user).catch(() => {});
        }
      }

      setInitializing(false);
    };

    void initSession();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        if (nextSession?.user) {
          void ensureUserProfile(nextSession.user).catch(() => {});
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<void> => {
    const redirectTo = makeRedirectUri({ path: 'auth/callback' });

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

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo);

    if (result.type !== 'success' || !result.url) {
      if (result.type === 'cancel' || result.type === 'dismiss') {
        throw new Error('Google sign-in was cancelled.');
      }
      throw new Error('Google sign-in did not complete. Please try again.');
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
      throw new Error('Google callback did not include a usable auth session.');
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
    () => ({ session, user, initializing, signInWithGoogle, signOut }),
    [initializing, session, signInWithGoogle, signOut, user]
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
