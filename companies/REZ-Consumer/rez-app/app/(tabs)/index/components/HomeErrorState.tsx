/**
 * HomeErrorState Component
 * Error state for the home screen
 * Extracted from index.tsx (originally lines ~872-914)
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface HomeErrorStateProps {
  error: string;
  onRetry: () => void;
}

export default function HomeErrorState({ error, onRetry }: HomeErrorStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={56} color={colors.text.tertiary} />
      <Text style={styles.title}>Could not load your feed</Text>
      <Text style={styles.error}>{error}</Text>
      <Pressable
        onPress={onRetry}
        style={styles.retryButton}
        accessibilityRole="button"
        accessibilityLabel="Retry loading homepage"
      >
        <Text style={styles.retryText}>Try Again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    marginTop: spacing.base,
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  error: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary[500] ?? colors.brand.goldWarm,
    borderRadius: borderRadius.md,
  },
  retryText: {
    color: colors.text.inverse,
    fontWeight: '600',
    fontSize: 15,
  },
});
