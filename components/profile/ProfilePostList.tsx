import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ProfilePostSummary } from '../../hooks/useProfileFeedSections';
import { theme } from '../../lib/theme';

type ProfilePostListProps = {
  items: ProfilePostSummary[];
  loading: boolean;
  error: string | null;
  emptyTitle: string;
  emptyBody: string;
  emptyIcon: keyof typeof Ionicons.glyphMap;
};

export function ProfilePostList({
  items,
  loading,
  error,
  emptyTitle,
  emptyBody,
  emptyIcon,
}: ProfilePostListProps) {
  if (loading) {
    return (
      <View style={styles.stateCard}>
        <ActivityIndicator color={theme.colors.brandPrimary} />
        <Text style={styles.stateBody}>Loading posts…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.stateCard}>
        <Ionicons name="alert-circle-outline" size={38} color={theme.colors.textDanger} />
        <Text style={styles.stateTitle}>Could not load posts</Text>
        <Text style={styles.stateBody}>{error}</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.stateCard}>
        <Ionicons name={emptyIcon} size={42} color={theme.colors.iconSubtle} />
        <Text style={styles.stateTitle}>{emptyTitle}</Text>
        <Text style={styles.stateBody}>{emptyBody}</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => router.push({ pathname: '/post/[id]', params: { id: item.id } })}
          style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
        >
          {item.imageUrl ? (
            <Image source={item.imageUrl} style={styles.image} contentFit="cover" />
          ) : (
            <View style={[styles.image, styles.textImage]}>
              <Ionicons name="car-sport-outline" size={26} color={theme.colors.accentGreenMuted} />
            </View>
          )}
          <View style={styles.tileBody}>
            <Text style={styles.caption} numberOfLines={2}>
              {item.caption || 'Build update'}
            </Text>
            <View style={styles.counts}>
              <Ionicons name="heart-outline" size={13} color={theme.colors.textMuted} />
              <Text style={styles.countText}>{item.likesCount}</Text>
              <Ionicons name="chatbubble-outline" size={12} color={theme.colors.textMuted} />
              <Text style={styles.countText}>{item.commentsCount}</Text>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stateCard: {
    minHeight: 210,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.surface,
    padding: 24,
  },
  stateTitle: {
    marginTop: 12,
    color: theme.colors.textHeading,
    fontSize: 20,
    fontWeight: '800',
  },
  stateBody: {
    marginTop: 7,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    width: '48.5%',
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.surface,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: theme.colors.surfaceMuted,
  },
  textImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileBody: {
    padding: 10,
  },
  caption: {
    minHeight: 36,
    color: theme.colors.textSlate,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  counts: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countText: {
    marginRight: 5,
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
});
