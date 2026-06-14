/**
 * WalletSkeleton Component
 * Loading skeleton for wallet screen
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, spacing, borderRadius } from '@/constants/theme';

export default function WalletSkeleton() {
  return (
    <Animated.View style={styles.container} entering={FadeIn.duration(300)}>
      {/* Balance Card Skeleton */}
      <View style={styles.balanceCard}>
        <View style={[styles.box, styles.balanceBox]} />
        <View style={[styles.box, styles.balanceNumber]} />
      </View>

      {/* Quick Actions Skeleton */}
      <View style={styles.actionsRow}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.actionBox}>
            <View style={[styles.box, styles.circleBox]} />
            <View style={[styles.box, styles.labelBox]} />
          </View>
        ))}
      </View>

      {/* Transaction List Skeleton */}
      <View style={styles.section}>
        <View style={[styles.box, styles.sectionTitle]} />
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.transactionRow}>
            <View style={[styles.box, styles.transactionIcon]} />
            <View style={styles.transactionContent}>
              <View style={[styles.box, styles.transactionTitle]} />
              <View style={[styles.box, styles.transactionSubtitle]} />
            </View>
            <View style={[styles.box, styles.transactionAmount]} />
          </View>
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
  balanceCard: {
    backgroundColor: colors.background.tertiary,
    height: 160,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
  },
  balanceBox: {
    height: 24,
    width: '50%',
    marginTop: spacing.lg,
    marginLeft: spacing.lg,
  },
  balanceNumber: {
    height: 48,
    width: '70%',
    marginTop: spacing.sm,
    marginLeft: spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  actionBox: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  circleBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  labelBox: {
    width: 48,
    height: 12,
  },
  section: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  sectionTitle: {
    height: 20,
    width: '40%',
    marginBottom: spacing.md,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  transactionContent: {
    flex: 1,
    marginLeft: spacing.sm,
    gap: spacing.xs,
  },
  transactionTitle: {
    height: 14,
    width: '60%',
  },
  transactionSubtitle: {
    height: 12,
    width: '40%',
  },
  transactionAmount: {
    height: 14,
    width: 60,
  },
  box: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
  },
});
