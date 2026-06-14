/**
 * EventSkeleton Component
 * Loading skeleton for EventPage
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, spacing, borderRadius } from '@/constants/theme';

export default function EventSkeleton() {
  return (
    <Animated.View style={styles.container} entering={FadeIn.duration(300)}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={[styles.box, styles.titleBox]} />
        <View style={[styles.box, styles.searchBox]} />
      </View>

      {/* Filter Chips Skeleton */}
      <View style={styles.filters}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.box, styles.chipBox]} />
        ))}
      </View>

      {/* Event List Skeleton */}
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.card}>
          <View style={[styles.box, styles.imageBox]} />
          <View style={styles.content}>
            <View style={[styles.box, styles.titleBox]} />
            <View style={[styles.box, styles.subtitleBox]} />
            <View style={styles.footer}>
              <View style={[styles.box, styles.ratingBox]} />
              <View style={[styles.box, styles.priceBox]} />
            </View>
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  titleBox: {
    height: 32,
    width: 150,
  },
  searchBox: {
    height: 32,
    width: 100,
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chipBox: {
    height: 36,
    width: 80,
    borderRadius: 18,
  },
  card: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  imageBox: {
    height: 160,
    width: '100%',
  },
  content: {
    padding: spacing.md,
  },
  subtitleBox: {
    height: 14,
    width: '60%',
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  ratingBox: {
    height: 14,
    width: 50,
  },
  priceBox: {
    height: 16,
    width: 70,
  },
  box: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
  },
});
