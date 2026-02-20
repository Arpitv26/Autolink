import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

function sanitizeUsername(input: string): string {
  const cleaned = input.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  return cleaned.replace(/^_+|_+$/g, '').slice(0, 24);
}

function buildBaseUsername(user: User): string {
  const metadataCandidate =
    typeof user.user_metadata?.user_name === 'string'
      ? user.user_metadata.user_name
      : typeof user.user_metadata?.preferred_username === 'string'
        ? user.user_metadata.preferred_username
        : typeof user.email === 'string'
          ? user.email.split('@')[0]
          : '';

  const fromMetadata = sanitizeUsername(metadataCandidate);
  if (fromMetadata.length > 0) {
    return fromMetadata;
  }

  return `user_${user.id.slice(0, 8)}`;
}

export async function ensureUserProfile(user: User): Promise<void> {
  const baseUsername = buildBaseUsername(user);
  const displayName =
    typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === 'string'
        ? user.user_metadata.name
        : null;

  const firstAttempt = await supabase.from('profiles').upsert(
    {
      id: user.id,
      username: baseUsername,
      display_name: displayName,
      avatar_url:
        typeof user.user_metadata?.avatar_url === 'string'
          ? user.user_metadata.avatar_url
          : null,
    },
    {
      onConflict: 'id',
      ignoreDuplicates: true,
    }
  );

  if (!firstAttempt.error) {
    return;
  }

  // If username collides, retry with a deterministic suffix.
  const fallbackUsername = `${baseUsername.slice(0, 16)}_${user.id.slice(0, 6)}`;

  const secondAttempt = await supabase.from('profiles').upsert(
    {
    id: user.id,
    username: fallbackUsername,
    display_name: displayName,
    avatar_url:
      typeof user.user_metadata?.avatar_url === 'string'
        ? user.user_metadata.avatar_url
        : null,
    },
    {
      onConflict: 'id',
      ignoreDuplicates: true,
    }
  );

  if (secondAttempt.error) {
    throw new Error('Could not create profile record. Please run database setup SQL.');
  }
}
