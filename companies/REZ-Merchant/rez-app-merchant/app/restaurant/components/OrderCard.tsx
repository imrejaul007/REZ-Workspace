/**
 * OrderCard Component
 * Displays order summary for restaurant management
 */

import React, { memo, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '@/constants/DesignTokens';
import { format, parseISO } from 'date-fns';

interface OrderItem {
  name: string;
  quantity: number;
  price?: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status?: string;
  items: OrderItem[];
  totalAmount?: number;
  customerName?: string;
  orderType?: 'dine_in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  createdAt?: string;
  platform?: string;
  paymentStatus?: string;
}

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
  showStatus?: boolean;
  compact?: boolean;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  containerCompact: {
    padding: Spacing.sm,
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  customerName: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary[500],
  },
  orderTime: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemsList: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    minWidth: 24,
  },
  itemName: {
    fontSize: 14,
    color: Colors.text.primary,
    flex: 1,
  },
  itemPrice: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
  },
  moreItems: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '500',
  },
  viewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary[500],
  },
  actionButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; label: string }> = {
  placed: { color: Colors.success[700], bgColor: Colors.success[100], label: 'New' },
  confirmed: { color: Colors.info[700], bgColor: Colors.info[100], label: 'Confirmed' },
  preparing: { color: Colors.warning[700], bgColor: Colors.warning[100], label: 'Preparing' },
  ready: { color: Colors.primary[700], bgColor: Colors.primary[100], label: 'Ready' },
  dispatched: { color: Colors.primary[700], bgColor: Colors.primary[100], label: 'Dispatched' },
  delivered: { color: Colors.success[700], bgColor: Colors.success[100], label: 'Delivered' },
  cancelled: { color: Colors.error[700], bgColor: Colors.error[100], label: 'Cancelled' },
};

const ORDER_TYPE_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bgColor: string; label: string }> = {
  dine_in: {
    icon: 'restaurant-outline',
    color: Colors.primary[700],
    bgColor: Colors.primary[100],
    label: 'Dine-In',
  },
  takeaway: {
    icon: 'takeout-outline',
    color: Colors.warning[700],
    bgColor: Colors.warning[100],
    label: 'Takeaway',
  },
  delivery: {
    icon: 'bicycle-outline',
    color: Colors.success[700],
    bgColor: Colors.success[100],
    label: 'Delivery',
  },
};

const PLATFORM_CONFIG: Record<string, { color: string; bgColor: string; label: string }> = {
  swiggy: { color: '#FF5200', bgColor: '#FFF0E6', label: 'Swiggy' },
  zomato: { color: '#E23744', bgColor: '#FFE6E8', label: 'Zomato' },
};

export const OrderCard = memo<OrderCardProps>(({ order, onPress, showStatus = false, compact = false }) => {
  const orderTypeConfig = ORDER_TYPE_CONFIG[order.orderType || 'dine_in'];
  const platformConfig = order.platform ? PLATFORM_CONFIG[order.platform] : null;
  const statusConfig = order.status ? STATUS_CONFIG[order.status] : null;

  const formattedTime = useMemo(() => {
    if (!order.createdAt) return '';
    try {
      return format(parseISO(order.createdAt), 'h:mm a');
    } catch {
      return '';
    }
  }, [order.createdAt]);

  const displayedItems = compact ? order.items.slice(0, 3) : order.items;
  const remainingCount = order.items.length - displayedItems.length;

  const handlePress = () => {
    onPress?.();
  };

  return (
    <TouchableOpacity
      style={[styles.container, compact && styles.containerCompact]}
      onPress={handlePress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          {order.customerName && (
            <Text style={styles.customerName}>{order.customerName}</Text>
          )}
          {order.tableNumber && (
            <Text style={styles.customerName}>Table {order.tableNumber}</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          {order.totalAmount !== undefined && (
            <Text style={styles.totalAmount}>
              {Colors.typography.price.display({ value: order.totalAmount })}
            </Text>
          )}
          {formattedTime && (
            <Text style={styles.orderTime}>{formattedTime}</Text>
          )}
        </View>
      </View>

      {/* Badges */}
      <View style={styles.badges}>
        <View style={[styles.badge, { backgroundColor: orderTypeConfig.bgColor }]}>
          <Ionicons name={orderTypeConfig.icon} size={12} color={orderTypeConfig.color} />
          <Text style={[styles.badgeText, { color: orderTypeConfig.color }]}>
            {orderTypeConfig.label}
          </Text>
        </View>

        {platformConfig && (
          <View style={[styles.badge, { backgroundColor: platformConfig.bgColor }]}>
            <Text style={[styles.badgeText, { color: platformConfig.color }]}>
              {platformConfig.label}
            </Text>
          </View>
        )}

        {showStatus && statusConfig && (
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        )}

        {order.paymentStatus && (
          <View style={[
            styles.badge,
            {
              backgroundColor: order.paymentStatus === 'paid'
                ? Colors.success[100]
                : Colors.warning[100],
            },
          ]}>
            <Ionicons
              name={order.paymentStatus === 'paid' ? 'checkmark-circle' : 'time'}
              size={12}
              color={order.paymentStatus === 'paid' ? Colors.success[700] : Colors.warning[700]}
            />
            <Text style={[
              styles.badgeText,
              { color: order.paymentStatus === 'paid' ? Colors.success[700] : Colors.warning[700] },
            ]}>
              {order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
            </Text>
          </View>
        )}
      </View>

      {/* Items */}
      <View style={styles.itemsList}>
        {displayedItems.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemQuantity}>{item.quantity}x</Text>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
            {item.price !== undefined && (
              <Text style={styles.itemPrice}>
                {Colors.typography.price.display({ value: item.price * item.quantity })}
              </Text>
            )}
          </View>
        ))}
        {remainingCount > 0 && (
          <Text style={styles.moreItems}>
            +{remainingCount} more item{remainingCount > 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {order.paymentStatus && (
          <View style={styles.paymentStatus}>
            <Ionicons
              name={order.paymentStatus === 'paid' ? 'checkmark-circle' : 'time-outline'}
              size={14}
              color={order.paymentStatus === 'paid' ? Colors.success[500] : Colors.warning[500]}
            />
            <Text style={[
              styles.paymentText,
              { color: order.paymentStatus === 'paid' ? Colors.success[600] : Colors.warning[600] },
            ]}>
              {order.paymentStatus === 'paid' ? 'Payment Received' : 'Awaiting Payment'}
            </Text>
          </View>
        )}
        {onPress && (
          <View style={styles.viewDetails}>
            <Text style={styles.viewDetailsText}>View Details</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.primary[500]} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

OrderCard.displayName = 'OrderCard';

export default OrderCard;
