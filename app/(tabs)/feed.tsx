import { StyleSheet, Text, View } from 'react-native';
import React from 'react';

export default function FeedScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Community Feed</Text>
      <Text style={styles.subtitle}>Phase 2 will add posts, likes, and comments</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
