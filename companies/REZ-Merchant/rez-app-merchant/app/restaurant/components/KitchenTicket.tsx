/**
 * KitchenTicket Component
 * Displays a kitchen order ticket for KDS (Kitchen Display System)
 */

import React, { memo, useMemo, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/DesignTokens';

interface TicketItem {
  id: string;
  name: string;
  quantity: number;
  specialInstructions?: string;
  course?: 'STARTER' | 'MAIN' | 'DESSERT';
  modifiers?: string[];
  allergens?: string[];
}

interface KitchenOrder {
  id: string;
  orderNumber: string;
  status: 'new' | 'preparing' | 'ready';
  items: TicketItem[];
  customerName?: string;
  tableNumber?: string;
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  platform?: string;
  createdAt: string;
  priority?: 'normal' | 'rush';
}

interface KitchenTicketProps {
  order: KitchenOrder;
  elapsedSeconds: number;
  elapsedColor: string;
  onAction: () => void;
  onTimerUpdate?: number;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
  },
  containerNew: {
    borderColor: Colors.success[500],
    backgroundColor: Colors.success[50],
  },
  containerPreparing: {
    borderColor: Colors.warning[500],
    backgroundColor: Colors.warning[50],
  },
  containerReady: {
    borderColor: Colors.success[600],
    backgroundColor: Colors.success[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  headerLeft: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  platformBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  platformBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  rushBadge: {
    backgroundColor: Colors.error[500],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rushBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Menlo',
  },
  tableNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  itemsContainer: {
    padding: Spacing.sm,
  },
  itemsList: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  itemQuantity: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    minWidth: 28,
    textAlign: 'right',
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  courseBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
  },
  allergenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    fontSize: 10,
    color: Colors.error[600],
    fontWeight: '600',
  },
  modifiers: {
    fontSize: 11,
    color: Colors.info[600],
    marginTop: 2,
    fontStyle: 'italic',
  },
  specialInstructions: {
    marginTop: 4,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: Colors.warning[400],
  },
  specialText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
    borderRadius: 6,
  },
  actionButtonNew: {
    backgroundColor: Colors.warning[500],
  },
  actionButtonPreparing: {
    backgroundColor: Colors.success[500],
  },
  actionButtonReady: {
    backgroundColor: Colors.error[500],
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  customerName: {
    fontSize: 11,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
});

const PLATFORM_CONFIG: Record<string, { label: string; color: string }> = {
  dine_in: { label: 'DINE-IN', color: Colors.primary[500] },
  takeaway: { label: 'TAKEAWAY', color: Colors.warning[600] },
  swiggy: { label: 'SWIGGY', color: '#FF5200' },
  zomato: { label: 'ZOMATO', color: '#E23744' },
  delivery_app: { label: 'DELIVERY', color: Colors.success[600] },
};

const COURSE_COLORS: Record<string, string> = {
  STARTER: Colors.primary[500],
  MAIN: Colors.success[500],
  DESSERT: Colors.warning[500],
};

const formatTime = (totalSeconds: number): string => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const KitchenTicket = memo<KitchenTicketProps>(({
  order,
  elapsedSeconds,
  elapsedColor,
  onAction,
  onTimerUpdate,
}) => {
  const [displaySeconds, setDisplaySeconds] = useState(elapsedSeconds);

  // Update timer display
  useEffect(() => {
    setDisplaySeconds(elapsedSeconds);
  }, [elapsedSeconds, onTimerUpdate]);

  const platformConfig = order.platform
    ? PLATFORM_CONFIG[order.platform]
    : PLATFORM_CONFIG[order.orderType];

  const getContainerStyle = () => {
    switch (order.status) {
      case 'new':
        return styles.containerNew;
      case 'preparing':
        return styles.containerPreparing;
      case 'ready':
        return styles.containerReady;
      default:
        return {};
    }
  };

  const getActionStyle = () => {
    switch (order.status) {
      case 'new':
        return styles.actionButtonNew;
      case 'preparing':
        return styles.actionButtonPreparing;
      case 'ready':
        return styles.actionButtonReady;
      default:
        return {};
    }
  };

  const getActionLabel = () => {
    switch (order.status) {
      case 'new':
        return 'Start Cooking';
      case 'preparing':
        return 'Mark Ready';
      case 'ready':
        return 'Picked Up';
      default:
        return 'Update';
    }
  };

  const getActionIcon = () => {
    switch (order.status) {
      case 'new':
        return 'flame-outline';
      case 'preparing':
        return 'checkmark-outline';
      case 'ready':
        return 'bag-handle-outline';
      default:
        return 'refresh-outline';
    }
  };

  return (
    <View style={[styles.container, getContainerStyle()]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.orderNumber}>ORDER #{order.orderNumber}</Text>
          <View style={styles.badges}>
            {platformConfig && (
              <View style={[styles.platformBadge, { backgroundColor: platformConfig.color }]}>
                <Text style={styles.platformBadgeText}>{platformConfig.label}</Text>
              </View>
            )}
            {order.priority === 'rush' && (
              <View style={styles.rushBadge}>
                <Ionicons name="flash" size={10} color="#fff" />
                <Text style={styles.rushBadgeText}>RUSH</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={[styles.timerBadge, { borderColor: elapsedColor, borderWidth: 1 }]}>
            <Ionicons name="time-outline" size={14} color={elapsedColor} />
            <Text style={[styles.timerText, { color: elapsedColor }]}>
              {formatTime(displaySeconds)}
            </Text>
          </View>
          {order.tableNumber && (
            <Text style={styles.tableNumber}>TABLE {order.tableNumber}</Text>
          )}
        </View>
      </View>

      {/* Customer Info */}
      {(order.customerName || order.tableNumber) && (
        <View style={styles.customerInfo}>
          <Ionicons name="person-outline" size={12} color={Colors.text.tertiary} />
          <Text style={styles.customerName}>
            {order.tableNumber ? `Table ${order.tableNumber}` : order.customerName}
          </Text>
        </View>
      )}

      {/* Items */}
      <View style={styles.itemsContainer}>
        <View style={styles.itemsList}>
          {order.items.map(item => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemQuantity}>{item.quantity}x</Text>
              <View style={styles.itemContent}>
                <View style={styles.itemHeader}>
                  {item.course && (
                    <View
                      style={[
                        styles.courseBadge,
                        { backgroundColor: COURSE_COLORS[item.course] || Colors.gray[500] },
                      ]}
                    >
                      <Text style={styles.courseBadge}>{item.course[0]}</Text>
                    </View>
                  )}
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.allergens && item.allergens.length > 0 && (
                    <View style={styles.allergenBadge}>
                      <Ionicons name="warning" size={10} color={Colors.error[600]} />
                      <Text style={styles.allergenBadge}>{item.allergens.length}</Text>
                    </View>
                  )}
                </View>

                {item.modifiers && item.modifiers.length > 0 && (
                  <Text style={styles.modifiers}>{item.modifiers.join(', ')}</Text>
                )}

                {item.specialInstructions && (
                  <View style={styles.specialInstructions}>
                    <Text style={styles.specialText}>"{item.specialInstructions}"</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[styles.actionButton, getActionStyle()]}
        onPress={onAction}
        activeOpacity={0.8}
      >
        <Ionicons name={getActionIcon()} size={18} color="#fff" />
        <Text style={styles.actionButtonText}>{getActionLabel()}</Text>
      </TouchableOpacity>
    </View>
  );
});

KitchenTicket.displayName = 'KitchenTicket';

export default KitchenTicket;
