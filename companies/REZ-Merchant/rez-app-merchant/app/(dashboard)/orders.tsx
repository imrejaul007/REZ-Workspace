// MED-5 FIX: Move function definition after imports
import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Pressable,
  Modal,
  Text,
  ActivityIndicator,
  Animated as RNAnimated,
} from 'react-native';
import { platformAlertDestructive } from '@/utils/platformAlert';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FlashList, FlashListProps } from '@shopify/flash-list';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeInRight,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';

import { Colors, Spacing, Shadows, BorderRadius, Typography } from '@/constants/DesignTokens';
import {
  Card,
  Heading2,
  Heading3,
  BodyText,
  Caption,
  Badge,
  Button,
} from '@/components/ui/DesignSystemComponents';
import { useOrdersDashboard, StatusFilter } from '@/hooks/useOrdersDashboard';
import {
  useWebOrders,
  WEB_ORDER_STATUS_COLORS,
  WEB_ORDER_STATUS_LABELS,
  WebOrder as WebOrderType,
  WebOrderStatus,
} from '@/hooks/useWebOrders';
import type { Order, OrderStatus } from '@/types/api';
import { useSocket } from '@/contexts/SocketContext';
import { useStore } from '@/contexts/StoreContext';
import { apiClient } from '@/services/api/client';
import { logger } from '@/utils/logger';

const { width } = Dimensions.get('window');

// MER-MED-11 FIX: Define a typed FlashList wrapper that includes estimatedItemSize.
// FlashListProps in @shopify/flash-list v4+ does not include estimatedItemSize in its
// type definition (library limitation), so we extend the type to include it.
// This replaces the previous untyped FlashList pattern which bypassed all type checking.
type TypedFlashListProps<T> = FlashListProps<T> & { estimatedItemSize?: number };

function TypedFlashList<T>(props: TypedFlashListProps<T>) {
  return <FlashList {...props} />;
}

// MED-5 FIX: Define utility function after all imports
const normalizeOrderStatus = (status: string): string => status?.toLowerCase?.() ?? status;

const statusColors: Record<string, string> = {
  placed: Colors.warning[500],
  confirmed: Colors.primary[500],
  preparing: Colors.warning[600],
  ready: Colors.success[500],
  dispatched: Colors.primary[600],
  delivered: Colors.success[600],
  cancelled: Colors.error[500],
  returned: Colors.warning[700],
  refunded: Colors.gray[500],
};

const statusLabels: Record<string, string> = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  dispatched: 'Dispatched',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
  refunded: 'Refunded',
};

// ==================== StatusTab ====================

interface StatusTabProps {
  status: StatusFilter;
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}

const StatusTab = ({ status, label, count, active, onPress }: StatusTabProps) => (
  <Pressable
    style={[
      styles.statusTab,
      active && styles.activeStatusTab,
      active && {
        backgroundColor:
          status === 'all'
            ? Colors.primary[500]
            : statusColors[status as OrderStatus] || Colors.primary[500],
        borderColor: 'transparent',
      },
    ]}
    onPress={onPress}
  >
    <BodyText style={[styles.statusTabText, active && styles.activeStatusTabText]}>
      {label}
    </BodyText>
    <View style={[styles.statusCount, active && styles.activeStatusCount]}>
      <Caption style={[styles.statusCountText, active && styles.activeStatusCountText]}>
        {count}
      </Caption>
    </View>
  </Pressable>
);

// ==================== OrderCard ====================

interface OrderCardProps {
  order: Order;
  onPress: () => void;
  onQuickAction: (orderId: string, action: string) => void;
  onUpdateStatus: (orderId: string, currentStatus: string) => void;
  index: number;
}

const formatAddress = (address) => {
  if (typeof address === 'string') return address;
  if (!address) return 'No address';
  return (
    [address.addressLine1, address.city, address.state, address.pincode]
      .filter(Boolean)
      .join(', ') || 'No address'
  );
};

const paymentMethodIcon = (method: string) => {
  switch (method?.toLowerCase()) {
    case 'razorpay':
      return 'card';
    case 'wallet':
      return 'wallet';
    case 'cod':
      return 'cash';
    case 'upi':
      return 'phone-portrait';
    default:
      return 'card';
  }
};

const OrderCard = ({ order, onPress, onQuickAction, onUpdateStatus, index }: OrderCardProps) => {
  const scale = useSharedValue(1);

  const timeAgo = React.useMemo(() => {
    if (!order.createdAt) return 'Unknown';
    const diffInMinutes = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  }, [order.createdAt]);

  const normalizedOrderStatus = normalizeOrderStatus(order.status as string);
  const isUrgent =
    order.priority === 'urgent' ||
    ((normalizedOrderStatus === 'pending' || normalizedOrderStatus === 'confirmed') &&
      order.createdAt &&
      Date.now() - new Date(order.createdAt).getTime() > 7200000);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const orderId = order.id || order._id;
  const statusColor = statusColors[order.status as OrderStatus] || Colors.primary[500];

  // Canonical transitions — must match backend orderStateMachine.ts
  const STATUS_TRANSITIONS: Record<string, string[]> = {
    placed: ['confirmed', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['dispatched', 'cancelled'],
    dispatched: ['out_for_delivery', 'delivered', 'cancelled'],
    out_for_delivery: ['delivered', 'cancelled'],
    delivered: ['returned', 'refunded'],
    cancelling: ['cancelled'],
    cancelled: ['refunded'],
    returned: ['refunded'],
    refunded: [],
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index * 50, 300)).springify()}
      style={animatedStyle}
    >
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Card style={[styles.orderCard, isUrgent && styles.urgentCard]}>
          {/* Header: Order Number + Amount + Status */}
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <View style={styles.orderNumberRow}>
                <BodyText style={styles.orderNumber}>#{order.orderNumber || 'N/A'}</BodyText>
                {isUrgent && (
                  <Badge variant="error" size="small" style={styles.urgentBadge}>
                    <Ionicons name="alert-circle" size={10} color={Colors.text.inverse} />
                    <Caption style={{ color: Colors.text.inverse, fontWeight: '700', fontSize: 9 }}>
                      {' '}
                      URGENT
                    </Caption>
                  </Badge>
                )}
              </View>
              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={12} color={Colors.text.tertiary} />
                <Caption style={styles.timeAgo}>{timeAgo}</Caption>
              </View>
            </View>
            <View style={styles.orderTotal}>
              <BodyText style={styles.totalAmount}>
                ₹{(order.pricing?.totalAmount || 0).toLocaleString()}
              </BodyText>
              <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                <View
                  style={[styles.statusDot, { backgroundColor: statusColor, marginRight: 6 }]}
                />
                <Caption
                  style={{
                    color: statusColor,
                    fontWeight: '700',
                    fontSize: 11,
                    textTransform: 'capitalize',
                  }}
                >
                  {(statusLabels[order.status as OrderStatus] || order.status).replace(/_/g, ' ')}
                </Caption>
              </View>
            </View>
          </View>

          {/* Store Info */}
          {order.store && (
            <View style={styles.storeInfoRow}>
              <Image
                source={{ uri: order.store?.logo }}
                style={styles.storeLogo}
                contentFit="cover"
              />
              <View style={styles.storeInfo}>
                <Caption style={styles.storeLabel}>STORE</Caption>
                <BodyText style={styles.storeName}>{order.store?.name || 'Unknown Store'}</BodyText>
              </View>
            </View>
          )}

          {/* Customer Info */}
          <View style={styles.customerInfo}>
            <View style={[styles.customerAvatar, { backgroundColor: Colors.primary[50] }]}>
              <Text style={[styles.customerInitial, { color: Colors.primary[500] }]}>
                {(order.customer?.name || '?')[0]?.toUpperCase()}
              </Text>
            </View>
            <View style={styles.customerDetails}>
              <BodyText style={styles.customerName}>{order.customer?.name || 'Unknown'}</BodyText>
              {order.customer?.phone && (
                <View style={styles.customerContactRow}>
                  <Ionicons name="call-outline" size={12} color={Colors.text.secondary} />
                  <Caption style={styles.customerContact}>{order.customer.phone}</Caption>
                </View>
              )}
            </View>
            <View style={styles.deliveryMethodBadge}>
              <Ionicons
                name={
                  order.delivery?.method === 'delivery'
                    ? 'bicycle'
                    : order.delivery?.method === 'dine_in'
                      ? 'restaurant'
                      : 'bag-handle'
                }
                size={22}
                color={Colors.primary[500]}
              />
            </View>
          </View>

          {/* Items */}
          {order.items && order.items.length > 0 && (
            <View style={styles.itemsSection}>
              <View style={styles.itemsHeader}>
                <Caption style={styles.itemsCount}>
                  {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
                </Caption>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.itemsScroll}
              >
                {order.items.slice(0, 5).map((item, i: number) => (
                  <View key={item.id || i} style={styles.itemCard}>
                    {item.image && (
                      <Image
                        source={{ uri: item.image }}
                        style={styles.itemImage}
                        contentFit="cover"
                      />
                    )}
                    <View style={styles.itemInfo}>
                      <Caption style={styles.itemName} numberOfLines={1}>
                        {item.productName}
                      </Caption>
                      <View style={styles.itemDetails}>
                        <Caption style={styles.itemQuantity}>×{item.quantity}</Caption>
                        <Caption style={styles.itemPrice}>₹{item.price}</Caption>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Payment + Delivery Info */}
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons
                name={paymentMethodIcon(order.payment?.method || '')}
                size={18}
                color={Colors.primary[500]}
              />
              <View style={styles.infoContent}>
                <Caption style={styles.infoLabel}>Payment</Caption>
                <BodyText style={styles.infoValue}>
                  {(order.payment?.method || 'Unknown').toUpperCase()}
                </BodyText>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={18} color={Colors.primary[500]} />
              <View style={styles.infoContent}>
                <Caption style={styles.infoLabel}>Delivery</Caption>
                <BodyText style={styles.infoValue} numberOfLines={1}>
                  {formatAddress(order.delivery?.address?.fullAddress ?? order.delivery?.address)}
                </BodyText>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            {order.status === 'placed' && (
              <>
                <Button
                  title="Accept"
                  size="small"
                  variant="ghost"
                  onPress={() => orderId && onQuickAction(orderId, 'confirm')}
                  style={{ borderColor: Colors.success[500], borderWidth: 1 }}
                  textStyle={{ color: Colors.success[500] }}
                  icon={<Ionicons name="checkmark" size={16} color={Colors.success[500]} />}
                  accessibilityLabel="Accept order"
                  accessibilityRole="button"
                />
                <Button
                  title="Decline"
                  size="small"
                  variant="ghost"
                  onPress={() => {
                    if (!orderId) return;
                    platformAlertDestructive(
                      'Decline Order',
                      'Are you sure? This cannot be undone.',
                      () => onQuickAction(orderId, 'cancel'),
                      'Decline'
                    );
                  }}
                  style={{ borderColor: Colors.error[500], borderWidth: 1 }}
                  textStyle={{ color: Colors.error[500] }}
                  icon={<Ionicons name="close" size={16} color={Colors.error[500]} />}
                  accessibilityLabel="Decline order"
                  accessibilityRole="button"
                />
              </>
            )}
            {order.status === 'confirmed' && (
              <Button
                title="Start Preparing"
                size="small"
                variant="ghost"
                onPress={() => orderId && onQuickAction(orderId, 'prepare')}
                style={{ borderColor: Colors.warning[500], borderWidth: 1 }}
                textStyle={{ color: Colors.warning[500] }}
                icon={<Ionicons name="restaurant" size={16} color={Colors.warning[500]} />}
                accessibilityLabel="Start preparing order"
                accessibilityRole="button"
              />
            )}
            {order.status === 'preparing' && (
              <Button
                title="Mark Ready"
                size="small"
                variant="ghost"
                onPress={() => orderId && onQuickAction(orderId, 'ready')}
                style={{ borderColor: Colors.success[500], borderWidth: 1 }}
                textStyle={{ color: Colors.success[500] }}
                icon={<Ionicons name="checkmark-circle" size={16} color={Colors.success[500]} />}
                accessibilityLabel="Mark order ready"
                accessibilityRole="button"
              />
            )}
          </View>

          {/* Update Status Button */}
          {STATUS_TRANSITIONS[order.status]?.length > 0 && (
            <TouchableOpacity
              style={styles.updateStatusButton}
              onPress={() => orderId && onUpdateStatus(orderId, order.status)}
              activeOpacity={0.8}
              accessibilityLabel="Update order status"
              accessibilityRole="button"
            >
              <Ionicons name="swap-horizontal" size={16} color="#FFFFFF" />
              <Text style={styles.updateStatusButtonText}>Update Status</Text>
            </TouchableOpacity>
          )}
        </Card>
      </Pressable>
    </Animated.View>
  );
};

// ==================== Source Toggle ====================

type OrderSource = 'inapp' | 'web' | 'aggregator';

interface SourceToggleProps {
  active: OrderSource;
  onChange: (src: OrderSource) => void;
}

const SourceToggle = ({ active, onChange }: SourceToggleProps) => (
  <View style={[styles.sourceToggleContainer, { flexDirection: 'row', flexWrap: 'nowrap' }]}>
    <Pressable
      style={[
        styles.sourceToggleBtn,
        active === 'inapp' && styles.sourceToggleBtnActive,
        { flex: 1 },
      ]}
      onPress={() => onChange('inapp')}
    >
      <Ionicons
        name="phone-portrait-outline"
        size={15}
        color={active === 'inapp' ? Colors.text.inverse : Colors.text.secondary}
      />
      <BodyText
        style={[styles.sourceToggleText, active === 'inapp' && styles.sourceToggleTextActive]}
      >
        In-App
      </BodyText>
    </Pressable>
    <Pressable
      style={[
        styles.sourceToggleBtn,
        active === 'web' && styles.sourceToggleBtnActive,
        { flex: 1 },
      ]}
      onPress={() => onChange('web')}
    >
      <Ionicons
        name="qr-code-outline"
        size={15}
        color={active === 'web' ? Colors.text.inverse : Colors.text.secondary}
      />
      <BodyText
        style={[styles.sourceToggleText, active === 'web' && styles.sourceToggleTextActive]}
      >
        Web
      </BodyText>
    </Pressable>
    <Pressable
      style={[
        styles.sourceToggleBtn,
        active === 'aggregator' && styles.sourceToggleBtnActive,
        { flex: 1, backgroundColor: active === 'aggregator' ? '#E23744' : undefined },
      ]}
      onPress={() => onChange('aggregator')}
    >
      <Ionicons
        name="bicycle-outline"
        size={15}
        color={active === 'aggregator' ? Colors.text.inverse : Colors.text.secondary}
      />
      <BodyText
        style={[styles.sourceToggleText, active === 'aggregator' && styles.sourceToggleTextActive]}
      >
        Aggregators
      </BodyText>
    </Pressable>
  </View>
);

// ==================== AggregatorOrderCard ====================

interface AggregatorOrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface AggregatorOrderData {
  id: string;
  externalId: string;
  platform: 'swiggy' | 'zomato' | 'dunzo' | 'ondc';
  status: string;
  total: number;
  customerName?: string;
  customerPhone?: string;
  items: AggregatorOrderItem[];
  createdAt: string;
}

const AGGREGATOR_META: Record<string, { label: string; color: string; icon: string }> = {
  swiggy: { label: 'Swiggy', color: '#FC8019', icon: 'bicycle' },
  zomato: { label: 'Zomato', color: '#E23744', icon: 'restaurant' },
  dunzo: { label: 'Dunzo', color: '#00D290', icon: 'car' },
  ondc: { label: 'ONDC', color: '#6366F1', icon: 'storefront' },
};

const AggregatorOrderCard = ({ order, index }: { order: AggregatorOrderData; index: number }) => {
  const meta = AGGREGATOR_META[order.platform] ?? {
    label: order.platform,
    color: Colors.gray[500],
    icon: 'storefront',
  };
  const timeAgo = React.useMemo(() => {
    const diffMin = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
    return `${Math.floor(diffMin / 1440)}d ago`;
  }, [order.createdAt]);

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 50, 300)).springify()}>
      <Card style={[styles.orderCard, { borderLeftWidth: 3, borderLeftColor: meta.color }]}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <View style={styles.orderNumberRow}>
              <View
                style={[styles.statusBadge, { backgroundColor: `${meta.color}18`, marginRight: 6 }]}
              >
                <Caption style={{ color: meta.color, fontWeight: '700', fontSize: 11 }}>
                  {meta.label}
                </Caption>
              </View>
              <BodyText style={styles.orderNumber}>
                #{order.externalId.slice(-8).toUpperCase()}
              </BodyText>
            </View>
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={12} color={Colors.text.tertiary} />
              <Caption style={styles.timeAgo}>{timeAgo}</Caption>
            </View>
          </View>
          <View style={styles.orderTotal}>
            <BodyText style={styles.totalAmount}>₹{order.total.toLocaleString()}</BodyText>
            <View style={[styles.statusBadge, { backgroundColor: `${Colors.gray[400]}15` }]}>
              <Caption
                style={{
                  color: Colors.gray[600],
                  fontWeight: '600',
                  fontSize: 11,
                  textTransform: 'capitalize',
                }}
              >
                {order.status.replace(/_/g, ' ')}
              </Caption>
            </View>
          </View>
        </View>
        {order.customerName && (
          <Caption style={{ color: Colors.text.secondary, marginTop: 4 }}>
            <Ionicons name="person-outline" size={11} /> {order.customerName}
          </Caption>
        )}
        {order.items.length > 0 && (
          <View style={styles.itemsSection}>
            <Caption style={styles.itemsCount}>
              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
            </Caption>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.itemsScroll}
            >
              {order.items.slice(0, 4).map((item, i) => (
                <View key={i} style={styles.itemCard}>
                  <Caption style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Caption>
                  <Caption style={styles.itemQuantity}>×{item.quantity}</Caption>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </Card>
    </Animated.View>
  );
};

// ==================== WebOrderCard ====================

interface WebOrderCardProps {
  order: WebOrderType;
  onPress: () => void;
  index: number;
}

const WebOrderCard = ({ order, onPress, index }: WebOrderCardProps) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const timeAgo = React.useMemo(() => {
    if (!order.createdAt) return 'Unknown';
    const diffInMinutes = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  }, [order.createdAt]);

  const statusColor = WEB_ORDER_STATUS_COLORS[order.status] ?? Colors.gray[500];
  const statusLabel = WEB_ORDER_STATUS_LABELS[order.status] ?? order.status;
  const hasTip = (order.tipAmount ?? 0) > 0;
  const hasSplits = Array.isArray(order.billSplits) && order.billSplits.length > 0;
  const isGroupOrder = hasSplits && order.billSplits!.length > 1;
  const displayTotal = order.totalWithTip ?? order.total;

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index * 50, 300)).springify()}
      style={animatedStyle}
    >
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Card style={styles.orderCard}>
          {/* Header */}
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <View style={styles.orderNumberRow}>
                <BodyText style={styles.orderNumber}>#{order.orderNumber}</BodyText>
                {isGroupOrder && (
                  <View style={styles.webGroupBadge}>
                    <Ionicons name="people" size={11} color="#5C6BC0" />
                    <Caption style={styles.webGroupBadgeText}>
                      {order.billSplits!.length} people
                    </Caption>
                  </View>
                )}
              </View>
              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={12} color={Colors.text.tertiary} />
                <Caption style={styles.timeAgo}>{timeAgo}</Caption>
              </View>
            </View>
            <View style={styles.orderTotal}>
              <BodyText style={styles.totalAmount}>₹{displayTotal.toLocaleString()}</BodyText>
              {hasTip && (
                <View style={styles.webTipBadge}>
                  <Ionicons name="star" size={10} color="#B8860B" />
                  <Caption style={styles.webTipText}>
                    Tip ₹{(order.tipAmount ?? 0).toFixed(0)}
                  </Caption>
                </View>
              )}
              <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                <View
                  style={[styles.statusDot, { backgroundColor: statusColor, marginRight: 6 }]}
                />
                <Caption
                  style={{
                    color: statusColor,
                    fontWeight: '700',
                    fontSize: 11,
                    textTransform: 'capitalize',
                  }}
                >
                  {statusLabel.replace(/_/g, ' ')}
                </Caption>
              </View>
            </View>
          </View>

          {/* Customer + table */}
          <View style={styles.customerInfo}>
            <View style={[styles.customerAvatar, { backgroundColor: Colors.primary[50] }]}>
              <Text style={[styles.customerInitial, { color: Colors.primary[500] }]}>
                {(order.customerName || order.customerPhone || '?')[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.customerDetails}>
              <BodyText style={styles.customerName}>
                {order.customerName || order.customerPhone}
              </BodyText>
              {order.customerName ? (
                <View style={styles.customerContactRow}>
                  <Ionicons name="call-outline" size={12} color={Colors.text.secondary} />
                  <Caption style={styles.customerContact}>{order.customerPhone}</Caption>
                </View>
              ) : null}
            </View>
            {order.tableNumber ? (
              <View style={styles.webTableBadge}>
                <Ionicons name="restaurant-outline" size={14} color={Colors.primary[500]} />
                <Caption style={styles.webTableText}>Table {order.tableNumber}</Caption>
              </View>
            ) : null}
          </View>

          {/* Items preview */}
          {order.items.length > 0 && (
            <View style={styles.itemsSection}>
              <Caption style={styles.itemsCount}>
                {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
              </Caption>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.itemsScroll}
              >
                {order.items.slice(0, 5).map((item, i) => (
                  <View key={`${item.menuItemId}-${i}`} style={styles.itemCard}>
                    <View style={styles.itemInfo}>
                      <Caption style={styles.itemName} numberOfLines={1}>
                        {item.name}
                      </Caption>
                      <View style={styles.itemDetails}>
                        <Caption style={styles.itemQuantity}>×{item.quantity}</Caption>
                        <Caption style={styles.itemPrice}>₹{item.price}</Caption>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Bill splits summary */}
          {hasSplits && (
            <View style={styles.webSplitSummary}>
              <Ionicons name="people-outline" size={14} color={Colors.text.secondary} />
              <Caption style={styles.webSplitText}>
                Split: {order.billSplits!.filter((s) => s.paid).length}/{order.billSplits!.length}{' '}
                paid
              </Caption>
            </View>
          )}
        </Card>
      </Pressable>
    </Animated.View>
  );
};

// ==================== OrdersScreen ====================

// ─── Notification banner types ───────────────────────────────────────────────

interface WebNotification {
  id: string;
  type: 'web-order:new' | 'web-order:status-update' | 'waiter-call' | 'parcel-request';
  message: string;
  orderNumber?: string;
  tableNumber?: string;
  createdAt: number;
}

export default function OrdersScreen() {
  const [orderSource, setOrderSource] = useState<OrderSource>('inapp');

  // ── Web order real-time notifications ────────────────────────────────────
  const [webNotifications, setWebNotifications] = useState<WebNotification[]>([]);
  const notifOpacity = useRef(new RNAnimated.Value(0)).current;
  const socket = useSocket();

  // Declare webOrders early so socket handlers can call onRefresh
  const dashboard = useOrdersDashboard();
  const {
    orders,
    statusCounts,
    loading,
    refreshing,
    activeFilter,
    setActiveFilter,
    sortBy,
    setSortBy,
    selectedStoreId,
    setSelectedStoreId,
    realTime,
    newOrdersCount,
    clearNewOrders,
    showStatusModal,
    setShowStatusModal,
    statusOrderCurrent,
    processingStatus,
    onRefresh,
    handleQuickAction,
    handleUpdateStatus,
    handleStatusSelect,
    stores,
    STATUS_TRANSITIONS,
  } = dashboard;

  const webOrders = useWebOrders(selectedStoreId);

  // Aggregator orders state
  const [aggregatorOrders, setAggregatorOrders] = useState<AggregatorOrderData[]>([]);
  const [aggregatorLoading, setAggregatorLoading] = useState(false);
  const [aggregatorPage, setAggregatorPage] = useState(1);
  const [aggregatorHasMore, setAggregatorHasMore] = useState(true);
  const [aggregatorError, setAggregatorError] = useState<string | null>(null);
  const { activeStore: aggActiveStore } = useStore();

  const loadAggregatorOrders = useCallback(
    async (page = 1, append = false) => {
      const storeId = aggActiveStore?._id;
      if (!storeId) return;
      try {
        setAggregatorLoading(true);
        const res = await apiClient.get<{ orders: AggregatorOrderData[]; totalPages: number }>(
          `merchant/integrations/aggregator/orders?storeId=${storeId}&page=${page}`
        );
        if (res.success && res.data) {
          setAggregatorOrders((prev) =>
            append ? [...prev, ...res.data!.orders] : res.data!.orders
          );
          setAggregatorHasMore(page < (res.data.totalPages ?? 1));
          setAggregatorPage(page);
        }
      } catch (err) {
        setAggregatorError(err?.message || 'Failed to load aggregator orders');
        logger.error('[orders] loadAggregatorOrders failed:', err);
      } finally {
        setAggregatorLoading(false);
      }
    },
    [aggActiveStore?._id]
  );

  useEffect(() => {
    if (orderSource === 'aggregator') {
      loadAggregatorOrders(1, false);
    }
  }, [orderSource, loadAggregatorOrders]);

  const addNotification = useCallback(
    (notif: Omit<WebNotification, 'id' | 'createdAt'>) => {
      const id = `${notif.type}-${Date.now()}`;
      setWebNotifications((prev) => [
        { ...notif, id, createdAt: Date.now() },
        ...prev.slice(0, 19),
      ]);
      // Animate banner in then out
      RNAnimated.sequence([
        RNAnimated.timing(notifOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        RNAnimated.delay(4000),
        RNAnimated.timing(notifOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    },
    [notifOpacity]
  );

  const webOrdersRefresh = webOrders.onRefresh;

  useEffect(() => {
    const handleWebOrderNew = (data) => {
      const table = data.tableNumber ? `Table ${data.tableNumber}` : 'Takeaway';
      addNotification({
        type: 'web-order:new',
        message: `New web order #${data.orderNumber} — ${table}`,
        orderNumber: data.orderNumber,
        tableNumber: data.tableNumber,
      });
      // Refresh web orders list to show the new order
      webOrdersRefresh();
    };

    const handleWebOrderStatusUpdate = (data) => {
      addNotification({
        type: 'web-order:status-update',
        message: `Web order #${data.orderNumber} → ${data.status}`,
        orderNumber: data.orderNumber,
      });
    };

    const handleWaiterCall = (data) => {
      const table = data.tableNumber ? `Table ${data.tableNumber}` : 'a table';
      addNotification({
        type: 'waiter-call',
        message: `Waiter requested at ${table}${data.reason ? ` — ${data.reason}` : ''}`,
        tableNumber: data.tableNumber,
        orderNumber: data.orderNumber,
      });
    };

    const handleParcelRequest = (data) => {
      const table = data.tableNumber ? `Table ${data.tableNumber}` : 'order';
      addNotification({
        type: 'parcel-request',
        message: `Pack request for ${table} — order #${data.orderNumber}`,
        orderNumber: data.orderNumber,
        tableNumber: data.tableNumber,
      });
    };

    if (!socket) return;

    socket.on('web-order:new', handleWebOrderNew);
    socket.on('web-order:status-update', handleWebOrderStatusUpdate);
    socket.on('waiter-call', handleWaiterCall);
    socket.on('parcel-request', handleParcelRequest);

    return () => {
      socket.off('web-order:new', handleWebOrderNew);
      socket.off('web-order:status-update', handleWebOrderStatusUpdate);
      socket.off('waiter-call', handleWaiterCall);
      socket.off('parcel-request', handleParcelRequest);
    };
    // socket?.id in deps ensures listeners re-attach after reconnect
  }, [socket, socket?.id, addNotification, webOrdersRefresh]);

  const renderOrderCard = useCallback(
    ({ item, index }: { item: Order; index: number }) => (
      <OrderCard
        order={item}
        index={index}
        onPress={() => {
          const orderId = (item as Order & { _id?: string })._id || item.id;
          if (orderId) router.push(`/orders/${orderId}`);
        }}
        onQuickAction={handleQuickAction}
        onUpdateStatus={handleUpdateStatus}
      />
    ),
    [handleQuickAction, handleUpdateStatus]
  );

  const renderWebOrderCard = useCallback(
    ({ item, index }: { item: WebOrderType; index: number }) => (
      <WebOrderCard
        order={item}
        index={index}
        onPress={() => router.push(`/orders/web-order/${item.orderNumber}`)}
      />
    ),
    []
  );

  if (loading && orderSource === 'inapp') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <BodyText style={{ marginTop: 12 }}>Loading orders...</BodyText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Web Order Notification Banner ─────────────────────────────── */}
      {webNotifications.length > 0 && (
        <RNAnimated.View
          style={[notifStyles.banner, { opacity: notifOpacity }]}
          pointerEvents="none"
        >
          {(() => {
            const latest = webNotifications[0];
            const icon =
              latest.type === 'web-order:new'
                ? '🔔'
                : latest.type === 'web-order:status-update'
                  ? '📋'
                  : latest.type === 'waiter-call'
                    ? '🛎️'
                    : '📦';
            return (
              <Text style={notifStyles.text}>
                {icon} {latest.message}
              </Text>
            );
          })()}
        </RNAnimated.View>
      )}

      {/* Header */}
      <Animated.View entering={FadeInDown.delay(50)} style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerTitleRow}>
            <Heading2 style={styles.headerTitle}>Orders</Heading2>
            {orderSource === 'inapp' && newOrdersCount > 0 && (
              <Animated.View entering={ZoomIn.springify()}>
                <Badge variant="success" size="small" style={styles.newOrdersBadge}>
                  <Ionicons name="add-circle" size={12} color={Colors.text.inverse} />
                  <BodyText
                    style={{
                      color: Colors.text.inverse,
                      fontSize: 11,
                      fontWeight: '700',
                      marginLeft: 2,
                    }}
                  >
                    +{newOrdersCount}
                  </BodyText>
                </Badge>
              </Animated.View>
            )}
          </View>
          <Caption style={styles.headerSubtitle}>
            {orderSource === 'inapp'
              ? `${orders.length} ${orders.length === 1 ? 'order' : 'orders'} total`
              : orderSource === 'web'
                ? `${webOrders.pagination.total} web ${webOrders.pagination.total === 1 ? 'order' : 'orders'}`
                : `${aggregatorOrders.length} aggregator orders`}
          </Caption>
        </View>
        <View style={styles.headerRight}>
          {orderSource === 'inapp' && (
            <Animated.View
              entering={FadeInRight.delay(100)}
              style={[
                styles.realtimeIndicator,
                {
                  backgroundColor: realTime.isConnected
                    ? `${Colors.success[500]}15`
                    : `${Colors.error[500]}15`,
                },
              ]}
            >
              <View
                style={[
                  styles.realtimeStatusDot,
                  {
                    backgroundColor: realTime.isConnected ? Colors.success[500] : Colors.error[500],
                  },
                ]}
              />
              <BodyText
                style={[
                  styles.realtimeText,
                  { color: realTime.isConnected ? Colors.success[600] : Colors.error[600] },
                ]}
              >
                {realTime.isConnected ? 'Live' : 'Offline'}
              </BodyText>
            </Animated.View>
          )}
          <TouchableOpacity
            style={styles.analyticsButton}
            onPress={() => router.push('/orders/analytics')}
            accessibilityLabel="View order analytics"
            accessibilityRole="button"
          >
            <View style={styles.analyticsButtonInner}>
              <Ionicons name="analytics" size={20} color={Colors.primary[500]} />
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Source Toggle — In-App Orders | Web Orders */}
      <SourceToggle active={orderSource} onChange={setOrderSource} />

      {/* Store Filter */}
      {stores.length > 1 && (
        <View style={styles.storeFilterContainer}>
          <BodyText style={styles.storeFilterLabel}>Filter by Store:</BodyText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storeFilterContent}
            style={styles.storeFilterScroll}
          >
            <TouchableOpacity
              style={[styles.storeFilterButton, !selectedStoreId && styles.storeFilterButtonActive]}
              onPress={() => setSelectedStoreId(undefined)}
            >
              <BodyText
                style={[styles.storeFilterText, !selectedStoreId && styles.storeFilterTextActive]}
              >
                All Stores
              </BodyText>
            </TouchableOpacity>
            {stores.map((store) => (
              <TouchableOpacity
                key={store._id}
                style={[
                  styles.storeFilterButton,
                  selectedStoreId === store._id && styles.storeFilterButtonActive,
                ]}
                onPress={() => setSelectedStoreId(store._id)}
              >
                <BodyText
                  style={[
                    styles.storeFilterText,
                    selectedStoreId === store._id && styles.storeFilterTextActive,
                  ]}
                >
                  {store.name}
                </BodyText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── IN-APP ORDERS view ── */}
      {orderSource === 'inapp' && (
        <>
          {/* Status Filter Tabs */}
          <View style={{ height: 60 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.statusTabs}
              contentContainerStyle={styles.statusTabsContent}
            >
              <StatusTab
                status="all"
                label="All"
                count={statusCounts.all}
                active={activeFilter === 'all'}
                onPress={() => setActiveFilter('all')}
              />
              {(Object.entries(statusCounts) as Array<[StatusFilter, number]>)
                .filter(([status]) => status !== 'all' && statusCounts[status] > 0)
                .map(([status, count]) => (
                  <StatusTab
                    key={status}
                    status={status}
                    label={statusLabels[status as OrderStatus]}
                    count={count}
                    active={activeFilter === status}
                    onPress={() => setActiveFilter(status)}
                  />
                ))}
            </ScrollView>
          </View>

          {/* Sort Controls */}
          <View style={styles.controls}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(['created', 'priority', 'total'] as const).map((sort) => (
                <TouchableOpacity
                  key={sort}
                  style={[styles.sortButton, sortBy === sort && styles.activeSortButton]}
                  onPress={() => setSortBy(sort)}
                >
                  <Caption
                    style={[styles.sortButtonText, sortBy === sort && styles.activeSortButtonText]}
                  >
                    {sort === 'created' ? 'Date' : sort === 'priority' ? 'Priority' : 'Total'}
                  </Caption>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Orders List */}
          {(() => {
            return (
              <TypedFlashList<Order>
                data={orders}
                renderItem={renderOrderCard}
                estimatedItemSize={280}
                keyExtractor={(item: Order) =>
                  item.id || (item as Order & { _id?: string })._id || `order-${item.orderNumber}`
                }
                contentContainerStyle={styles.ordersList}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons name="receipt-outline" size={64} color={Colors.gray[300]} />
                    <Heading3 style={styles.emptyStateTitle}>No Orders Found</Heading3>
                    <BodyText style={styles.emptyStateSubtitle}>
                      {activeFilter === 'all'
                        ? "You don't have unknown orders yet"
                        : `No ${statusLabels[activeFilter as OrderStatus]?.toLowerCase()} orders`}
                    </BodyText>
                  </View>
                }
              />
            );
          })()}

          {/* Status Update Modal */}
          <Modal visible={showStatusModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Ionicons name="swap-horizontal" size={24} color={Colors.primary[500]} />
                  <Heading3 style={styles.modalTitle}>Update Status</Heading3>
                </View>
                <Caption style={styles.modalCurrentStatus}>
                  Current: {statusOrderCurrent.replace(/_/g, ' ')}
                </Caption>
                <View style={styles.modalOptions}>
                  {(STATUS_TRANSITIONS[statusOrderCurrent] || []).map((nextStatus: string) => (
                    <TouchableOpacity
                      key={nextStatus}
                      style={[
                        styles.statusOption,
                        {
                          backgroundColor: `${statusColors[nextStatus as OrderStatus] || Colors.primary[500]}15`,
                          borderColor:
                            statusColors[nextStatus as OrderStatus] || Colors.primary[500],
                        },
                      ]}
                      onPress={() => handleStatusSelect(nextStatus)}
                      disabled={processingStatus}
                      activeOpacity={0.7}
                    >
                      {processingStatus ? (
                        <ActivityIndicator size="small" color={Colors.primary[500]} />
                      ) : (
                        <>
                          <View
                            style={[
                              styles.statusOptionDot,
                              {
                                backgroundColor:
                                  statusColors[nextStatus as OrderStatus] || Colors.primary[500],
                              },
                            ]}
                          />
                          <BodyText style={styles.statusOptionText}>
                            {(statusLabels[nextStatus as OrderStatus] || nextStatus).replace(
                              /_/g,
                              ' '
                            )}
                          </BodyText>
                          <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
                        </>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setShowStatusModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <BodyText style={styles.modalCancelText}>Cancel</BodyText>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}

      {/* ── WEB ORDERS view ── */}
      {orderSource === 'web' && (
        <>
          {/* Status filter tabs for web orders */}
          <View style={{ height: 60 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.statusTabs}
              contentContainerStyle={styles.statusTabsContent}
            >
              {(
                [
                  'all',
                  'pending_payment',
                  'paid',
                  'confirmed',
                  'preparing',
                  'ready',
                  'completed',
                  'cancelled',
                ] as const
              ).map((s) => {
                const count = webOrders.statusCounts[s] ?? 0;
                if (s !== 'all' && count === 0) return null;
                const label = s === 'all' ? 'All' : WEB_ORDER_STATUS_LABELS[s as WebOrderStatus];
                const color =
                  s === 'all'
                    ? Colors.primary[500]
                    : (WEB_ORDER_STATUS_COLORS[s as WebOrderStatus] ?? Colors.primary[500]);
                const isActive = webOrders.statusFilter === s;
                return (
                  <Pressable
                    key={s}
                    style={[
                      styles.statusTab,
                      isActive && styles.activeStatusTab,
                      isActive && { backgroundColor: color, borderColor: 'transparent' },
                    ]}
                    onPress={() => webOrders.setStatusFilter(s)}
                  >
                    <BodyText
                      style={[styles.statusTabText, isActive && styles.activeStatusTabText]}
                    >
                      {label}
                    </BodyText>
                    <View style={[styles.statusCount, isActive && styles.activeStatusCount]}>
                      <Caption
                        style={[styles.statusCountText, isActive && styles.activeStatusCountText]}
                      >
                        {count}
                      </Caption>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {webOrders.loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary[500]} />
              <BodyText style={{ marginTop: 12 }}>Loading web orders…</BodyText>
            </View>
          ) : (
            (() => {
              return (
                <TypedFlashList<WebOrderType>
                  data={webOrders.orders ?? []}
                  renderItem={renderWebOrderCard}
                  estimatedItemSize={220}
                  keyExtractor={(item: WebOrderType) => item._id || `web-${item.orderNumber}`}
                  contentContainerStyle={styles.ordersList}
                  refreshControl={
                    <RefreshControl
                      refreshing={webOrders.refreshing}
                      onRefresh={webOrders.onRefresh}
                    />
                  }
                  onEndReached={webOrders.loadMore}
                  onEndReachedThreshold={0.3}
                  ListEmptyComponent={
                    <View style={styles.emptyState}>
                      <Ionicons name="qr-code-outline" size={64} color={Colors.gray[300]} />
                      <Heading3 style={styles.emptyStateTitle}>No Web Orders</Heading3>
                      <BodyText style={styles.emptyStateSubtitle}>
                        Web QR orders will appear here once customers scan and place orders
                      </BodyText>
                    </View>
                  }
                />
              );
            })()
          )}
        </>
      )}

      {/* ── AGGREGATOR ORDERS view ── */}
      {orderSource === 'aggregator' && (
        <>
          {aggregatorError && (
            <View
              style={{
                backgroundColor: '#FEE2E2',
                padding: 12,
                marginHorizontal: 16,
                marginTop: 8,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#991B1B', fontSize: 14, textAlign: 'center' }}>
                {aggregatorError}
              </Text>
              <Text
                style={{
                  color: '#DC2626',
                  fontSize: 13,
                  textAlign: 'center',
                  marginTop: 4,
                  fontWeight: '600',
                }}
                onPress={() => {
                  setAggregatorError(null);
                  loadAggregatorOrders(1, false);
                }}
              >
                Tap to retry
              </Text>
            </View>
          )}
          {aggregatorLoading && aggregatorOrders.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#E23744" />
              <BodyText style={{ marginTop: 12 }}>Loading aggregator orders…</BodyText>
            </View>
          ) : (
            (() => {
              return (
                <TypedFlashList<AggregatorOrderData>
                  data={aggregatorOrders}
                  renderItem={({ item, index }: { item: AggregatorOrderData; index: number }) => (
                    <AggregatorOrderCard order={item} index={index} />
                  )}
                  estimatedItemSize={160}
                  keyExtractor={(item: AggregatorOrderData) => item.id}
                  contentContainerStyle={styles.ordersList}
                  refreshControl={
                    <RefreshControl
                      refreshing={aggregatorLoading}
                      onRefresh={() => {
                        setAggregatorError(null);
                        loadAggregatorOrders(1, false);
                      }}
                    />
                  }
                  onEndReached={() => {
                    if (aggregatorHasMore && !aggregatorLoading) {
                      loadAggregatorOrders(aggregatorPage + 1, true);
                    }
                  }}
                  onEndReachedThreshold={0.3}
                  ListEmptyComponent={
                    <View style={styles.emptyState}>
                      <Ionicons name="bicycle-outline" size={64} color={Colors.gray[300]} />
                      <Heading3 style={styles.emptyStateTitle}>No Aggregator Orders</Heading3>
                      <BodyText style={styles.emptyStateSubtitle}>
                        Orders from Swiggy, Zomato, and other platforms will appear here once your
                        integrations are connected.
                      </BodyText>
                      <Button
                        title="Set Up Integrations"
                        variant="ghost"
                        size="medium"
                        style={{ marginTop: 16 }}
                        onPress={() => router.push('/(dashboard)/integrations')}
                      />
                    </View>
                  }
                />
              );
            })()
          )}
        </>
      )}
    </View>
  );
}

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[50] },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerLeft: { flex: 1, gap: 4 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontWeight: '800', fontSize: 28, color: Colors.text.primary },
  headerSubtitle: { color: Colors.text.secondary, fontSize: 12, marginTop: 2 },
  newOrdersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  realtimeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  realtimeStatusDot: { width: 8, height: 8, borderRadius: 4 },
  realtimeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  analyticsButton: { padding: 4 },
  analyticsButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTabs: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  statusTabsContent: { gap: 8, paddingRight: Spacing.base },
  statusTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.background.primary,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    gap: 8,
    ...Shadows.sm,
  },
  activeStatusTab: {},
  statusTabText: { fontSize: 14, color: Colors.text.primary },
  activeStatusTabText: { color: Colors.text.inverse, fontWeight: '600' },
  statusCount: {
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  activeStatusCount: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  statusCountText: { fontSize: 12, fontWeight: '600', color: Colors.text.primary },
  activeStatusCountText: { color: Colors.text.inverse },
  controls: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background.primary,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    ...Shadows.sm,
  },
  activeSortButton: { backgroundColor: Colors.primary[500], borderColor: Colors.primary[500] },
  sortButtonText: { color: Colors.text.secondary, fontWeight: '600', fontSize: 12 },
  activeSortButtonText: { color: Colors.text.inverse, fontWeight: '700', fontSize: 12 },
  ordersList: { padding: Spacing.base, paddingBottom: 80 },
  orderCard: {
    gap: 0,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.background.primary,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  urgentCard: { borderLeftWidth: 5, borderLeftColor: Colors.error[500] },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderInfo: { flex: 1, gap: 6 },
  orderNumberRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  orderNumber: { color: Colors.text.primary, fontWeight: '700', fontSize: 18 },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeAgo: { color: Colors.text.tertiary, fontSize: 11 },
  orderTotal: { alignItems: 'flex-end', gap: 6 },
  totalAmount: { color: Colors.primary[700], fontWeight: '800', fontSize: 22 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  storeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  storeLogo: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.gray[100] },
  storeInfo: { flex: 1 },
  storeName: { fontWeight: '700', fontSize: 13, color: Colors.text.primary },
  storeLabel: {
    fontSize: 10,
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary[100],
  },
  customerInitial: { fontSize: 20, fontWeight: '700' },
  customerDetails: { flex: 1, gap: 4 },
  customerName: { fontWeight: '700', fontSize: 15, color: Colors.text.primary },
  customerContactRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  customerContact: { color: Colors.text.secondary, fontSize: 12 },
  deliveryMethodBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemsSection: { paddingVertical: Spacing.md, gap: 8 },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemsCount: {
    fontWeight: '700',
    fontSize: 12,
    color: Colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemsScroll: { marginHorizontal: -Spacing.md, paddingHorizontal: Spacing.md },
  itemCard: {
    width: 120,
    marginRight: 12,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  itemImage: { width: '100%', height: 80, backgroundColor: Colors.gray[200] },
  itemInfo: { padding: 8, gap: 4 },
  itemName: { fontWeight: '600', fontSize: 12, color: Colors.text.primary },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  itemQuantity: { fontSize: 10, color: Colors.text.secondary },
  itemPrice: { fontWeight: '700', fontSize: 12, color: Colors.primary[600] },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  infoItem: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  infoContent: { flex: 1, gap: 2 },
  infoLabel: {
    fontSize: 10,
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: { fontSize: 12, fontWeight: '600', color: Colors.text.primary },
  quickActions: { flexDirection: 'row', gap: 8, marginTop: Spacing.xs },
  updateStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary[500],
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: Spacing.sm,
  },
  updateStatusButtonText: { color: Colors.text.inverse, fontWeight: '600', fontSize: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyStateTitle: { color: Colors.text.primary },
  emptyStateSubtitle: { color: Colors.text.secondary, textAlign: 'center' },
  // ── Source toggle ──
  sourceToggleContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.gray[100],
    borderRadius: 24,
    padding: 4,
    gap: 4,
  },
  sourceToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 20,
  },
  sourceToggleBtnActive: { backgroundColor: Colors.primary[500] },
  sourceToggleText: { fontSize: 13, fontWeight: '600', color: Colors.text.secondary },
  sourceToggleTextActive: { color: Colors.text.inverse },

  // ── Web order card extras ──
  webGroupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8EAF6',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  webGroupBadgeText: { fontSize: 11, fontWeight: '600', color: '#5C6BC0' },
  webTipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#FFD54F',
  },
  webTipText: { fontSize: 11, fontWeight: '700', color: '#B8860B' },
  webTableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary[50],
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  webTableText: { fontSize: 12, fontWeight: '600', color: Colors.primary[600] },
  webSplitSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  webSplitText: { fontSize: 12, color: Colors.text.secondary, fontWeight: '500' },

  storeFilterContainer: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  storeFilterLabel: { marginBottom: 4, fontWeight: '600' },
  storeFilterScroll: { maxHeight: 40 },
  storeFilterContent: { gap: 8, alignItems: 'center' },
  storeFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background.primary,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    ...Shadows.sm,
  },
  storeFilterButtonActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  storeFilterText: { fontSize: 12, color: Colors.text.primary },
  storeFilterTextActive: { color: Colors.text.inverse, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  modalTitle: { fontWeight: '700', fontSize: 18, color: Colors.text.primary },
  modalCurrentStatus: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  modalOptions: { gap: 8 },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  statusOptionDot: { width: 10, height: 10, borderRadius: 5 },
  statusOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text.primary,
    textTransform: 'capitalize',
  },
  modalCancelButton: {
    backgroundColor: Colors.gray[100],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCancelText: { fontWeight: '600', color: Colors.text.secondary, fontSize: 15 },
});

// ── Notification banner styles ────────────────────────────────────────────────
const notifStyles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
