import { useCallback, useEffect, useState } from 'react';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type UseAuthResult = {
  session: Session | null;
  user: User | null;
  initializing: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AUTH_CODE_PATTERN = /[?&]code=([^&]+)/;

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

export function useAuth(): UseAuthResult {
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
      }

      setInitializing(false);
    };

    void initSession();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
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
    if (!code) {
      throw new Error('Missing auth code from Google callback.');
    }

    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      throw new Error(exchangeError.message);
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut();
  }, []);

  return { session, user, initializing, signInWithGoogle, signOut };
}
