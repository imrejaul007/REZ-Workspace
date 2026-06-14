/**
 * OrderCard Component
 * Displays purchase order with status, amount, and supplier info
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
import { PurchaseOrder, OrderStatus } from '@/services/b2bApi';

interface OrderCardProps {
  order: PurchaseOrder;
  onPress?: () => void;
  onApprove?: () => void;
  onMarkDelivered?: () => void;
  onMarkPaid?: () => void;
  style?: ViewStyle;
}

const STATUS_CONFIG: Record<OrderStatus, { variant: 'success' | 'error' | 'warning' | 'info' | 'default'; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  approved: { variant: 'info', label: 'Approved' },
  delivered: { variant: 'success', label: 'Delivered' },
  paid: { variant: 'success', label: 'Paid' },
  cancelled: { variant: 'error', label: 'Cancelled' },
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
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export function OrderCard({
  order,
  onPress,
  onApprove,
  onMarkDelivered,
  onMarkPaid,
  style,
}: OrderCardProps): React.JSX.Element {
  const statusConfig = STATUS_CONFIG[order.status];
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const pendingAmount = order.totalAmount - order.paidAmount;

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityRole="button"
      accessibilityLabel={`Order ${order.orderNumber}`}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.supplierName}>{order.supplierName}</Text>
        </View>
        <Badge label={statusConfig.label} variant={statusConfig.variant} />
      </View>

      <View style={styles.divider} />

      <View style={styles.amountSection}>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Total</Text>
          <Text style={styles.amountValue}>{formatCurrency(order.totalAmount)}</Text>
        </View>
        {order.paidAmount > 0 && (
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Paid</Text>
            <Text style={[styles.amountValue, styles.paidAmount]}>
              {formatCurrency(order.paidAmount)}
            </Text>
          </View>
        )}
        {pendingAmount > 0 && (
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Pending</Text>
            <Text style={[styles.amountValue, styles.pendingAmount]}>
              {formatCurrency(pendingAmount)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Items</Text>
          <Text style={styles.detailValue}>
            {order.items.length} products ({itemCount} qty)
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Order Date</Text>
          <Text style={styles.detailValue}>{formatDate(order.orderDate)}</Text>
        </View>
        {order.expectedDelivery && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Expected</Text>
            <Text style={styles.detailValue}>
              {formatDate(order.expectedDelivery)}
            </Text>
          </View>
        )}
      </View>

      {order.status === 'pending' && onApprove && (
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={onApprove}
          accessibilityRole="button"
          accessibilityLabel="Approve order"
        >
          <Text style={[styles.actionButtonText, styles.approveButtonText]}>
            Approve Order
          </Text>
        </TouchableOpacity>
      )}

      {order.status === 'approved' && onMarkDelivered && (
        <TouchableOpacity
          style={[styles.actionButton, styles.deliverButton]}
          onPress={onMarkDelivered}
          accessibilityRole="button"
          accessibilityLabel="Mark as delivered"
        >
          <Text style={[styles.actionButtonText, styles.deliverButtonText]}>
            Mark Delivered
          </Text>
        </TouchableOpacity>
      )}

      {order.status === 'delivered' && pendingAmount > 0 && onMarkPaid && (
        <TouchableOpacity
          style={[styles.actionButton, styles.payButton]}
          onPress={onMarkPaid}
          accessibilityRole="button"
          accessibilityLabel="Record payment"
        >
          <Text style={[styles.actionButtonText, styles.payButtonText]}>
            Record Payment ({formatCurrency(pendingAmount)})
          </Text>
        </TouchableOpacity>
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
    flex: 1,
    marginRight: spacing.md,
  } as ViewStyle,
  orderNumber: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  } as TextStyle,
  supplierName: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  } as TextStyle,
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.md,
  } as ViewStyle,
  amountSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  amountItem: {
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,
  amountLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginBottom: 4,
  } as TextStyle,
  amountValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  } as TextStyle,
  paidAmount: {
    color: colors.success[600],
  } as TextStyle,
  pendingAmount: {
    color: colors.error[600],
  } as TextStyle,
  details: {
    gap: spacing.sm,
  } as ViewStyle,
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  detailLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  } as TextStyle,
  detailValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  } as TextStyle,
  actionButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  } as ViewStyle,
  approveButton: {
    backgroundColor: colors.primary[500],
  } as ViewStyle,
  deliverButton: {
    backgroundColor: colors.success[500],
  } as ViewStyle,
  payButton: {
    backgroundColor: colors.primary[500],
  } as ViewStyle,
  actionButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  } as TextStyle,
  approveButtonText: {
    color: colors.text.inverse,
  } as TextStyle,
  deliverButtonText: {
    color: colors.text.inverse,
  } as TextStyle,
  payButtonText: {
    color: colors.text.inverse,
  } as TextStyle,
});

export default OrderCard;
