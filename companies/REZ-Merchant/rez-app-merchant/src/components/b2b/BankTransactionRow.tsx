/**
 * BankTransactionRow Component
 * Displays matched/unmatched bank transaction
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
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { Badge } from '@/components/common/Badge';
import { BankTransaction, TransactionStatus, MatchConfidence } from '@/services/b2bApi';

interface BankTransactionRowProps {
  transaction: BankTransaction;
  onPress?: () => void;
  onMatch?: () => void;
  onUnmatch?: () => void;
  style?: ViewStyle;
}

const STATUS_CONFIG: Record<TransactionStatus, { variant: 'success' | 'error' | 'warning' | 'info' | 'default'; label: string }> = {
  matched: { variant: 'success', label: 'Matched' },
  unmatched: { variant: 'warning', label: 'Unmatched' },
  disputed: { variant: 'error', label: 'Disputed' },
};

const CONFIDENCE_CONFIG: Record<MatchConfidence, { label: string; color: string }> = {
  high: { label: 'High', color: colors.success[600] },
  medium: { label: 'Medium', color: colors.warning[600] },
  low: { label: 'Low', color: colors.error[600] },
};

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
    year: 'numeric',
  });
};

export function BankTransactionRow({
  transaction,
  onPress,
  onMatch,
  onUnmatch,
  style,
}: BankTransactionRowProps): React.JSX.Element {
  const statusConfig = STATUS_CONFIG[transaction.status];
  const isMatched = transaction.status === 'matched';
  const isUnmatched = transaction.status === 'unmatched';

  return (
    <TouchableOpacity
      style={[styles.container, style, isMatched && styles.matchedContainer]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityRole="button"
      accessibilityLabel={`Bank transaction of ${formatCurrency(transaction.amount)}`}
    >
      {/* Status indicator */}
      <View
        style={[
          styles.statusIndicator,
          {
            backgroundColor: isMatched
              ? colors.success[500]
              : isUnmatched
              ? colors.warning[500]
              : colors.error[500],
          },
        ]}
      />

      {/* Main content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.amount}>
              {formatCurrency(transaction.amount)}
            </Text>
            {transaction.bankName && (
              <Text style={styles.bankName}>{transaction.bankName}</Text>
            )}
          </View>
          <Badge label={statusConfig.label} variant={statusConfig.variant} />
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {transaction.description}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.date}>{formatDate(transaction.transactionDate)}</Text>
          {transaction.reference && (
            <Text style={styles.reference}>Ref: {transaction.reference}</Text>
          )}
        </View>

        {/* Match details */}
        {isMatched && transaction.matchConfidence && (
          <View style={styles.matchDetails}>
            <View style={styles.matchInfo}>
              <Text style={styles.matchLabel}>Match Confidence:</Text>
              <Text
                style={[
                  styles.matchValue,
                  { color: CONFIDENCE_CONFIG[transaction.matchConfidence].color },
                ]}
              >
                {CONFIDENCE_CONFIG[transaction.matchConfidence].label}
              </Text>
            </View>
            {transaction.matchedAt && (
              <Text style={styles.matchedAt}>
                Matched: {formatDate(transaction.matchedAt)}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        {isUnmatched && onMatch && (
          <TouchableOpacity
            style={[styles.actionButton, styles.matchButton]}
            onPress={onMatch}
            accessibilityRole="button"
            accessibilityLabel="Match transaction"
          >
            <Text style={[styles.actionButtonText, styles.matchButtonText]}>
              Match
            </Text>
          </TouchableOpacity>
        )}
        {isMatched && onUnmatch && (
          <TouchableOpacity
            style={[styles.actionButton, styles.unmatchButton]}
            onPress={onUnmatch}
            accessibilityRole="button"
            accessibilityLabel="Unmatch transaction"
          >
            <Text style={[styles.actionButtonText, styles.unmatchButtonText]}>
              Unmatch
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  } as ViewStyle,
  matchedContainer: {
    backgroundColor: colors.success[50],
  } as ViewStyle,
  statusIndicator: {
    width: 4,
  } as ViewStyle,
  content: {
    flex: 1,
    padding: spacing.md,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  } as ViewStyle,
  headerLeft: {
    flex: 1,
    marginRight: spacing.md,
  } as ViewStyle,
  amount: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  } as TextStyle,
  bankName: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  } as TextStyle,
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
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
  reference: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  } as TextStyle,
  matchDetails: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  } as ViewStyle,
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  } as ViewStyle,
  matchLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  } as TextStyle,
  matchValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  } as TextStyle,
  matchedAt: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  } as TextStyle,
  actions: {
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  } as ViewStyle,
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 70,
    alignItems: 'center',
  } as ViewStyle,
  matchButton: {
    backgroundColor: colors.success[500],
  } as ViewStyle,
  unmatchButton: {
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.border.default,
  } as ViewStyle,
  actionButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  } as TextStyle,
  matchButtonText: {
    color: colors.text.inverse,
  } as TextStyle,
  unmatchButtonText: {
    color: colors.text.secondary,
  } as TextStyle,
});

export default BankTransactionRow;
