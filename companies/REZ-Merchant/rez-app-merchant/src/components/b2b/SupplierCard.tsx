/**
 * SupplierCard Component
 * Displays supplier information with credit status badge
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
import { Supplier } from '@/services/b2bApi';

interface SupplierCardProps {
  supplier: Supplier;
  onPress?: () => void;
  onEdit?: () => void;
  style?: ViewStyle;
}

const CREDIT_STATUS_CONFIG = {
  active: { variant: 'success' as const, label: 'Active' },
  blocked: { variant: 'error' as const, label: 'Blocked' },
  pending: { variant: 'warning' as const, label: 'Pending' },
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export function SupplierCard({
  supplier,
  onPress,
  onEdit,
  style,
}: SupplierCardProps): React.JSX.Element {
  const creditStatusConfig = CREDIT_STATUS_CONFIG[supplier.creditStatus];
  const hasCredit = supplier.creditLimit && supplier.creditLimit > 0;
  const creditUtilized = hasCredit
    ? ((supplier.creditBalance / supplier.creditLimit!) * 100).toFixed(0)
    : null;

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityRole="button"
      accessibilityLabel={`Supplier ${supplier.name}`}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {supplier.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.name} numberOfLines={1}>
              {supplier.name}
            </Text>
            <Text style={styles.phone}>{supplier.phone}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Badge
            label={creditStatusConfig.label}
            variant={creditStatusConfig.variant}
          />
          {onEdit && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={onEdit}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${supplier.name}`}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Orders</Text>
          <Text style={styles.statValue}>{supplier.totalOrders}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Spent</Text>
          <Text style={styles.statValue}>{formatCurrency(supplier.totalSpent)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Last Order</Text>
          <Text style={styles.statValue}>{formatDate(supplier.lastOrderDate)}</Text>
        </View>
      </View>

      {hasCredit && (
        <>
          <View style={styles.divider} />
          <View style={styles.creditSection}>
            <View style={styles.creditHeader}>
              <Text style={styles.creditLabel}>Credit Balance</Text>
              <Text style={styles.creditBalance}>
                {formatCurrency(supplier.creditBalance)}
              </Text>
            </View>
            <View style={styles.creditBar}>
              <View
                style={[
                  styles.creditProgress,
                  {
                    width: `${Math.min(parseFloat(creditUtilized || '0'), 100)}%`,
                    backgroundColor:
                      parseFloat(creditUtilized || '0') > 80
                        ? colors.errorMain
                        : parseFloat(creditUtilized || '0') > 50
                        ? colors.warningMain
                        : colors.successMain,
                  },
                ]}
              />
            </View>
            <View style={styles.creditFooter}>
              <Text style={styles.creditUsed}>{creditUtilized}% used</Text>
              <Text style={styles.creditLimit}>
                Limit: {formatCurrency(supplier.creditLimit!)}
              </Text>
            </View>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    ...shadows.md,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  } as ViewStyle,
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,
  avatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  avatarText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  } as TextStyle,
  headerInfo: {
    marginLeft: spacing.md,
    flex: 1,
  } as ViewStyle,
  name: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  } as TextStyle,
  phone: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  } as TextStyle,
  headerRight: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  } as ViewStyle,
  editButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.sm,
  } as ViewStyle,
  editButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary[600],
  } as TextStyle,
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.md,
  } as ViewStyle,
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  statItem: {
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginBottom: 4,
  } as TextStyle,
  statValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  } as TextStyle,
  creditSection: {
    gap: spacing.sm,
  } as ViewStyle,
  creditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  creditLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  } as TextStyle,
  creditBalance: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  } as TextStyle,
  creditBar: {
    height: 8,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  } as ViewStyle,
  creditProgress: {
    height: '100%',
    borderRadius: borderRadius.full,
  } as ViewStyle,
  creditFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  creditUsed: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  } as TextStyle,
  creditLimit: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  } as TextStyle,
});

export default SupplierCard;
