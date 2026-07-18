import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Reanimated, { LinearTransition } from 'react-native-reanimated';
import type { SavedVehicle } from '../../hooks/useGarageSetup';
import { theme } from '../../lib/theme';

type GarageVehicleListProps = {
  vehicles: SavedVehicle[];
  activeVehicleId: string | null;
  primaryVehicleId: string | null;
  switchingVehicleId: string | null;
  deletingVehicleId: string | null;
  mutationInProgress: boolean;
  onActivate: (vehicleId: string) => void;
  onDelete: (vehicleId: string) => void;
};

const CARD_LAYOUT_TRANSITION = LinearTransition.duration(260);

export function GarageVehicleList({
  vehicles,
  activeVehicleId,
  primaryVehicleId,
  switchingVehicleId,
  deletingVehicleId,
  mutationInProgress,
  onActivate,
  onDelete,
}: GarageVehicleListProps) {
  return (
    <View style={styles.list}>
      {vehicles.map((vehicle) => {
        const isPrimary = vehicle.id === primaryVehicleId;
        const isActive = vehicle.id === activeVehicleId;
        const isSwitching = switchingVehicleId === vehicle.id;
        const isDeleting = deletingVehicleId === vehicle.id;
        const switchDisabled =
          isActive || mutationInProgress || Boolean(switchingVehicleId) || Boolean(deletingVehicleId);
        const deleteDisabled =
          mutationInProgress || Boolean(switchingVehicleId) || Boolean(deletingVehicleId);

        return (
          <Reanimated.View
            key={vehicle.id}
            layout={CARD_LAYOUT_TRANSITION}
            style={[styles.card, isActive && styles.cardActive]}
          >
            <View style={styles.titleRow}>
              <Text style={styles.name}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </Text>
              {isActive ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{isPrimary ? 'Primary' : 'Active'}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={() => onActivate(vehicle.id)}
                disabled={switchDisabled}
                style={({ pressed }) => [
                  styles.activateButton,
                  switchDisabled && styles.activateButtonDisabled,
                  pressed && !switchDisabled && styles.pressed,
                ]}
              >
                {isSwitching ? (
                  <ActivityIndicator size="small" color={theme.colors.textInverse} />
                ) : (
                  <Text
                    style={[
                      styles.activateText,
                      switchDisabled && styles.activateTextDisabled,
                    ]}
                  >
                    {isActive ? 'Active' : 'Set active'}
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => onDelete(vehicle.id)}
                disabled={deleteDisabled}
                accessibilityLabel={`Delete ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                style={({ pressed }) => [
                  styles.deleteButton,
                  deleteDisabled && styles.deleteButtonDisabled,
                  pressed && !deleteDisabled && styles.pressed,
                ]}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={theme.colors.textPrimary} />
                ) : (
                  <Ionicons name="trash-outline" size={16} color={theme.colors.textPrimary} />
                )}
              </Pressable>
            </View>
          </Reanimated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.borderMuted,
    backgroundColor: theme.colors.appBackground,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardActive: {
    borderColor: theme.colors.borderBrand,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    flex: 1,
    color: theme.colors.accentGreen,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 23,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: theme.colors.borderBrand,
    backgroundColor: theme.colors.surfaceBrandSoft,
  },
  badgeText: {
    color: theme.colors.accentGreenMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  actions: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activateButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: theme.colors.buttonPrimary,
    borderWidth: 1,
    borderColor: theme.colors.borderBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activateButtonDisabled: {
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.borderDefault,
  },
  activateText: {
    color: theme.colors.accentGreenMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  activateTextDisabled: {
    color: theme.colors.textSecondary,
  },
  deleteButton: {
    width: 46,
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: theme.colors.textDanger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
});
