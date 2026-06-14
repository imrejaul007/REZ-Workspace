/**
 * PrePaymentSummary
 *
 * Phase 1.6 — "Check REZ Before Paying" Flow
 * Shows before payment:
 *  - Current balance
 *  - Estimated coins to earn from this purchase
 *  - Streak status
 *  - Tier progress preview
 */

import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

// ============================================================================
// TYPES
// ============================================================================

export interface LoyaltyProgress {
  merchantName: string;
  currentVisits: number;
  requiredVisits: number;
  currentTier: string;
  nextTier: string;
}

export interface PrePaymentSummaryProps {
  currentBalance: number;
  estimatedEarnings: number;
  currentStreak: number;
  loyaltyProgress?: LoyaltyProgress | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

const PrePaymentSummary: React.FC<PrePaymentSummaryProps> = ({
  currentBalance,
  estimatedEarnings,
  currentStreak,
  loyaltyProgress,
}) => {
  const newBalance = currentBalance + estimatedEarnings;
  const hasStreak = currentStreak > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <ThemedText style={styles.headerTitle}>REZ Summary</ThemedText>
        <View style={styles.headerBadge}>
          <Ionicons name="shield-checkmark" size={13} color={colors.success} />
          <ThemedText style={styles.headerBadgeText}>Protected</ThemedText>
        </View>
      </View>

      {/* Balance row */}
      <View style={styles.row}>
        <View style={styles.rowIcon}>
          <ThemedText style={styles.rowEmoji}>🪙</ThemedText>
        </View>
        <View style={styles.rowContent}>
          <ThemedText style={styles.rowLabel}>Current Balance</ThemedText>
          <ThemedText style={styles.rowValue}>
            {currentBalance.toLocaleString('en-IN')} coins
          </ThemedText>
        </View>
      </View>

      {/* Earnings row */}
      <View style={[styles.row, styles.earningsRow]}>
        <View style={[styles.rowIcon, styles.earningsIcon]}>
          <Ionicons name="add-circle" size={20} color={colors.success} />
        </View>
        <View style={styles.rowContent}>
          <ThemedText style={styles.rowLabel}>You'll earn ~</ThemedText>
          <ThemedText style={[styles.rowValue, styles.earningsValue]}>
            {estimatedEarnings.toLocaleString('en-IN')} coins
          </ThemedText>
        </View>
        <ThemedText style={styles.newBalance}>
          → {newBalance.toLocaleString('en-IN')}
        </ThemedText>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Streak row */}
      <View style={styles.row}>
        <View style={styles.rowIcon}>
          <ThemedText style={styles.rowEmoji}>{hasStreak ? '🔥' : '💤'}</ThemedText>
        </View>
        <View style={styles.rowContent}>
          <ThemedText style={styles.rowLabel}>Savings Streak</ThemedText>
          {hasStreak ? (
            <ThemedText style={styles.streakActiveText}>
              This extends your {currentStreak}-day streak!
            </ThemedText>
          ) : (
            <ThemedText style={styles.streakInactiveText}>
              Start your streak with this purchase
            </ThemedText>
          )}
        </View>
      </View>

      {/* Tier progress row */}
      {loyaltyProgress && (
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <ThemedText style={styles.rowEmoji}>🏆</ThemedText>
          </View>
          <View style={styles.rowContent}>
            <ThemedText style={styles.rowLabel}>
              {loyaltyProgress.merchantName} Loyalty
            </ThemedText>
            <ThemedText style={styles.tierText}>
              {loyaltyProgress.currentVisits + 1}/{loyaltyProgress.requiredVisits} visits
              {' '}→ {loyaltyProgress.nextTier}
              {loyaltyProgress.currentVisits + 1 >= loyaltyProgress.requiredVisits && ' 🎉'}
            </ThemedText>
          </View>
        </View>
      )}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: 18,
    padding: 18,
    gap: 12,
    borderWidth: 1.5,
    borderColor: colors.lightMustard + '55',
    shadowColor: colors.nileBlue,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.tint.green,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  earningsRow: {
    backgroundColor: colors.tint.greenLight,
    borderRadius: 10,
    padding: 10,
    marginHorizontal: -2,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.tint.coolGray,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  earningsIcon: {
    backgroundColor: 'transparent',
  },
  rowEmoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 12,
    color: colors.gray[500],
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  earningsValue: {
    color: colors.success,
    fontSize: 15,
    fontWeight: '700',
  },
  newBalance: {
    fontSize: 12,
    color: colors.gray[500],
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
  },
  streakActiveText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.warning,
  },
  streakInactiveText: {
    fontSize: 13,
    color: colors.gray[500],
  },
  tierText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.lightMustard,
  },
});

export default React.memo(PrePaymentSummary);
