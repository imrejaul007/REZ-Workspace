/**
 * HomeSkeleton Component
 * Loading skeleton for home screen
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { colors, spacing, borderRadius } from '@/constants/theme';

export default function HomeSkeleton() {
  return (
    <Animated.View style={styles.container} entering={FadeIn.duration(300)}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={[styles.box, styles.locationBox]} />
        <View style={styles.actions}>
          <View style={[styles.box, styles.smallBox]} />
          <View style={[styles.box, styles.smallBox]} />
          <View style={[styles.box, styles.smallBox]} />
        </View>
      </View>

      {/* Location Banner Skeleton */}
      <View style={[styles.box, styles.locationBanner]} />

      {/* Search Skeleton */}
      <View style={[styles.box, styles.searchBox]} />

      {/* Category Grid Skeleton */}
      <View style={styles.categoryGrid}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.box, styles.categoryBox]} />
        ))}
      </View>

      {/* Featured Section Skeleton */}
      <View style={[styles.box, styles.featuredBox]} />

      {/* Product List Skeleton */}
      <View style={styles.productList}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.box, styles.productBox]} />
        ))}
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  box: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
  },
  locationBox: {
    width: 120,
    height: 32,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  smallBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  locationBanner: {
    height: 48,
    marginBottom: spacing.md,
  },
  searchBox: {
    height: 44,
    marginBottom: spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryBox: {
    width: '23%',
    height: 60,
  },
  featuredBox: {
    height: 160,
    marginBottom: spacing.md,
  },
  productList: {
    gap: spacing.sm,
  },
  productBox: {
    height: 100,
    marginBottom: spacing.sm,
  },
});
