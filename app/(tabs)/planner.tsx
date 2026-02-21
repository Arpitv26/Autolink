import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { usePrimaryVehicleContext } from '../../hooks/usePrimaryVehicleContext';
import { theme } from '../../lib/theme';

export default function PlannerScreen() {
  const { user } = useAuth();
  const { primaryVehicle, loading, error, refresh } = usePrimaryVehicleContext(user);
  const primaryVehicleLabel = useMemo(() => {
    if (!primaryVehicle) return null;
    return `${primaryVehicle.year} ${primaryVehicle.make} ${primaryVehicle.model}`;
  }, [primaryVehicle]);

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="view-grid-outline" size={32} color={theme.colors.textInverse} />
      </View>

      <Text style={styles.title}>Mod Planner</Text>
      <Text style={styles.subtitle}>
        Drag-and-drop modification planner with part catalog and compatibility checks.
      </Text>

      <View style={styles.contextCard}>
        <Text style={styles.contextTitle}>Current Build Vehicle</Text>
        {loading ? (
          <View style={styles.contextStatusRow}>
            <ActivityIndicator size="small" color={theme.colors.accentGreen} />
            <Text style={styles.contextValue}>Loading your garage vehicle...</Text>
          </View>
        ) : error ? (
          <>
            <Text style={styles.contextErrorText}>{error}</Text>
            <Pressable
              onPress={() => void refresh()}
              style={({ pressed }) => [styles.contextActionButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.contextActionText}>Retry</Text>
            </Pressable>
          </>
        ) : primaryVehicleLabel ? (
          <Text style={styles.contextValue}>{primaryVehicleLabel}</Text>
        ) : (
          <>
            <Text style={styles.contextValue}>
              Add a vehicle in Profile to personalize planning.
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/profile')}
              style={({ pressed }) => [styles.contextActionButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.contextActionText}>Go to Profile</Text>
            </Pressable>
          </>
        )}
      </View>

      <View style={styles.badge}>
        <Ionicons name="time-outline" size={14} color={theme.colors.buttonSuccess} />
        <Text style={styles.badgeText}>Canvas and catalog arrive in Phase 3</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: theme.colors.appBackground,
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.brandPlanner,
    shadowColor: theme.colors.brandPlanner,
    shadowOpacity: 0.24,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    marginTop: 18,
    fontSize: 39,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 285,
    fontWeight: '500',
  },
  badge: {
    marginTop: 18,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.surfaceSuccessSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  badgeText: {
    color: theme.colors.buttonSuccess,
    fontSize: 15,
    fontWeight: '600',
  },
  contextCard: {
    marginTop: 14,
    width: '100%',
    maxWidth: 315,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderMuted,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  contextTitle: {
    color: theme.colors.accentGreenMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  contextValue: {
    marginTop: 4,
    color: theme.colors.accentGreen,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  contextStatusRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contextErrorText: {
    marginTop: 4,
    color: theme.colors.textDanger,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  contextActionButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.borderBrand,
    backgroundColor: theme.colors.surfaceBrand,
    paddingVertical: 6,
    paddingHorizontal: 11,
  },
  contextActionText: {
    color: theme.colors.accentGreen,
    fontSize: 13,
    fontWeight: '700',
  },
  buttonPressed: {
    transform: [{ scale: 0.985 }],
  },
});
