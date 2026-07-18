import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { theme } from '../../lib/theme';
import type { FeedPost } from '../../types/feed';

type PostCardProps = {
  post: FeedPost;
  currentUserId: string | null;
  onToggleLike: (postId: string) => void;
  onToggleFollow: (authorId: string) => void;
};

function formatPostDate(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function PostCard({
  post,
  currentUserId,
  onToggleLike,
  onToggleFollow,
}: PostCardProps) {
  const { width } = useWindowDimensions();
  const imageWidth = Math.max(240, width - 32);
  const isOwnPost = currentUserId === post.userId;
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  const openComments = (): void => {
    router.push({ pathname: '/post/[id]', params: { id: post.id } });
  };

  const handleImageScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ): void => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / imageWidth);
    setActiveImageIndex(Math.max(0, Math.min(post.imageUrls.length - 1, nextIndex)));
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.authorRow}>
          <View style={styles.avatar}>
            {post.author.avatarUrl ? (
              <Image source={post.author.avatarUrl} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <Text style={styles.avatarText}>
                {post.author.displayName.slice(0, 2).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.authorCopy}>
            <Text style={styles.authorName}>{post.author.displayName}</Text>
            <Text style={styles.authorMeta}>
              @{post.author.username} · {formatPostDate(post.createdAt)}
            </Text>
          </View>
        </View>

        {!isOwnPost ? (
          <Pressable
            onPress={() => onToggleFollow(post.userId)}
            style={({ pressed }) => [
              styles.followButton,
              post.followedByCurrentUser && styles.followButtonActive,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.followText,
                post.followedByCurrentUser && styles.followTextActive,
              ]}
            >
              {post.followedByCurrentUser ? 'Following' : 'Follow'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {post.imageUrls.length > 0 ? (
        <View style={styles.imageStage}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleImageScrollEnd}
            style={styles.imageScroller}
          >
            {post.imageUrls.map((imageUrl, index) => (
              <Image
                key={imageUrl}
                source={imageUrl}
                contentFit="cover"
                transition={180}
                accessibilityLabel={`Post photo ${index + 1} of ${post.imageUrls.length}`}
                style={[styles.postImage, { width: imageWidth }]}
              />
            ))}
          </ScrollView>

          {post.imageUrls.length > 1 ? (
            <View style={styles.paginationDots} pointerEvents="none">
              {post.imageUrls.map((imageUrl, index) => (
                <View
                  key={`dot-${imageUrl}`}
                  style={[
                    styles.paginationDot,
                    index === activeImageIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.textPost}>
          <Ionicons name="car-sport-outline" size={32} color={theme.colors.accentGreenMuted} />
        </View>
      )}

      <View style={styles.body}>
        {post.vehicle ? (
          <View style={styles.vehicleBadge}>
            <Ionicons
              name="car-sport-outline"
              size={14}
              color={theme.colors.accentGreenMuted}
            />
            <Text style={styles.vehicleBadgeText}>{post.vehicle.label}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            onPress={() => onToggleLike(post.id)}
            accessibilityLabel={post.likedByCurrentUser ? 'Unlike post' : 'Like post'}
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
          >
            <Ionicons
              name={post.likedByCurrentUser ? 'heart' : 'heart-outline'}
              size={24}
              color={
                post.likedByCurrentUser
                  ? theme.colors.textDanger
                  : theme.colors.textPrimary
              }
            />
            <Text style={styles.actionCount}>{post.likesCount}</Text>
          </Pressable>

          <Pressable
            onPress={openComments}
            accessibilityLabel="Open comments"
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
          >
            <Ionicons name="chatbubble-outline" size={22} color={theme.colors.textPrimary} />
            <Text style={styles.actionCount}>{post.commentsCount}</Text>
          </Pressable>
        </View>

        {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.surface,
  },
  header: {
    minHeight: 68,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  authorRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    overflow: 'hidden',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderBrandSoft,
    backgroundColor: theme.colors.brandAvatar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: theme.colors.textInverse,
    fontSize: 13,
    fontWeight: '800',
  },
  authorCopy: {
    flex: 1,
  },
  authorName: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  authorMeta: {
    marginTop: 2,
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  followButton: {
    minHeight: 34,
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.borderBrand,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surfaceBrand,
  },
  followButtonActive: {
    borderColor: theme.colors.borderDefault,
    backgroundColor: theme.colors.surfaceMuted,
  },
  followText: {
    color: theme.colors.accentGreenMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  followTextActive: {
    color: theme.colors.textSecondary,
  },
  imageStage: {
    position: 'relative',
  },
  imageScroller: {
    backgroundColor: theme.colors.appBackground,
  },
  postImage: {
    aspectRatio: 1,
    backgroundColor: theme.colors.surfaceMuted,
  },
  paginationDots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
  },
  paginationDotActive: {
    width: 15,
    backgroundColor: theme.colors.accentGreen,
  },
  textPost: {
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceMuted,
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  vehicleBadge: {
    alignSelf: 'flex-start',
    minHeight: 30,
    marginBottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.borderBrandSoft,
    backgroundColor: theme.colors.surfaceBrand,
    paddingHorizontal: 10,
  },
  vehicleBadgeText: {
    color: theme.colors.accentGreenMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  actionButton: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  caption: {
    marginTop: 8,
    color: theme.colors.textSlate,
    fontSize: 14,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },
});
