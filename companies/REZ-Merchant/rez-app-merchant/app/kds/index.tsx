// FIX (MA-TYPES-001): Import OrderStatus for proper typing
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Order, OrderStatus } from '@/types/api';

/**
 * MerchantDataShape — MER-HIGH-02 fix: typed interface for stored merchant data.
 * These are the fields actually stored in AsyncStorage under MERCHANT_DATA.
 * Defined here to eliminate type assertions when reading merchant data.
 */
interface MerchantDataShape {
  storeName?: string;
  activeStoreId?: string;
  storeId?: string;
  id?: string;
  slug?: string;
  storeSlug?: string;
}
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants/DesignTokens';
import { storageService } from '@/services/storage';
import { API_CONFIG } from '@/config/api';
import { ordersService } from '@/services/api/orders';
import { io } from 'socket.io-client';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RezNowOrders from './rez-now-orders';
import { logger } from '@/utils/logger';

const { width, height } = Dimensions.get('window');

interface KDSOrder {
  id: string;
  _id?: string;
  orderNumber: string;
  status: 'new' | 'preparing' | 'ready';
  items: Array<{
    name: string;
    quantity: number;
    special?: string;
    course?: 'STARTER' | 'MAIN' | 'DESSERT';
    allergens?: string[];
  }>;
  customerName?: string;
  tableNumber?: string;
  dineInOrTakeaway?: 'dine_in' | 'takeaway';
  platform?: 'dine_in' | 'takeaway' | 'swiggy' | 'zomato' | 'delivery_app';
  createdAt: string;
  createdAtMs: number;
  statusChangedAt?: string;
  statusChangedAtMs?: number;
  /** Raw backend status (placed|confirmed|preparing|ready|dispatched|delivered). Used for correct API transition calls. */
  backendStatus?: string;
}

interface KDSColumn {
  title: string;
  status: 'new' | 'preparing' | 'ready';
  orders: KDSOrder[];
  color: string;
  bgColor: string;
}

const calculateElapsedMinutes = (createdAtMs: number): number => {
  return Math.floor((Date.now() - createdAtMs) / 60000);
};

const calculateElapsedSeconds = (createdAtMs: number): number => {
  return Math.floor((Date.now() - createdAtMs) / 1000);
};

const formatTimer = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const getTimerColor = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  if (mins < 10) return Colors.success[500];
  if (mins < 20) return Colors.warning[500];
  return Colors.error[500];
};

const playOrderAlert = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('@/assets/sounds/order-alert.mp3'),
      {},
      undefined,
      false
    );
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) sound.unloadAsync();
    });
  } catch {
    // Non-critical — silent fail if sound not found
  }
};

// PERF: Move StyleSheet outside component to prevent recreations
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[100],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border.light,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  storeName: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
  },
  soundToggle: {
    padding: 8,
  },
  webOrdersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[100] ?? '#EDE9FE',
  },
  webOrdersButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary[500],
  },
  headerClock: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginRight: Spacing.md,
  },
  pendingBadge: {
    backgroundColor: Colors.error[500],
    borderRadius: 12,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginRight: Spacing.md,
  },
  pendingBadgeText: {
    color: Colors.text.inverse,
    fontSize: 12,
    fontWeight: '700',
  },
  columnsContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  columnContainer: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  columnHeader: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  columnTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  columnCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  columnCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  columnContent: {
    flex: 1,
  },
  columnContentInner: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  emptyColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.tertiary,
    marginTop: Spacing.sm,
  },
  orderCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 8,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
    fontFamily: 'Menlo',
  },
  platformBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  platformBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  cardDetails: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border.light,
    paddingVertical: Spacing.sm,
  },
  detailText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  itemsList: {
    gap: Spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  itemQuantity: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    minWidth: 30,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
  },
  itemSpecial: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    flex: 1,
  },
  courseBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  allergenBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.error[700],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Colors.error[100],
    marginRight: Spacing.xs,
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: Colors.primary[500],
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  tabLabelActive: {
    color: Colors.primary[500],
    fontWeight: '700',
  },
  rezNowBadge: {
    backgroundColor: Colors.error[500],
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 2,
  },
  rezNowBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
});

const getPlatformColor = (platform?: string): string => {
  switch (platform) {
    case 'dine_in':
    case 'dine-in':
      return Colors.primary[500];
    case 'takeaway':
    case 'swiggy':
      return Colors.warning[600];
    case 'zomato':
      return Colors.error[500]; // Zomato brand red
    case 'delivery_app':
      return Colors.success[600];
    default:
      return Colors.gray[500];
  }
};

const getPlatformLabel = (platform?: string): string => {
  switch (platform) {
    case 'dine_in':
    case 'dine-in':
      return 'DINE-IN';
    case 'takeaway':
      return 'TAKEAWAY';
    case 'swiggy':
      return 'SWIGGY';
    case 'zomato':
      return 'ZOMATO';
    case 'delivery_app':
      return 'DELIVERY';
    default:
      return 'ORDER';
  }
};

// PERF: Extract memoized KDSOrderCard component with custom comparison
const KDSOrderCard = React.memo(
  ({
    order,
    elapsedSeconds,
    onPress,
    isFlashing,
  }: {
    order: KDSOrder;
    elapsedSeconds: number;
    onPress: (order: KDSOrder) => void;
    isFlashing: boolean;
  }) => {
    const isDelayed = order.status === 'ready' && Math.floor(elapsedSeconds / 60) > 20;
    const timerColor = getTimerColor(elapsedSeconds);
    const platform = order.platform || order.dineInOrTakeaway;

    return (
      <TouchableOpacity
        style={[
          styles.orderCard,
          {
            borderColor:
              order.status === 'new' && isFlashing
                ? Colors.error[600]
                : order.status === 'new'
                  ? Colors.success[500]
                  : order.status === 'preparing'
                    ? Colors.warning[500]
                    : isDelayed
                      ? Colors.error[500]
                      : Colors.success[600],
            borderWidth: 3,
            backgroundColor:
              order.status === 'new'
                ? Colors.success[50]
                : order.status === 'preparing'
                  ? Colors.warning[50]
                  : Colors.success[50],
          },
        ]}
        onPress={() => onPress(order)}
      >
        {/* Order Header with Number and Platform */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderNumber}>ORDER #{order.orderNumber}</Text>
            <View style={{ flexDirection: 'row', marginTop: 4, flexWrap: 'wrap' }}>
              <View style={[styles.platformBadge, { backgroundColor: getPlatformColor(platform) }]}>
                <Text style={styles.platformBadgeText}>{getPlatformLabel(platform)}</Text>
              </View>
              {order.customerName && (
                <Text style={styles.detailText} numberOfLines={1} ellipsizeMode="tail">
                  {order.customerName}
                </Text>
              )}
            </View>
          </View>
          <View style={[styles.timerBadge, { borderColor: timerColor, borderWidth: 2 }]}>
            <Ionicons name="time" size={16} color={timerColor} />
            <Text style={[styles.timerText, { color: timerColor }]}>
              {formatTimer(elapsedSeconds)}
            </Text>
          </View>
        </View>

        {/* Order Details */}
        <View style={styles.cardDetails}>
          {order.tableNumber && <Text style={styles.detailText}>TABLE {order.tableNumber}</Text>}
          {order.customerName && !order.tableNumber && (
            <Text style={styles.detailText} numberOfLines={1} ellipsizeMode="tail">
              {order.customerName}
            </Text>
          )}
        </View>

        {/* Items List */}
        <View style={styles.itemsList}>
          {order.items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemQuantity}>{item.quantity}x</Text>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  {/* Course Badge */}
                  {item.course && (
                    <Text
                      style={[
                        styles.courseBadge,
                        {
                          backgroundColor:
                            item.course === 'STARTER'
                              ? Colors.primary[500]
                              : item.course === 'MAIN'
                                ? Colors.success[500]
                                : Colors.warning[500],
                        },
                      ]}
                    >
                      {item.course[0]}
                    </Text>
                  )}
                  {/* Allergen Badge */}
                  {item.allergens && item.allergens.length > 0 && (
                    <Text style={styles.allergenBadge}>⚠</Text>
                  )}
                </View>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.special && (
                  <View
                    style={{
                      marginTop: 4,
                      paddingLeft: 8,
                      borderLeftWidth: 2,
                      borderLeftColor: Colors.warning[300],
                    }}
                  >
                    <Text style={styles.itemSpecial}>"{item.special}"</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor:
                order.status === 'new'
                  ? Colors.warning[500]
                  : order.status === 'preparing'
                    ? Colors.success[500]
                    : Colors.error[500],
            },
          ]}
          onPress={() => onPress(order)}
          accessibilityRole="button"
          accessibilityLabel={`Order ${order.orderNumber}: ${order.status === 'new' ? 'Start cooking' : order.status === 'preparing' ? 'Mark ready' : 'Mark picked up'}`}
        >
          <Text style={styles.actionButtonText}>
            {order.status === 'new'
              ? 'START COOKING'
              : order.status === 'preparing'
                ? 'MARK READY'
                : 'PICKED UP'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    // Re-render only on significant changes
    return (
      prevProps.order.id === nextProps.order.id &&
      prevProps.order.status === nextProps.order.status &&
      Math.abs(prevProps.elapsedSeconds - nextProps.elapsedSeconds) < 5 &&
      prevProps.isFlashing === nextProps.isFlashing
    );
  }
);

KDSOrderCard.displayName = 'KDSOrderCard';

// PERF: Extract memoized KDSColumn component
const KDSColumnComponent = React.memo(
  ({
    column,
    secondsTick,
    onOrderPress,
    flashingOrderIds,
  }: {
    column: KDSColumn;
    secondsTick: number;
    onOrderPress: (order: KDSOrder) => void;
    flashingOrderIds: Set<string>;
  }) => {
    return (
      <View style={styles.columnContainer}>
        <View style={[styles.columnHeader, { backgroundColor: column.color }]}>
          <Text style={styles.columnTitle}>{column.title}</Text>
          <View style={styles.columnCount}>
            <Text style={styles.columnCountText}>{column.orders.length}</Text>
          </View>
        </View>

        <ScrollView style={styles.columnContent} contentContainerStyle={styles.columnContentInner}>
          {column.orders.length === 0 ? (
            <View style={styles.emptyColumn}>
              <Ionicons name="checkmark-circle" size={48} color={column.color} />
              <Text style={styles.emptyText}>All caught up!</Text>
            </View>
          ) : (
            column.orders.map((order) => (
              <KDSOrderCard
                key={order.id}
                order={order}
                elapsedSeconds={calculateElapsedSeconds(order.createdAtMs)}
                onPress={onOrderPress}
                isFlashing={flashingOrderIds.has(order.id)}
              />
            ))
          )}
        </ScrollView>
      </View>
    );
  }
);

KDSColumnComponent.displayName = 'KDSColumn';

type KDSTab = 'kitchen' | 'rez-now';

export default function KDSScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<KDSTab>('kitchen');
  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [storeName, setStoreName] = useState('Store');
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeSlug, setStoreSlug] = useState<string | null>(null);
  const [secondsTick, setSecondsTick] = useState(0);
  const [clock, setClock] = useState<string>('00:00:00');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [flashingOrderIds, setFlashingOrderIds] = useState<Set<string>>(new Set());
  // Ref to track flashing IDs without triggering socket reconnect in the init useEffect
  const flashingOrderIdsRef = useRef<Set<string>>(new Set());

  const socketRef = useRef<unknown>(null);
  const secondsInterval = useRef<unknown>(null);
  const clockInterval = useRef<unknown>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<unknown>(null);
  const pollInterval = useRef<unknown>(null);
  const newOrderIdsRef = useRef<Set<string>>(new Set());

  // KENJI: integration resilience — exponential backoff reconnection strategy (1s, 2s, 4s, 8s, max 30s)
  const getReconnectDelay = (attempt: number): number => {
    const delays = [1000, 2000, 4000, 8000, 16000, 30000];
    return delays[Math.min(attempt, delays.length - 1)];
  };

  const attemptSocketReconnect = useCallback((attempt: number = 0) => {
    if (socketRef.current?.connected) {
      reconnectAttemptsRef.current = 0;
      return;
    }

    const delay = getReconnectDelay(attempt);
    logger.debug(`[KDS] Scheduling reconnection attempt ${attempt + 1} in ${delay}ms`);

    reconnectTimeoutRef.current = setTimeout(() => {
      logger.debug(`[KDS] Attempting reconnection (attempt ${attempt + 1})`);
      socketRef.current?.connect?.();
      reconnectAttemptsRef.current = attempt + 1;
    }, delay);
  }, []);

  // Load sound preference from storage
  const loadSoundPreference = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem('kds_sound_enabled');
      if (saved !== null) {
        setSoundEnabled(saved === 'true');
      }
    } catch (e) {
      logger.warn('Failed to load sound preference:', e);
    }
  }, []);

  // Save sound preference
  const saveSoundPreference = useCallback(async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem('kds_sound_enabled', String(enabled));
      setSoundEnabled(enabled);
    } catch (e) {
      logger.warn('Failed to save sound preference:', e);
    }
  }, []);

  // PERF: Wrap handler in useCallback
  const handleOrderPress = useCallback(async (order: KDSOrder) => {
    const backendStatus = order.backendStatus ?? order.status;

    // Determine KDS display status and target backend status for the API call.
    // Backend state machine: placed → confirmed → preparing → ready → dispatched/delivered
    let targetBackendStatus: OrderStatus;
    let nextKDSStatus: KDSOrder['status'];

    if (order.status === 'new') {
      targetBackendStatus = 'preparing';
      nextKDSStatus = 'preparing';
    } else if (order.status === 'preparing') {
      targetBackendStatus = 'ready';
      nextKDSStatus = 'ready';
    } else {
      // ready → mark picked up: dine-in goes to delivered, delivery goes to dispatched
      targetBackendStatus = order.dineInOrTakeaway === 'dine_in' ? 'delivered' : 'dispatched';
      nextKDSStatus = 'ready';
    }

    // Optimistic update
    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? {
              ...o,
              status: nextKDSStatus,
              backendStatus: targetBackendStatus,
              statusChangedAtMs: Date.now(),
            }
          : o
      )
    );

    // Remove order from KDS display once picked up (after short delay for visual feedback)
    if (order.status === 'ready') {
      setTimeout(() => {
        setOrders((prev) => prev.filter((o) => o.id !== order.id));
      }, 1500);
    }

    try {
      const orderId = order._id || order.id;
      // Backend state machine does not allow placed → preparing directly.
      // Must go through: placed → confirmed → preparing.
      if (backendStatus === 'placed' && targetBackendStatus === 'preparing') {
        await ordersService.updateOrderStatus(orderId, { status: 'confirmed' });
        await ordersService.updateOrderStatus(orderId, { status: 'preparing' });
      } else {
        await ordersService.updateOrderStatus(orderId, { status: targetBackendStatus });
      }
      logger.debug(`[KDS] Order ${order.orderNumber} persisted → ${targetBackendStatus}`);
    } catch (err) {
      // Revert optimistic update on API failure
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                status: order.status,
                backendStatus: order.backendStatus,
                statusChangedAtMs: order.statusChangedAtMs,
              }
            : o
        )
      );
      logger.error('[KDS] Failed to update order status:', err.message);
      Alert.alert('Update Failed', 'Could not update order status. Please try again.');
    }
  }, []);

  /**
   * normalizeKDSOrder — maps an API Order → KDSOrder shape.
   * Called on both initial HTTP load and every poll tick.
   */
  const normalizeKDSOrder = useCallback((apiOrder): KDSOrder => {
    const kdsStatus =
      apiOrder.status === 'placed' || apiOrder.status === 'confirmed'
        ? 'new'
        : apiOrder.status === 'preparing'
          ? 'preparing'
          : apiOrder.status === 'ready'
            ? 'ready'
            : 'new';

    const createdMs = apiOrder.createdAt ? new Date(apiOrder.createdAt).getTime() : Date.now();

    return {
      id: apiOrder._id || apiOrder.id,
      _id: apiOrder._id,
      orderNumber: apiOrder.orderNumber || String(apiOrder._id).slice(-6).toUpperCase(),
      status: kdsStatus,
      items: (apiOrder.items || []).map((item) => ({
        name: item.productName || item.name || 'Item',
        quantity: item.quantity ?? 1,
        special: item.specialInstructions || item.notes,
        course: item.course,
        allergens: item.allergens,
      })),
      customerName: apiOrder.customerName || apiOrder.customer?.name,
      tableNumber: apiOrder.tableNumber || apiOrder.diningDetails?.tableNumber,
      dineInOrTakeaway: apiOrder.orderType === 'dine_in' ? 'dine_in' : 'takeaway',
      platform: apiOrder.platform || (apiOrder.orderType === 'dine_in' ? 'dine_in' : 'takeaway'),
      createdAt: apiOrder.createdAt,
      createdAtMs: createdMs,
      backendStatus: apiOrder.status,
    };
  }, []);

  // Poll for orders every 30 seconds as a fallback when the WebSocket
  // is unavailable (Render cold starts, network issues, etc.)
  const pollOrders = useCallback(async () => {
    if (!storeId) return;
    try {
      // Fetch all active KDS statuses in parallel (getOrdersByStatus only accepts a single status)
      const [placedResult, confirmedResult, preparingResult, readyResult] =
        await Promise.allSettled([
          ordersService.getOrders({ status: 'placed', limit: 50, storeId }),
          ordersService.getOrders({ status: 'confirmed', limit: 50, storeId }),
          ordersService.getOrders({ status: 'preparing', limit: 50, storeId }),
          ordersService.getOrders({ status: 'ready', limit: 50, storeId }),
        ]);
      const result: { orders: Order[] } = {
        orders: [
          ...(placedResult.status === 'fulfilled' ? placedResult.value.orders : []),
          ...(confirmedResult.status === 'fulfilled' ? confirmedResult.value.orders : []),
          ...(preparingResult.status === 'fulfilled' ? preparingResult.value.orders : []),
          ...(readyResult.status === 'fulfilled' ? readyResult.value.orders : []),
        ],
      };
      const apiOrders: Order[] = result.orders || [];
      if (apiOrders.length > 0) {
        const normalized = apiOrders.map(normalizeKDSOrder);
        // Merge: keep any locally-optimistic status changes, only add new orders
        setOrders((prev) => {
          const existingIds = new Set(prev.map((o) => o.id));
          const incoming = normalized.filter((o) => !existingIds.has(o.id));
          // Update statuses for existing orders from server (server wins for non-optimistic)
          const updated = prev.map((o) => {
            const serverVersion = normalized.find((n) => n.id === o.id);
            if (!serverVersion) return o;
            // Only apply server status if it's a forward progression
            const STATUS_ORDER = { new: 0, preparing: 1, ready: 2 };
            if (STATUS_ORDER[serverVersion.status] >= STATUS_ORDER[o.status]) {
              return { ...o, status: serverVersion.status };
            }
            return o;
          });
          return [...incoming, ...updated];
        });
      }
      logger.debug(`[KDS] Polled ${apiOrders.length} orders for store: ${storeId}`);
    } catch (e) {
      logger.error('[KDS] Polling failed:', e);
    }
  }, [storeId, normalizeKDSOrder]);

  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        const merchantData = (await storageService.getMerchantData<MerchantDataShape>()) ?? {};
        if (merchantData?.storeName) setStoreName(merchantData.storeName);

        const activeStoreId =
          merchantData?.activeStoreId || merchantData?.storeId || merchantData?.id;
        setStoreId(activeStoreId ?? null);

        const slug = merchantData?.slug || merchantData?.storeSlug || null;
        setStoreSlug(slug);

        await loadSoundPreference();

        // Initial HTTP load — show orders immediately before WS connects
        try {
          const [placedResult, confirmedResult, preparingResult, readyResult] =
            await Promise.allSettled([
              ordersService.getOrders({
                status: 'placed' as OrderStatus,
                limit: 100,
                storeId: activeStoreId,
              }),
              ordersService.getOrders({
                status: 'confirmed' as OrderStatus,
                limit: 100,
                storeId: activeStoreId,
              }),
              ordersService.getOrders({
                status: 'preparing' as OrderStatus,
                limit: 100,
                storeId: activeStoreId,
              }),
              ordersService.getOrders({
                status: 'ready' as OrderStatus,
                limit: 100,
                storeId: activeStoreId,
              }),
            ]);
          const initialOrders: unknown[] = [
            ...(placedResult.status === 'fulfilled' ? placedResult.value.orders : []),
            ...(confirmedResult.status === 'fulfilled' ? confirmedResult.value.orders : []),
            ...(preparingResult.status === 'fulfilled' ? preparingResult.value.orders : []),
            ...(readyResult.status === 'fulfilled' ? readyResult.value.orders : []),
          ];
          if (initialOrders.length > 0) {
            setOrders(initialOrders.map(normalizeKDSOrder));
          }
        } catch (e) {
          logger.warn('[KDS] Initial HTTP order load failed (will rely on WS):', e);
        }

        const authToken = await storageService.getAuthToken();
        if (authToken && API_CONFIG.SOCKET_URL) {
          const token = authToken;
          socketRef.current = io(`${API_CONFIG.SOCKET_URL || API_CONFIG.BASE_URL}/kds`, {
            auth: { token },
            transports: ['websocket'],
            // KENJI: integration resilience — disable auto reconnect to use custom exponential backoff
            reconnection: false,
          });

          socketRef.current.on('connect', () => {
            reconnectAttemptsRef.current = 0;
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }
            socketRef.current.emit('join-store', { storeId: activeStoreId, token });
            logger.debug('[KDS] Connected to socket');
          });

          // KENJI: integration resilience — handle socket connection errors with exponential backoff
          socketRef.current.on('connect_error', (error) => {
            logger.warn('[KDS] Connection error:', error?.message);
            attemptSocketReconnect(reconnectAttemptsRef.current);
          });

          socketRef.current.on('new-order', (data) => {
            const orderId = data.id || data._id;
            const newOrder: KDSOrder = {
              id: orderId,
              _id: data._id,
              orderNumber: data.orderNumber,
              status: 'new',
              items: data.items || [],
              customerName: data.customerName,
              tableNumber: data.tableNumber,
              dineInOrTakeaway: data.dineInOrTakeaway || (data.dineIn ? 'dine_in' : 'takeaway'),
              platform:
                data.platform || data.dineInOrTakeaway || (data.dineIn ? 'dine_in' : 'takeaway'),
              createdAt: data.createdAt,
              createdAtMs: new Date(data.createdAt).getTime(),
            };
            setOrders((prev) => [newOrder, ...prev]);

            // Trigger flashing and sound
            newOrderIdsRef.current.add(orderId);
            flashingOrderIdsRef.current = new Set([
              ...Array.from(flashingOrderIdsRef.current),
              orderId,
            ]);
            setFlashingOrderIds(new Set(flashingOrderIdsRef.current));
            if (soundEnabled) playOrderAlert();

            // Stop flashing after 5 seconds
            setTimeout(() => {
              flashingOrderIdsRef.current.delete(orderId);
              setFlashingOrderIds(new Set(flashingOrderIdsRef.current));
            }, 5000);
          });

          // Backend emits 'kds:order-preparing' / 'kds:order-ready' on the /kds namespace.
          // These fire when any other KDS client or backend service advances an order.
          socketRef.current.on('kds:order-preparing', (data) => {
            const id = data.orderId || data.id;
            setOrders((prev) =>
              prev.map((o) =>
                o.id === id
                  ? {
                      ...o,
                      status: 'preparing',
                      backendStatus: 'preparing',
                      statusChangedAtMs: Date.now(),
                    }
                  : o
              )
            );
          });

          socketRef.current.on('kds:order-ready', (data) => {
            const id = data.orderId || data.id;
            setOrders((prev) =>
              prev.map((o) =>
                o.id === id
                  ? { ...o, status: 'ready', backendStatus: 'ready', statusChangedAtMs: Date.now() }
                  : o
              )
            );
          });

          socketRef.current.on('disconnect', () => {
            logger.debug('[KDS] Socket disconnected');
            // KENJI: integration resilience — attempt reconnection when socket disconnects
            attemptSocketReconnect(reconnectAttemptsRef.current);
          });
        }

        setIsLoading(false);
      } catch (e) {
        logger.error('KDS init failed:', e);
        setIsLoading(false);
      }
    };

    initialize();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [attemptSocketReconnect, loadSoundPreference, normalizeKDSOrder, soundEnabled]);

  // PERF: Second timer for live timers
  useEffect(() => {
    secondsInterval.current = setInterval(() => {
      setSecondsTick((t) => t + 1);
    }, 1000);

    clockInterval.current = setInterval(() => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setClock(`${h}:${m}:${s}`);
    }, 1000);

    // Poll orders every 30 seconds as fallback
    pollInterval.current = setInterval(pollOrders, 30000);

    return () => {
      if (secondsInterval.current) clearInterval(secondsInterval.current);
      if (clockInterval.current) clearInterval(clockInterval.current);
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [pollOrders]);

  // PERF: Memoize sorted order lists to prevent unnecessary re-renders
  const { newOrders, preparingOrders, readyOrders } = useMemo(() => {
    const sortByAge = (a: KDSOrder, b: KDSOrder) => a.createdAtMs - b.createdAtMs;
    return {
      newOrders: orders.filter((o) => o.status === 'new').sort(sortByAge),
      preparingOrders: orders.filter((o) => o.status === 'preparing').sort(sortByAge),
      readyOrders: orders.filter((o) => o.status === 'ready').sort(sortByAge),
    };
  }, [orders]);

  const columns: KDSColumn[] = useMemo(
    () => [
      {
        title: `NEW`,
        status: 'new',
        orders: newOrders,
        color: Colors.success[600],
        bgColor: Colors.success[50],
      },
      {
        title: `PREPARING`,
        status: 'preparing',
        orders: preparingOrders,
        color: Colors.warning[600],
        bgColor: Colors.warning[50],
      },
      {
        title: `READY`,
        status: 'ready',
        orders: readyOrders,
        color: Colors.error[600],
        bgColor: Colors.error[50],
      },
    ],
    [newOrders, preparingOrders, readyOrders]
  );

  const pendingCount = newOrders.length + preparingOrders.length;

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text
          style={{
            marginTop: Spacing.lg,
            fontSize: 16,
            color: Colors.text.primary,
          }}
        >
          Loading Kitchen Display...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* KDS Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="restaurant" size={24} color={Colors.primary[500]} />
          <View>
            <Text style={styles.headerTitle}>KITCHEN DISPLAY</Text>
            <Text style={styles.storeName}>{storeName}</Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.md,
          }}
        >
          <Text style={styles.headerClock}>{clock}</Text>

          {pendingCount > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.soundToggle}
            onPress={() => saveSoundPreference(!soundEnabled)}
            accessibilityRole="button"
            accessibilityLabel={`Sound ${soundEnabled ? 'on' : 'off'}`}
          >
            <Ionicons
              name={soundEnabled ? 'volume-high' : 'volume-mute'}
              size={24}
              color={Colors.primary[500]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.webOrdersButton}
            onPress={() => router.push('/(dashboard)/web-orders')}
            accessibilityRole="button"
            accessibilityLabel="View all REZ Now web orders"
          >
            <Ionicons name="globe-outline" size={20} color={Colors.primary[500]} />
            <Text style={styles.webOrdersButtonText}>Web Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/kds/settings')}
            accessibilityRole="button"
            accessibilityLabel="KDS settings"
          >
            <Ionicons name="settings" size={24} color={Colors.primary[500]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'kitchen' && styles.tabButtonActive]}
          onPress={() => setActiveTab('kitchen')}
          accessibilityRole="tab"
          accessibilityLabel="Kitchen orders"
        >
          <Ionicons
            name="restaurant"
            size={16}
            color={activeTab === 'kitchen' ? Colors.primary[500] : Colors.text.secondary}
          />
          <Text style={[styles.tabLabel, activeTab === 'kitchen' && styles.tabLabelActive]}>
            KITCHEN
          </Text>
          {pendingCount > 0 && activeTab !== 'kitchen' && (
            <View style={styles.rezNowBadge}>
              <Text style={styles.rezNowBadgeText}>{pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'rez-now' && styles.tabButtonActive]}
          onPress={() => setActiveTab('rez-now')}
          accessibilityRole="tab"
          accessibilityLabel="REZ Now web orders"
        >
          <Ionicons
            name="globe-outline"
            size={16}
            color={activeTab === 'rez-now' ? Colors.primary[500] : Colors.text.secondary}
          />
          <Text style={[styles.tabLabel, activeTab === 'rez-now' && styles.tabLabelActive]}>
            REZ NOW
          </Text>
        </TouchableOpacity>
      </View>

      {/* KDS Columns — Kitchen tab */}
      {activeTab === 'kitchen' && (
        <View style={styles.columnsContainer}>
          {columns.map((col) => (
            <KDSColumnComponent
              key={col.status}
              column={col}
              secondsTick={secondsTick}
              onOrderPress={handleOrderPress}
              flashingOrderIds={flashingOrderIds}
            />
          ))}
        </View>
      )}

      {/* REZ Now web orders tab */}
      {activeTab === 'rez-now' && <RezNowOrders storeSlug={storeSlug} />}
    </View>
  );
}
