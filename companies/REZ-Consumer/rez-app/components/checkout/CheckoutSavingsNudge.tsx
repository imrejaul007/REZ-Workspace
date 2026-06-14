/**
 * CheckoutSavingsNudge — Pre-payment savings motivator.
 *
 * Shows above the bill summary: "You're saving ₹87 on this order!"
 * Combined with average savings per visit for social proof.
 * Only renders when totalSavings > 0.
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { Spacing, BorderRadius } from '@/constants/DesignSystem';

interface CheckoutSavingsNudgeProps {
  totalSavings: number;
  avgPerVisit?: number;
  currencySymbol?: string;
}

function CheckoutSavingsNudge({
  totalSavings,
  avgPerVisit,
  currencySymbol = '₹',
}: CheckoutSavingsNudgeProps) {
  if (totalSavings <= 0) return null;

  const savingsText = `${currencySymbol}${Math.round(totalSavings)}`;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.iconBadge}>
          <Ionicons name="wallet" size={16} color="#16A34A" />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.headline}>
            You're saving {savingsText} on this order!
          </Text>
          {avgPerVisit != null && avgPerVisit > 0 && (
            <Text style={styles.subline}>
              You save ~{currencySymbol}{Math.round(avgPerVisit)} per visit on REZ
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0FDF4',
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  headline: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
    letterSpacing: -0.2,
  },
  subline: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4ADE80',
    marginTop: 2,
  },
});

export default memo(CheckoutSavingsNudge);
