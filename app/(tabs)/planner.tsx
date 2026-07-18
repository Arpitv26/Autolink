import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CatalogBrowser } from '../../components/planner/CatalogBrowser';
import { CategoryZone } from '../../components/planner/CategoryZone';
import { useAuth } from '../../hooks/useAuth';
import { useBuildPlanner } from '../../hooks/useBuildPlanner';
import { usePrimaryVehicleContext } from '../../hooks/usePrimaryVehicleContext';
import {
  formatUsd,
  getCatalogCategories,
  type CatalogPart,
} from '../../lib/partsCatalog';
import { theme } from '../../lib/theme';

export default function PlannerScreen() {
  const { user } = useAuth();
  const { primaryVehicle, loading: vehicleLoading, error: vehicleError, refresh } =
    usePrimaryVehicleContext(user);
  const {
    build,
    items,
    itemsByCategory,
    totalCost,
    loading,
    mutating,
    error,
    refresh: refreshBuild,
    addPart,
    removeItem,
    moveItem,
    swapItemOrder,
    buildShareCaption,
  } = useBuildPlanner(user, primaryVehicle?.id ?? null);

  const [addingPartId, setAddingPartId] = useState<string | null>(null);
  const [moveModeItemId, setMoveModeItemId] = useState<string | null>(null);

  const primaryVehicleLabel = useMemo(() => {
    if (!primaryVehicle) return null;
    return `${primaryVehicle.year} ${primaryVehicle.make} ${primaryVehicle.model}`;
  }, [primaryVehicle]);

  const categories = useMemo(() => {
    const catalogCategories = getCatalogCategories();
    const used = Object.keys(itemsByCategory);
    return [...new Set([...catalogCategories, ...used])];
  }, [itemsByCategory]);

  const handleAddPart = useCallback(
    async (part: CatalogPart): Promise<void> => {
      setAddingPartId(part.id);
      await addPart(part);
      setAddingPartId(null);
    },
    [addPart]
  );

  const handleMoveWithin = useCallback(
    async (itemId: string, direction: -1 | 1): Promise<void> => {
      const item = items.find((entry) => entry.id === itemId);
      if (!item) return;

      const siblings = [...(itemsByCategory[item.category] ?? [])].sort(
        (left, right) => left.sortOrder - right.sortOrder
      );
      const index = siblings.findIndex((entry) => entry.id === itemId);
      const swapWith = siblings[index + direction];
      if (!swapWith) return;

      await swapItemOrder(itemId, swapWith.id);
    },
    [items, itemsByCategory, swapItemOrder]
  );

  const handleDropOnCategory = useCallback(
    async (category: string): Promise<void> => {
      if (!moveModeItemId) return;
      const item = items.find((entry) => entry.id === moveModeItemId);
      if (!item) {
        setMoveModeItemId(null);
        return;
      }

      if (item.category === category) {
        setMoveModeItemId(null);
        return;
      }

      const nextSort =
        (itemsByCategory[category] ?? []).reduce(
          (max, entry) => Math.max(max, entry.sortOrder),
          -1
        ) + 1;
      await moveItem(item.id, category, nextSort);
      setMoveModeItemId(null);
    },
    [items, itemsByCategory, moveItem, moveModeItemId]
  );

  const handleShare = useCallback((): void => {
    if (!build || !primaryVehicle) return;
    router.push({
      pathname: '/create-post',
      params: {
        vehicleId: primaryVehicle.id,
        buildId: build.id,
        caption: buildShareCaption(),
      },
    });
  }, [build, buildShareCaption, primaryVehicle]);

  if (vehicleLoading || (loading && !build && primaryVehicle)) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator size="large" color={theme.colors.brandPrimary} />
        <Text style={styles.loadingText}>Opening your build plan…</Text>
      </SafeAreaView>
    );
  }

  if (vehicleError) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <Text style={styles.errorTitle}>Could not load vehicle</Text>
        <Text style={styles.errorBody}>{vehicleError}</Text>
        <Pressable style={styles.primaryButton} onPress={() => void refresh()}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!primaryVehicle) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons
            name="view-grid-outline"
            size={32}
            color={theme.colors.textInverse}
          />
        </View>
        <Text style={styles.emptyTitle}>Add a vehicle first</Text>
        <Text style={styles.emptyBody}>
          Planner builds are tied to your primary garage vehicle.
        </Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Text style={styles.primaryButtonText}>Go to Garage</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>Mod Planner</Text>
              <Text style={styles.title}>{build?.title ?? 'Your Build'}</Text>
              <Text style={styles.vehicleLabel}>{primaryVehicleLabel}</Text>
            </View>
            <Pressable
              onPress={() => void refreshBuild()}
              style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}
            >
              <Ionicons name="refresh" size={18} color={theme.colors.accentGreenMuted} />
            </Pressable>
          </View>

          <View style={styles.costCard}>
            <Text style={styles.costLabel}>Estimated total</Text>
            <Text style={styles.costValue}>{formatUsd(totalCost)}</Text>
            <Text style={styles.costMeta}>
              {items.length} {items.length === 1 ? 'part' : 'parts'} in this build
            </Text>
          </View>

          {error ? (
            <Pressable style={styles.errorBanner} onPress={() => void refreshBuild()}>
              <Ionicons name="alert-circle-outline" size={17} color={theme.colors.textDanger} />
              <Text style={styles.errorBannerText}>{error} Tap to retry.</Text>
            </Pressable>
          ) : null}

          {moveModeItemId ? (
            <View style={styles.moveBanner}>
              <Text style={styles.moveBannerText}>
                Move mode on — tap a category zone to drop the part.
              </Text>
              <Pressable onPress={() => setMoveModeItemId(null)}>
                <Text style={styles.moveCancel}>Cancel</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Build board</Text>
            <View style={styles.zoneList}>
              {categories.map((category) => (
                <CategoryZone
                  key={category}
                  category={category}
                  items={itemsByCategory[category] ?? []}
                  isDropTarget={Boolean(moveModeItemId)}
                  moveModeItemId={moveModeItemId}
                  mutating={mutating}
                  onRemove={(itemId) => void removeItem(itemId)}
                  onMoveWithin={(itemId, direction) =>
                    void handleMoveWithin(itemId, direction)
                  }
                  onEnterMoveMode={setMoveModeItemId}
                  onDropOnCategory={(nextCategory) =>
                    void handleDropOnCategory(nextCategory)
                  }
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <CatalogBrowser
              disabled={mutating || !build}
              adding={Boolean(addingPartId)}
              onAddPart={(part) => void handleAddPart(part)}
            />
          </View>

          <Pressable
            disabled={!build || items.length === 0}
            onPress={handleShare}
            style={({ pressed }) => [
              styles.shareButton,
              (!build || items.length === 0) && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="share-outline" size={18} color={theme.colors.textIconDark} />
            <Text style={styles.shareButtonText}>Share Build to Feed</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.appBackground,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 28,
    backgroundColor: theme.colors.appBackground,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 120,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  eyebrow: {
    color: theme.colors.accentGreenMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 2,
    color: theme.colors.textHeading,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  vehicleLabel: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
    backgroundColor: theme.colors.surface,
  },
  costCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.borderBrandSoft,
    backgroundColor: theme.colors.surfaceBrand,
    padding: 16,
  },
  costLabel: {
    color: theme.colors.accentGreenMuted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  costValue: {
    marginTop: 4,
    color: theme.colors.textHeading,
    fontSize: 34,
    fontWeight: '900',
  },
  costMeta: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  errorBanner: {
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
  errorBannerText: {
    flex: 1,
    color: theme.colors.textDanger,
    fontSize: 12,
    lineHeight: 17,
  },
  moveBanner: {
    minHeight: 42,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderBrand,
    backgroundColor: theme.colors.surfaceBrand,
  },
  moveBannerText: {
    flex: 1,
    color: theme.colors.accentGreenMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  moveCancel: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: theme.colors.textHeading,
    fontSize: 18,
    fontWeight: '900',
  },
  zoneList: {
    gap: 10,
  },
  shareButton: {
    minHeight: 50,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderBrand,
    backgroundColor: theme.colors.brandPrimary,
  },
  shareButtonText: {
    color: theme.colors.textIconDark,
    fontSize: 15,
    fontWeight: '900',
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.brandPlanner,
  },
  emptyTitle: {
    color: theme.colors.textHeading,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyBody: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  errorTitle: {
    color: theme.colors.textHeading,
    fontSize: 22,
    fontWeight: '800',
  },
  errorBody: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  primaryButton: {
    minHeight: 46,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderBrand,
    backgroundColor: theme.colors.buttonPrimary,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: theme.colors.textInverse,
    fontSize: 14,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
});
