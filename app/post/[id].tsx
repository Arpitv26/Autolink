import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { usePostComments } from '../../hooks/usePostComments';
import { theme } from '../../lib/theme';
import type { FeedComment } from '../../types/feed';

export default function PostCommentsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const postId = typeof params.id === 'string' ? params.id : '';
  const { user } = useAuth();
  const { comments, loading, submitting, error, refresh, addComment, deleteComment } =
    usePostComments(postId, user);
  const [content, setContent] = useState<string>('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  const replyingTo = useMemo(
    () => comments.find((comment) => comment.id === replyingToId) ?? null,
    [comments, replyingToId]
  );

  const handleSubmit = useCallback(async (): Promise<void> => {
    const created = await addComment(content, replyingToId);
    if (created) {
      setContent('');
      setReplyingToId(null);
    }
  }, [addComment, content, replyingToId]);

  const renderComment = ({ item }: { item: FeedComment }) => {
    const isReply = Boolean(item.parentId);
    const isOwner = item.userId === user?.id;

    return (
      <View style={[styles.commentRow, isReply && styles.replyRow]}>
        <View style={styles.avatar}>
          {item.author.avatarUrl ? (
            <Image source={item.author.avatarUrl} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <Text style={styles.avatarText}>
              {item.author.displayName.slice(0, 2).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.commentBody}>
          <View style={styles.commentHeader}>
            <Text style={styles.author}>{item.author.displayName}</Text>
            <Text style={styles.handle}>@{item.author.username}</Text>
          </View>
          <Text style={styles.content}>{item.content}</Text>
          <View style={styles.commentActions}>
            <Pressable onPress={() => setReplyingToId(item.id)}>
              <Text style={styles.replyAction}>Reply</Text>
            </Pressable>
            {isOwner ? (
              <Pressable onPress={() => void deleteComment(item.id)}>
                <Text style={styles.deleteAction}>Delete</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={19} color={theme.colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Comments</Text>
          <Pressable
            onPress={() => void refresh()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Ionicons name="refresh" size={18} color={theme.colors.accentGreenMuted} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.colors.brandPrimary} />
          </View>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={renderComment}
            contentContainerStyle={[
              styles.list,
              comments.length === 0 && styles.emptyList,
            ]}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={38}
                  color={theme.colors.iconSubtle}
                />
                <Text style={styles.emptyTitle}>Start the conversation</Text>
                <Text style={styles.emptyBody}>Ask a question or share feedback on this build.</Text>
              </View>
            }
          />
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {replyingTo ? (
          <View style={styles.replyBanner}>
            <Text style={styles.replyBannerText}>Replying to {replyingTo.author.displayName}</Text>
            <Pressable onPress={() => setReplyingToId(null)}>
              <Ionicons name="close" size={17} color={theme.colors.textSecondary} />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.composer}>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder={replyingTo ? 'Write a reply…' : 'Add a comment…'}
            placeholderTextColor={theme.colors.textPlaceholder}
            style={styles.input}
            multiline
            maxLength={1000}
          />
          <Pressable
            onPress={() => void handleSubmit()}
            disabled={submitting || content.trim().length === 0}
            style={({ pressed }) => [
              styles.sendButton,
              (submitting || content.trim().length === 0) && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={theme.colors.textIconDark} />
            ) : (
              <Ionicons name="arrow-up" size={18} color={theme.colors.textIconDark} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.appBackground,
  },
  flex: {
    flex: 1,
  },
  header: {
    minHeight: 58,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
  },
  title: {
    color: theme.colors.textHeading,
    fontSize: 18,
    fontWeight: '800',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 16,
    gap: 14,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    marginTop: 10,
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  emptyBody: {
    marginTop: 5,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  commentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  replyRow: {
    marginLeft: 36,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.borderMuted,
  },
  avatar: {
    width: 36,
    height: 36,
    overflow: 'hidden',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.brandAvatar,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: theme.colors.textInverse,
    fontSize: 11,
    fontWeight: '800',
  },
  commentBody: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.surface,
    padding: 11,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  author: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  handle: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  content: {
    marginTop: 5,
    color: theme.colors.textSlate,
    fontSize: 14,
    lineHeight: 19,
  },
  commentActions: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 16,
  },
  replyAction: {
    color: theme.colors.accentGreenMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  deleteAction: {
    color: theme.colors.textDanger,
    fontSize: 12,
    fontWeight: '700',
  },
  replyBanner: {
    minHeight: 34,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceBrand,
  },
  replyBannerText: {
    color: theme.colors.accentGreenMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  composer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.surface,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    minHeight: 42,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.borderInput,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 13,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.brandPrimary,
  },
  error: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    color: theme.colors.textDanger,
    fontSize: 12,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },
});
