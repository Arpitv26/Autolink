import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../lib/theme';

export default function PlannerScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="view-grid-outline" size={32} color={theme.colors.textInverse} />
      </View>

      <Text style={styles.title}>Mod Planner</Text>
      <Text style={styles.subtitle}>
        Drag-and-drop modification planner with part catalog and compatibility checks.
      </Text>

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
});
