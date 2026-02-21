import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';
import React from 'react';
import { theme } from '../../lib/theme';

function renderTabIcon(routeName: string, color: string, focused: boolean) {
  const size = focused ? 22 : 20;

  switch (routeName) {
    case 'ai':
      return <MaterialCommunityIcons name="robot-outline" size={size} color={color} />;
    case 'planner':
      return <MaterialCommunityIcons name="view-grid-outline" size={size} color={color} />;
    case 'feed':
      return <MaterialCommunityIcons name="account-group-outline" size={size} color={color} />;
    case 'profile':
      return <Ionicons name="person-outline" size={size} color={color} />;
    default:
      return <Ionicons name="ellipse-outline" size={size} color={color} />;
  }
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        animation: 'shift',
        sceneStyle: { backgroundColor: theme.colors.appBackground },
        tabBarActiveTintColor: theme.colors.accentGreenMuted,
        tabBarInactiveTintColor: theme.colors.tabLabelInactive,
        tabBarActiveBackgroundColor: theme.colors.surfaceBrand,
        tabBarStyle: {
          height: 70,
          paddingTop: 5,
          paddingBottom: 7,
          borderTopWidth: 1,
          borderTopColor: theme.colors.borderDefault,
          backgroundColor: theme.colors.surface,
        },
        tabBarItemStyle: {
          marginHorizontal: 4,
          borderRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 1,
        },
        tabBarIcon: ({ focused }) => renderTabIcon(route.name, theme.colors.accentGreen, focused),
      })}
    >
      <Tabs.Screen name="ai" options={{ title: 'AI' }} />
      <Tabs.Screen name="planner" options={{ title: 'Planner' }} />
      <Tabs.Screen name="feed" options={{ title: 'Feed' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
