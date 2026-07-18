import type { User } from '@supabase/supabase-js';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { FeedAuthor, FeedComment } from '../types/feed';

type CommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type UsePostCommentsResult = {
  comments: FeedComment[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addComment: (content: string, parentId?: string | null) => Promise<boolean>;
  deleteComment: (commentId: string) => Promise<void>;
};

function defaultAuthor(userId: string): FeedAuthor {
  return {
    id: userId,
    username: 'driver',
    displayName: 'AutoLink Driver',
    avatarUrl: '',
  };
}

export function usePostComments(
  postId: string,
  user: User | null
): UsePostCommentsResult {
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (!postId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: commentsError } = await supabase
      .from('comments')
      .select('id, post_id, user_id, parent_id, content, created_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .returns<CommentRow[]>();

    if (commentsError) {
      setError('Could not load comments.');
      setLoading(false);
      return;
    }

    const rows = data ?? [];
    const authorIds = [...new Set(rows.map((comment) => comment.user_id))];
    let authors = new Map<string, FeedAuthor>();

    if (authorIds.length > 0) {
      const { data: profileRows, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', authorIds)
        .returns<ProfileRow[]>();

      if (profilesError) {
        setError('Could not load comment authors.');
        setLoading(false);
        return;
      }

      authors = new Map(
        (profileRows ?? []).map((profile) => [
          profile.id,
          {
            id: profile.id,
            username: profile.username,
            displayName: profile.display_name?.trim() || profile.username,
            avatarUrl: profile.avatar_url ?? '',
          },
        ])
      );
    }

    setComments(
      rows.map((comment) => ({
        id: comment.id,
        postId: comment.post_id,
        userId: comment.user_id,
        parentId: comment.parent_id,
        content: comment.content,
        createdAt: comment.created_at,
        author: authors.get(comment.user_id) ?? defaultAuthor(comment.user_id),
      }))
    );
    setLoading(false);
  }, [postId]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return undefined;
    }, [refresh])
  );

  const addComment = useCallback(
    async (content: string, parentId: string | null = null): Promise<boolean> => {
      if (!user) {
        setError('Sign in before commenting.');
        return false;
      }

      const trimmed = content.trim();
      if (!trimmed) {
        setError('Write a comment first.');
        return false;
      }

      setSubmitting(true);
      setError(null);
      const { error: insertError } = await supabase.from('comments').insert({
        post_id: postId,
        user_id: user.id,
        parent_id: parentId,
        content: trimmed,
      });

      if (insertError) {
        setError('Could not post this comment.');
        setSubmitting(false);
        return false;
      }

      await refresh();
      setSubmitting(false);
      return true;
    },
    [postId, refresh, user]
  );

  const deleteComment = useCallback(
    async (commentId: string): Promise<void> => {
      if (!user) return;
      const previous = comments;
      setComments((current) => current.filter((comment) => comment.id !== commentId));

      const { error: deleteError } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (deleteError) {
        setComments(previous);
        setError('Could not delete this comment.');
      }
    },
    [comments, user]
  );

  return {
    comments,
    loading,
    submitting,
    error,
    refresh,
    addComment,
    deleteComment,
  };
}
