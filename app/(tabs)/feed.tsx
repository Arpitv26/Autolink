import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PostCard } from '../../components/feed/PostCard';
import { useAuth } from '../../hooks/useAuth';
import { useFeed } from '../../hooks/useFeed';
import { usePrimaryVehicleContext } from '../../hooks/usePrimaryVehicleContext';
import { theme } from '../../lib/theme';
import type { FeedPost } from '../../types/feed';

export default function FeedScreen() {
  const { user } = useAuth();
  const { primaryVehicle: vehicle } = usePrimaryVehicleContext(user);
  const {
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
  } = useFeed(user);

  const renderPost = useCallback(
    ({ item }: { item: FeedPost }) => (
      <PostCard
        post={item}
        currentUserId={user?.id ?? null}
        onToggleLike={(postId) => void toggleLike(postId)}
        onToggleFollow={(authorId) => void toggleFollow(authorId)}
      />
    ),
    [toggleFollow, toggleLike, user?.id]
  );

  const header = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.eyebrow}>Community</Text>
          <Text style={styles.title}>Feed</Text>
        </View>
        <Pressable
          onPress={() => router.push('/create-post')}
          style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}
        >
          <Ionicons name="add" size={20} color={theme.colors.textIconDark} />
          <Text style={styles.createButtonText}>Post</Text>
        </Pressable>
      </View>

      <View style={styles.vehiclePill}>
        <Ionicons name="car-sport-outline" size={15} color={theme.colors.accentGreenMuted} />
        <Text style={styles.vehicleText} numberOfLines={1}>
          {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Your garage context'}
        </Text>
      </View>

      {error ? (
        <Pressable style={styles.errorBanner} onPress={() => void refresh()}>
          <Ionicons name="alert-circle-outline" size={17} color={theme.colors.textDanger} />
          <Text style={styles.errorText}>{error} Tap to retry.</Text>
        </Pressable>
      ) : null}
    </View>
  );

  if (loading && posts.length === 0) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator size="large" color={theme.colors.brandPrimary} />
        <Text style={styles.loadingText}>Loading the community…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        ListHeaderComponent={header}
        contentContainerStyle={[styles.list, posts.length === 0 && styles.emptyList]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={theme.colors.brandPrimary}
          />
        }
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.35}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="images-outline" size={40} color={theme.colors.accentGreenMuted} />
            </View>
            <Text style={styles.emptyTitle}>Your Feed is ready</Text>
            <Text style={styles.emptyBody}>
              Be the first to share a vehicle update, or run the optional Supabase seed for demo
              content.
            </Text>
            <Pressable
              onPress={() => router.push('/create-post')}
              style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}
            >
              <Text style={styles.emptyButtonText}>Create First Post</Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {loadingMore ? (
              <ActivityIndicator color={theme.colors.brandPrimary} />
            ) : !hasMore && posts.length > 0 ? (
              <Text style={styles.footerText}>You are all caught up.</Text>
            ) : null}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.appBackground,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: theme.colors.appBackground,
  },
  list: {
    paddingBottom: 110,
  },
  emptyList: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: theme.colors.accentGreenMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 2,
    color: theme.colors.textHeading,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  createButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.brandPrimary,
  },
  createButtonText: {
    color: theme.colors.textIconDark,
    fontSize: 14,
    fontWeight: '900',
  },
  vehiclePill: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    minHeight: 34,
    marginTop: 13,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.borderBrandSoft,
    backgroundColor: theme.colors.surfaceBrand,
  },
  vehicleText: {
    flexShrink: 1,
    color: theme.colors.accentGreenMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  errorBanner: {
    marginTop: 12,
    minHeight: 42,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderDangerSoft,
    backgroundColor: theme.colors.surfaceDangerSoft,
  },
  errorText: {
    flex: 1,
    color: theme.colors.textDanger,
    fontSize: 12,
    lineHeight: 17,
  },
  emptyState: {
    flex: 1,
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 78,
    height: 78,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceBrand,
    borderWidth: 1,
    borderColor: theme.colors.borderBrandSoft,
  },
  emptyTitle: {
    marginTop: 17,
    color: theme.colors.textHeading,
    fontSize: 23,
    fontWeight: '900',
  },
  emptyBody: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  emptyButton: {
    minHeight: 46,
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderBrand,
    backgroundColor: theme.colors.buttonPrimary,
    paddingHorizontal: 18,
  },
  emptyButtonText: {
    color: theme.colors.textInverse,
    fontSize: 14,
    fontWeight: '800',
  },
  footer: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.985 }],
  },
});
