import type { User } from '@supabase/supabase-js';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { FeedAuthor, FeedPost, FeedVehicle } from '../types/feed';

const PAGE_SIZE = 10;

type PostRow = {
  id: string;
  user_id: string;
  vehicle_id: string | null;
  caption: string | null;
  image_urls: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
};

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type LikeRow = {
  post_id: string;
};

type FollowRow = {
  following_id: string;
};

type VehicleRow = {
  id: string;
  make: string;
  model: string;
  year: number;
};

type UseFeedResult = {
  posts: FeedPost[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  toggleFollow: (authorId: string) => Promise<void>;
};

function fallbackAuthor(userId: string): FeedAuthor {
  return {
    id: userId,
    username: 'driver',
    displayName: 'AutoLink Driver',
    avatarUrl: '',
  };
}

async function hydratePosts(rows: PostRow[], user: User | null): Promise<FeedPost[]> {
  if (rows.length === 0) return [];

  const authorIds = [...new Set(rows.map((row) => row.user_id))];
  const postIds = rows.map((row) => row.id);
  const vehicleIds = [
    ...new Set(
      rows
        .map((row) => row.vehicle_id)
        .filter((vehicleId): vehicleId is string => Boolean(vehicleId))
    ),
  ];

  const profilePromise = supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', authorIds)
    .returns<ProfileRow[]>();

  const likesPromise = user
    ? supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds)
        .returns<LikeRow[]>()
    : Promise.resolve({ data: [] as LikeRow[], error: null });

  const followsPromise = user
    ? supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .in('following_id', authorIds)
        .returns<FollowRow[]>()
    : Promise.resolve({ data: [] as FollowRow[], error: null });

  const vehiclesPromise =
    vehicleIds.length > 0
      ? supabase
          .from('vehicles')
          .select('id, make, model, year')
          .in('id', vehicleIds)
          .returns<VehicleRow[]>()
      : Promise.resolve({ data: [] as VehicleRow[], error: null });

  const [profilesResult, likesResult, followsResult, vehiclesResult] = await Promise.all([
    profilePromise,
    likesPromise,
    followsPromise,
    vehiclesPromise,
  ]);

  if (
    profilesResult.error ||
    likesResult.error ||
    followsResult.error ||
    vehiclesResult.error
  ) {
    throw new Error('Could not load feed details.');
  }

  const authors = new Map<string, FeedAuthor>(
    (profilesResult.data ?? []).map((profile) => [
      profile.id,
      {
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name?.trim() || profile.username,
        avatarUrl: profile.avatar_url ?? '',
      },
    ])
  );
  const likedPostIds = new Set((likesResult.data ?? []).map((like) => like.post_id));
  const followedAuthorIds = new Set(
    (followsResult.data ?? []).map((follow) => follow.following_id)
  );
  const vehicles = new Map<string, FeedVehicle>(
    (vehiclesResult.data ?? []).map((vehicle) => [
      vehicle.id,
      {
        id: vehicle.id,
        label: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      },
    ])
  );

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    caption: row.caption ?? '',
    imageUrls: row.image_urls ?? [],
    likesCount: row.likes_count,
    commentsCount: row.comments_count,
    createdAt: row.created_at,
    author: authors.get(row.user_id) ?? fallbackAuthor(row.user_id),
    vehicle: row.vehicle_id ? (vehicles.get(row.vehicle_id) ?? null) : null,
    likedByCurrentUser: likedPostIds.has(row.id),
    followedByCurrentUser: followedAuthorIds.has(row.user_id),
  }));
}

export function useFeed(user: User | null): UseFeedResult {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const loadPage = useCallback(
    async (nextPage: number, replace: boolean): Promise<void> => {
      if (replace) {
        setRefreshing(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const from = nextPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error: postsError } = await supabase
        .from('posts')
        .select(
          'id, user_id, vehicle_id, caption, image_urls, likes_count, comments_count, created_at'
        )
        .order('created_at', { ascending: false })
        .range(from, to)
        .returns<PostRow[]>();

      try {
        if (postsError) throw postsError;
        const hydrated = await hydratePosts(data ?? [], user);

        setPosts((current) => {
          if (replace) return hydrated;
          const existingIds = new Set(current.map((post) => post.id));
          return [...current, ...hydrated.filter((post) => !existingIds.has(post.id))];
        });
        setPage(nextPage);
        setHasMore((data ?? []).length === PAGE_SIZE);
      } catch {
        setError('Could not load the community feed.');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [user]
  );

  const refresh = useCallback(async (): Promise<void> => {
    await loadPage(0, true);
  }, [loadPage]);

  const loadMore = useCallback(async (): Promise<void> => {
    if (loading || refreshing || loadingMore || !hasMore) return;
    await loadPage(page + 1, false);
  }, [hasMore, loadPage, loading, loadingMore, page, refreshing]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return undefined;
    }, [refresh])
  );

  const toggleLike = useCallback(
    async (postId: string): Promise<void> => {
      if (!user) return;
      const target = posts.find((post) => post.id === postId);
      if (!target) return;

      const nextLiked = !target.likedByCurrentUser;
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? {
                ...post,
                likedByCurrentUser: nextLiked,
                likesCount: Math.max(0, post.likesCount + (nextLiked ? 1 : -1)),
              }
            : post
        )
      );

      const result = nextLiked
        ? await supabase.from('likes').insert({ post_id: postId, user_id: user.id })
        : await supabase
            .from('likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', user.id);

      if (result.error) {
        setPosts((current) =>
          current.map((post) => (post.id === postId ? target : post))
        );
        setError('Could not update this like.');
      }
    },
    [posts, user]
  );

  const toggleFollow = useCallback(
    async (authorId: string): Promise<void> => {
      if (!user || user.id === authorId) return;
      const authorPost = posts.find((post) => post.userId === authorId);
      if (!authorPost) return;

      const nextFollowed = !authorPost.followedByCurrentUser;
      setPosts((current) =>
        current.map((post) =>
          post.userId === authorId
            ? { ...post, followedByCurrentUser: nextFollowed }
            : post
        )
      );

      const result = nextFollowed
        ? await supabase
            .from('follows')
            .insert({ follower_id: user.id, following_id: authorId })
        : await supabase
            .from('follows')
            .delete()
            .eq('follower_id', user.id)
            .eq('following_id', authorId);

      if (result.error) {
        setPosts((current) =>
          current.map((post) =>
            post.userId === authorId
              ? { ...post, followedByCurrentUser: !nextFollowed }
              : post
          )
        );
        setError('Could not update this follow.');
      }
    },
    [posts, user]
  );

  return {
    posts,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    refresh,
    loadMore,
    toggleLike,
    toggleFollow,
  };
}
