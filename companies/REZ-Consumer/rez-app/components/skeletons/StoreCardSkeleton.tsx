/**
 * StoreCardSkeleton - Skeleton for store card in horizontal lists
 *
 * Matches the layout of store cards used in:
 * - Recommended Stores section
 * - Nearby stores carousel
 * - Category store lists
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from './SkeletonLoader';
import { spacing, colors } from '@/constants/theme';

// eslint-disable-next-line react/display-name
export const StoreCardSkeleton = React.memo(() => (
  <View
    style={styles.card}
    accessible={true}
    accessibilityRole="none"
    accessibilityLabel="Loading store card"
  >
    {/* Store image */}
    <SkeletonLoader
      height={140}
      borderRadius={12}
      style={styles.image}
      variant="rect"
    />

    {/* Store name */}
    <SkeletonLoader
      width="70%"
      height={16}
      borderRadius={4}
      style={styles.name}
    />

    {/* Store category/type */}
    <SkeletonLoader
      width="50%"
      height={13}
      borderRadius={4}
      style={styles.category}
    />

    {/* Rating and distance row */}
    <View style={styles.row}>
      <SkeletonLoader
        width={60}
        height={13}
        borderRadius={4}
      />
      <SkeletonLoader
        width={40}
        height={13}
        borderRadius={4}
      />
    </View>
  </View>
));

const styles = StyleSheet.create({
  card: {
    width: 180,
    marginRight: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    marginBottom: spacing.sm,
  },
  name: {
    marginHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  category: {
    marginHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
});

export default StoreCardSkeleton;
