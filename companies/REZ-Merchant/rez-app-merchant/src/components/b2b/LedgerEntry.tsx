/**
 * LedgerEntry Component
 * Displays credit/debit entry with running balance
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { LedgerEntry as LedgerEntryType, LedgerEntryType as EntryType } from '@/services/b2bApi';

interface LedgerEntryProps {
  entry: LedgerEntryType;
  onPress?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  style?: ViewStyle;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
};

export function LedgerEntryComponent({
  entry,
  onPress,
  isFirst = false,
  isLast = false,
  style,
}: LedgerEntryProps): React.JSX.Element {
  const isCredit = entry.type === 'credit';
  const amountColor = isCredit ? colors.success[600] : colors.error[600];
  const amountPrefix = isCredit ? '+' : '-';

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityRole="button"
      accessibilityLabel={`${entry.type} entry of ${formatCurrency(entry.amount)}`}
    >
      {/* Timeline connector */}
      <View style={styles.timeline}>
        {!isFirst && <View style={styles.lineTop} />}
        <View
          style={[
            styles.dot,
            { backgroundColor: isCredit ? colors.success[500] : colors.error[500] },
          ]}
        />
        {!isLast && <View style={styles.lineBottom} />}
      </View>

      {/* Entry content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.type}>
              {isCredit ? 'Credit' : 'Debit'}
            </Text>
            {entry.referenceNumber && (
              <Text style={styles.reference}>#{entry.referenceNumber}</Text>
            )}
          </View>
          <Text style={[styles.amount, { color: amountColor }]}>
            {amountPrefix} {formatCurrency(entry.amount)}
          </Text>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {entry.description}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.date}>
            {formatDate(entry.createdAt)} at {formatTime(entry.createdAt)}
          </Text>
          {entry.paymentMethod && (
            <View style={styles.paymentBadge}>
              <Text style={styles.paymentBadgeText}>
                {PAYMENT_METHOD_LABELS[entry.paymentMethod] || entry.paymentMethod}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Running balance */}
      <View style={styles.balanceSection}>
        <Text style={styles.balanceLabel}>Balance</Text>
        <Text
          style={[
            styles.balanceValue,
            { color: entry.runningBalance >= 0 ? colors.success[600] : colors.error[600] },
          ]}
        >
          {formatCurrency(Math.abs(entry.runningBalance))}
        </Text>
        {entry.runningBalance < 0 && (
          <Text style={styles.balanceNote}>You owe</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 80,
  } as ViewStyle,
  timeline: {
    width: 24,
    alignItems: 'center',
    marginRight: spacing.sm,
  } as ViewStyle,
  lineTop: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border.default,
  } as ViewStyle,
  lineBottom: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border.default,
  } as ViewStyle,
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.surface.primary,
  } as ViewStyle,
  content: {
    flex: 1,
    paddingBottom: spacing.md,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  } as ViewStyle,
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  } as ViewStyle,
  type: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  } as TextStyle,
  reference: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  } as TextStyle,
  amount: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  } as TextStyle,
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  } as TextStyle,
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  date: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  } as TextStyle,
  paymentBadge: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  } as ViewStyle,
  paymentBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary[600],
  } as TextStyle,
  balanceSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: spacing.md,
    borderLeftWidth: 1,
    borderLeftColor: colors.border.light,
    marginLeft: spacing.sm,
    minWidth: 80,
  } as ViewStyle,
  balanceLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginBottom: 2,
  } as TextStyle,
  balanceValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  } as TextStyle,
  balanceNote: {
    fontSize: typography.fontSize.xs,
    color: colors.error[500],
  } as TextStyle,
});

export default LedgerEntryComponent;
