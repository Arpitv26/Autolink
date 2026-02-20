import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../lib/theme';

export default function AiScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="robot-outline" size={33} color={theme.colors.textInverse} />
      </View>

      <Text style={styles.title}>AI Assistant</Text>
      <Text style={styles.subtitle}>
        Get personalized mod recommendations based on your vehicle, goals, and budget.
      </Text>

      <View style={styles.badge}>
        <Ionicons name="sparkles-outline" size={14} color={theme.colors.brandSecondary} />
        <Text style={styles.badgeText}>Coming in Phase 4</Text>
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
    backgroundColor: theme.colors.brandAi,
    shadowColor: theme.colors.brandAi,
    shadowOpacity: 0.25,
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
    maxWidth: 280,
    fontWeight: '500',
  },
  badge: {
    marginTop: 18,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.surfaceBrandSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  badgeText: {
    color: theme.colors.brandSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
