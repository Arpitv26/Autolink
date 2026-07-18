import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { formatUsd } from '../../lib/partsCatalog';
import { theme } from '../../lib/theme';
import type { BuildItem } from '../../types/planner';

type CategoryZoneProps = {
  category: string;
  items: BuildItem[];
  isDropTarget: boolean;
  moveModeItemId: string | null;
  mutating: boolean;
  onRemove: (itemId: string) => void;
  onMoveWithin: (itemId: string, direction: -1 | 1) => void;
  onEnterMoveMode: (itemId: string) => void;
  onDropOnCategory: (category: string) => void;
};

function DraggableBuildItem({
  item,
  mutating,
  moveModeActive,
  onRemove,
  onMoveWithin,
  onEnterMoveMode,
}: {
  item: BuildItem;
  mutating: boolean;
  moveModeActive: boolean;
  onRemove: (itemId: string) => void;
  onMoveWithin: (itemId: string, direction: -1 | 1) => void;
  onEnterMoveMode: (itemId: string) => void;
}) {
  const scale = useSharedValue(1);
  const longPress = Gesture.LongPress()
    .minDuration(220)
    .onStart(() => {
      scale.value = withSpring(1.04);
      runOnJS(onEnterMoveMode)(item.id);
    })
    .onFinalize(() => {
      scale.value = withSpring(1);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={longPress}>
      <Animated.View
        style={[
          styles.itemCard,
          moveModeActive && styles.itemCardActive,
          animatedStyle,
        ]}
      >
        <View style={styles.itemCopy}>
          <Text style={styles.itemName}>
            {item.brand} {item.partName}
          </Text>
          <Text style={styles.itemMeta}>
            {formatUsd(item.price)} · hold to move
          </Text>
        </View>

        <View style={styles.itemActions}>
          <Pressable
            disabled={mutating}
            onPress={() => onMoveWithin(item.id, -1)}
            style={styles.iconButton}
            accessibilityLabel="Move part up"
          >
            <Ionicons name="chevron-up" size={16} color={theme.colors.accentGreenMuted} />
          </Pressable>
          <Pressable
            disabled={mutating}
            onPress={() => onMoveWithin(item.id, 1)}
            style={styles.iconButton}
            accessibilityLabel="Move part down"
          >
            <Ionicons name="chevron-down" size={16} color={theme.colors.accentGreenMuted} />
          </Pressable>
          <Pressable
            disabled={mutating}
            onPress={() => onRemove(item.id)}
            style={styles.deleteButton}
            accessibilityLabel="Remove part"
          >
            {mutating ? (
              <ActivityIndicator size="small" color={theme.colors.textPrimary} />
            ) : (
              <Ionicons name="trash-outline" size={15} color={theme.colors.textPrimary} />
            )}
          </Pressable>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

export function CategoryZone({
  category,
  items,
  isDropTarget,
  moveModeItemId,
  mutating,
  onRemove,
  onMoveWithin,
  onEnterMoveMode,
  onDropOnCategory,
}: CategoryZoneProps) {
  return (
    <Pressable
      disabled={!moveModeItemId}
      onPress={() => onDropOnCategory(category)}
      style={[styles.zone, isDropTarget && styles.zoneActive]}
    >
      <View style={styles.zoneHeader}>
        <Text style={styles.zoneTitle}>{category}</Text>
        <Text style={styles.zoneCount}>{items.length}</Text>
      </View>

      {moveModeItemId ? (
        <Text style={styles.dropHint}>Tap zone to drop part here</Text>
      ) : null}

      {items.length === 0 ? (
        <Text style={styles.emptyZone}>No parts in this category yet.</Text>
      ) : (
        <View style={styles.itemList}>
          {items.map((item) => (
            <DraggableBuildItem
              key={item.id}
              item={item}
              mutating={mutating}
              moveModeActive={moveModeItemId === item.id}
              onRemove={onRemove}
              onMoveWithin={onMoveWithin}
              onEnterMoveMode={onEnterMoveMode}
            />
          ))}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  zone: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.surface,
    padding: 12,
  },
  zoneActive: {
    borderColor: theme.colors.borderBrand,
    backgroundColor: theme.colors.surfaceBrand,
  },
  zoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  zoneTitle: {
    color: theme.colors.accentGreenMuted,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  zoneCount: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  dropHint: {
    marginBottom: 8,
    color: theme.colors.accentGreenMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyZone: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  itemList: {
    gap: 8,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderMuted,
    backgroundColor: theme.colors.appBackground,
    padding: 10,
  },
  itemCardActive: {
    borderColor: theme.colors.borderBrand,
  },
  itemCopy: {
    flex: 1,
  },
  itemName: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  itemMeta: {
    marginTop: 2,
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceMuted,
  },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.textDanger,
  },
});
