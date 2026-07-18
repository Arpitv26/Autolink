import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

export type ProfilePostSummary = {
  id: string;
  caption: string;
  imageUrl: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
};

type PostSummaryRow = {
  id: string;
  caption: string | null;
  image_urls: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
};

type LikeRow = {
  post_id: string;
};

type UseProfileFeedSectionsResult = {
  posts: ProfilePostSummary[];
  favorites: ProfilePostSummary[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

function mapPost(row: PostSummaryRow): ProfilePostSummary {
  return {
    id: row.id,
    caption: row.caption ?? '',
    imageUrl: row.image_urls?.[0] ?? '',
    likesCount: row.likes_count,
    commentsCount: row.comments_count,
    createdAt: row.created_at,
  };
}

export function useProfileFeedSections(
  userId: string | null
): UseProfileFeedSectionsResult {
  const [posts, setPosts] = useState<ProfilePostSummary[]>([]);
  const [favorites, setFavorites] = useState<ProfilePostSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (!userId) {
      setPosts([]);
      setFavorites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const [postsResult, likesResult] = await Promise.all([
      supabase
        .from('posts')
        .select('id, caption, image_urls, likes_count, comments_count, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30)
        .returns<PostSummaryRow[]>(),
      supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30)
        .returns<LikeRow[]>(),
    ]);

    if (postsResult.error || likesResult.error) {
      setError('Could not load profile posts.');
      setLoading(false);
      return;
    }

    const favoriteIds = (likesResult.data ?? []).map((like) => like.post_id);
    let favoriteRows: PostSummaryRow[] = [];

    if (favoriteIds.length > 0) {
      const { data, error: favoritesError } = await supabase
        .from('posts')
        .select('id, caption, image_urls, likes_count, comments_count, created_at')
        .in('id', favoriteIds)
        .returns<PostSummaryRow[]>();

      if (favoritesError) {
        setError('Could not load favorite posts.');
        setLoading(false);
        return;
      }

      const orderById = new Map(favoriteIds.map((id, index) => [id, index]));
      favoriteRows = [...(data ?? [])].sort(
        (left, right) =>
          (orderById.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
          (orderById.get(right.id) ?? Number.MAX_SAFE_INTEGER)
      );
    }

    setPosts((postsResult.data ?? []).map(mapPost));
    setFavorites(favoriteRows.map(mapPost));
    setLoading(false);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return undefined;
    }, [refresh])
  );

  return { posts, favorites, loading, error, refresh };
}
