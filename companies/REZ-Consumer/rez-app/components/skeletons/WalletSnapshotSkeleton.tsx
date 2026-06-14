/**
 * WalletSnapshotSkeleton - Skeleton for wallet balance card
 *
 * Used in:
 * - Homepage wallet hero card
 * - Wallet screen header
 * - Quick wallet view in profile
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from './SkeletonLoader';
import { spacing, colors } from '@/constants/theme';

// eslint-disable-next-line react/display-name
export const WalletSnapshotSkeleton = React.memo(() => (
  <View
    style={styles.container}
    accessible={true}
    accessibilityRole="none"
    accessibilityLabel="Loading wallet information"
  >
    {/* Label: "Your Balance" */}
    <SkeletonLoader
      width="40%"
      height={13}
      borderRadius={4}
      style={styles.label}
    />

    {/* Main balance amount */}
    <SkeletonLoader
      width="60%"
      height={32}
      borderRadius={4}
      style={styles.balance}
    />

    {/* Three stat cards: coins, cashback, tier */}
    <View style={styles.statsRow}>
      <View style={styles.statCard}>
        <SkeletonLoader
          width="100%"
          height={40}
          borderRadius={8}
        />
      </View>
      <View style={styles.statCard}>
        <SkeletonLoader
          width="100%"
          height={40}
          borderRadius={8}
        />
      </View>
      <View style={styles.statCard}>
        <SkeletonLoader
          width="100%"
          height={40}
          borderRadius={8}
        />
      </View>
    </View>
  </View>
));

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: colors.brand.nileBlueLight,
    borderRadius: 16,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  balance: {
    marginBottom: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
  },
});

export default WalletSnapshotSkeleton;
