import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../constants/config';
import { ExpenseClaim } from '../types';
import { format } from 'date-fns';

interface ExpenseCardProps {
  claim: ExpenseClaim;
  onPress?: () => void;
}

const getStatusColor = (status: ExpenseClaim['status']) => {
  switch (status) {
    case 'reimbursed': return COLORS.success;
    case 'approved': return COLORS.secondary;
    case 'rejected': return COLORS.error;
    case 'submitted': return COLORS.warning;
    default: return COLORS.textMuted;
  }
};

const getClaimTypeIcon = (type: ExpenseClaim['claimType']) => {
  const icons: Record<string, string> = {
    travel: '✈️',
    meals: '🍽️',
    accommodation: '🏨',
    communication: '📱',
    equipment: '💻',
    training: '📚',
    other: '📋',
  };
  return icons[type] || '📋';
};

const getClaimTypeLabel = (type: ExpenseClaim['claimType']) => {
  const labels: Record<string, string> = {
    travel: 'Travel',
    meals: 'Meals',
    accommodation: 'Accommodation',
    communication: 'Communication',
    equipment: 'Equipment',
    training: 'Training',
    other: 'Other',
  };
  return labels[type] || type;
};

export const ExpenseCard: React.FC<ExpenseCardProps> = ({ claim, onPress }) => {
  const expenseDate = new Date(claim.expenseDate);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{getClaimTypeIcon(claim.claimType)}</Text>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.type}>{getClaimTypeLabel(claim.claimType)}</Text>
          <Text style={styles.claimNumber}>{claim.claimNumber}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>{claim.currency} {claim.amount.toFixed(2)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(claim.status) }]}>
            <Text style={styles.statusText}>{claim.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.description}>
        <Text style={styles.descriptionText} numberOfLines={2}>{claim.description}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.date}>{format(expenseDate, 'MMM d, yyyy')}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  icon: {
    fontSize: 24,
  },
  titleContainer: {
    flex: 1,
  },
  type: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  claimNumber: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.text,
  },
  description: {
    marginBottom: SPACING.md,
  },
  descriptionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  date: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
});

export default ExpenseCard;
