/**
 * Restaurant Kitchen Display System (KDS)
 * Real-time view of kitchen orders with status management
 */

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '@/constants/DesignTokens';
import { KitchenTicket } from './components/KitchenTicket';
import { storageService } from '@/services/storage';
import { ordersService } from '@/services/api/orders';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '@/config/api';
import { logger } from '@/utils/logger';

const { width } = Dimensions.get('window');

interface KitchenOrder {
  id: string;
  orderNumber: string;
  status: 'new' | 'preparing' | 'ready';
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    specialInstructions?: string;
    course?: 'STARTER' | 'MAIN' | 'DESSERT';
    modifiers?: string[];
    allergens?: string[];
  }>;
  customerName?: string;
  tableNumber?: string;
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  platform?: string;
  createdAt: string;
  createdAtMs: number;
  backendStatus?: string;
  priority?: 'normal' | 'rush';
}

interface Column {
  title: string;
  status: 'new' | 'preparing' | 'ready';
  orders: KitchenOrder[];
  color: string;
  bgColor: string;
}

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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerClock: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    fontFamily: 'Menlo',
  },
  pendingBadge: {
    backgroundColor: Colors.error[500],
    borderRadius: 12,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  pendingBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  soundToggle: {
    padding: Spacing.sm,
  },
  columnsContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  column: {
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
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  columnCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  columnCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  columnContent: {
    flex: 1,
    padding: Spacing.sm,
  },
  columnContentInner: {
    gap: Spacing.sm,
  },
  emptyColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingBottom: insets => insets.bottom,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  tabLabelActive: {
    color: Colors.primary[500],
    fontWeight: '700',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    gap: Spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const COLUMN_CONFIG = {
  new: {
    title: 'NEW ORDERS',
    color: Colors.success[600],
    bgColor: Colors.success[50],
  },
  preparing: {
    title: 'PREPARING',
    color: Colors.warning[600],
    bgColor: Colors.warning[50],
  },
  ready: {
    title: 'READY',
    color: Colors.error[600],
    bgColor: Colors.error[50],
  },
};

const getPlatformConfig = (platform?: string) => {
  switch (platform) {
    case 'dine_in':
    case 'dine-in':
      return { label: 'DINE-IN', color: Colors.primary[500] };
    case 'takeaway':
    case 'swiggy':
      return { label: 'TAKEAWAY', color: Colors.warning[600] };
    case 'zomato':
      return { label: 'ZOMATO', color: Colors.error[500] };
    case 'delivery_app':
      return { label: 'DELIVERY', color: Colors.success[600] };
    default:
      return { label: 'ORDER', color: Colors.gray[500] };
  }
};

export default function RestaurantKitchen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const secondsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clockIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [storeName, setStoreName] = useState('Kitchen');
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [secondsTick, setSecondsTick] = useState(0);
  const [clock, setClock] = useState('00:00:00');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);

  // Normalize API order to kitchen order
  const normalizeOrder = useCallback((apiOrder): KitchenOrder => {
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
      orderNumber: apiOrder.orderNumber || String(apiOrder._id || apiOrder.id).slice(-6).toUpperCase(),
      status: kdsStatus,
      items: (apiOrder.items || []).map((item, idx: number) => ({
        id: item.id || `item-${idx}`,
        name: item.productName || item.name || 'Item',
        quantity: item.quantity ?? 1,
        specialInstructions: item.specialInstructions || item.notes,
        course: item.course,
        modifiers: item.modifiers,
        allergens: item.allergens,
      })),
      customerName: apiOrder.customerName || apiOrder.customer?.name,
      tableNumber: apiOrder.tableNumber || apiOrder.diningDetails?.tableNumber,
      orderType: apiOrder.orderType === 'dine_in' ? 'dine_in' : 'takeaway',
      platform: apiOrder.platform || (apiOrder.orderType === 'dine_in' ? 'dine_in' : 'takeaway'),
      createdAt: apiOrder.createdAt,
      createdAtMs: createdMs,
      backendStatus: apiOrder.status,
      priority: apiOrder.priority,
    };
  }, []);

  // Load initial orders
  const loadOrders = useCallback(async () => {
    try {
      const merchantData = await storageService.getMerchantData<{ storeName?: string; activeStoreId?: string }>();
      if (merchantData?.storeName) setStoreName(merchantData.storeName);

      const activeStoreId = merchantData?.activeStoreId || merchantData?.storeId || null;
      setStoreId(activeStoreId);

      if (activeStoreId) {
        // Fetch active orders
        const [placed, preparing, ready] = await Promise.allSettled([
          ordersService.getOrders({ storeId: activeStoreId, status: 'placed', limit: 50 }),
          ordersService.getOrders({ storeId: activeStoreId, status: 'preparing', limit: 50 }),
          ordersService.getOrders({ storeId: activeStoreId, status: 'ready', limit: 50 }),
        ]);

        const allOrders: unknown[] = [
          ...(placed.status === 'fulfilled' ? placed.value.orders : []),
          ...(preparing.status === 'fulfilled' ? preparing.value.orders : []),
          ...(ready.status === 'fulfilled' ? ready.value.orders : []),
        ];

        setOrders(allOrders.map(normalizeOrder));
      }
    } catch (error) {
      logger.error('[Kitchen] Failed to load orders:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [normalizeOrder]);

  // Initialize socket for real-time updates
  useEffect(() => {
    const initializeSocket = async () => {
      const authToken = await storageService.getAuthToken();
      const merchantData = await storageService.getMerchantData<{ activeStoreId?: string }>();
      const currentStoreId = merchantData?.activeStoreId;

      if (!authToken || !currentStoreId || !API_CONFIG.SOCKET_URL) return;

      socketRef.current = io(`${API_CONFIG.SOCKET_URL}/kds`, {
        auth: { token: authToken },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      socketRef.current.on('connect', () => {
        socketRef.current?.emit('join-store', { storeId: currentStoreId, token: authToken });
        logger.debug('[Kitchen] Socket connected');
      });

      socketRef.current.on('new-order', (data) => {
        const newOrder = normalizeOrder(data);
        setOrders(prev => [newOrder, ...prev]);
      });

      socketRef.current.on('kds:order-preparing', (data) => {
        const id = data.orderId || data.id;
        setOrders(prev =>
          prev.map(o =>
            o.id === id ? { ...o, status: 'preparing', backendStatus: 'preparing' } : o
          )
        );
      });

      socketRef.current.on('kds:order-ready', (data) => {
        const id = data.orderId || data.id;
        setOrders(prev =>
          prev.map(o =>
            o.id === id ? { ...o, status: 'ready', backendStatus: 'ready' } : o
          )
        );
      });

      socketRef.current.on('disconnect', () => {
        logger.debug('[Kitchen] Socket disconnected');
      });

      return () => {
        socketRef.current?.disconnect();
      };
    };

    initializeSocket();
  }, [normalizeOrder]);

  // Timer intervals
  useEffect(() => {
    secondsIntervalRef.current = setInterval(() => {
      setSecondsTick(t => t + 1);
    }, 1000);

    clockIntervalRef.current = setInterval(() => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setClock(`${h}:${m}:${s}`);
    }, 1000);

    return () => {
      if (secondsIntervalRef.current) clearInterval(secondsIntervalRef.current);
      if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
    };
  }, []);

  // Load data on mount
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadOrders();
  }, [loadOrders]);

  // Handle order action (tap to advance status)
  const handleOrderAction = useCallback(async (order: KitchenOrder) => {
    let targetBackendStatus: string;
    let nextKDSStatus: KitchenOrder['status'];

    if (order.status === 'new') {
      targetBackendStatus = 'preparing';
      nextKDSStatus = 'preparing';
    } else if (order.status === 'preparing') {
      targetBackendStatus = 'ready';
      nextKDSStatus = 'ready';
    } else {
      // ready -> mark picked up (remove from display)
      targetBackendStatus = 'delivered';
      nextKDSStatus = 'ready';
    }

    // Optimistic update
    if (order.status === 'ready') {
      setOrders(prev => prev.filter(o => o.id !== order.id));
    } else {
      setOrders(prev =>
        prev.map(o =>
          o.id === order.id
            ? { ...o, status: nextKDSStatus, backendStatus: targetBackendStatus }
            : o
        )
      );
    }

    try {
      // Persist to backend
      if (order.backendStatus === 'placed' && targetBackendStatus === 'preparing') {
        await ordersService.updateOrderStatus(order.id, { status: 'confirmed' });
        await ordersService.updateOrderStatus(order.id, { status: 'preparing' });
      } else {
        await ordersService.updateOrderStatus(order.id, { status: targetBackendStatus });
      }
      logger.debug(`[Kitchen] Order ${order.orderNumber} updated to ${targetBackendStatus}`);
    } catch (error) {
      // Revert on failure
      setOrders(prev =>
        prev.map(o =>
          o.id === order.id
            ? { ...o, status: order.status, backendStatus: order.backendStatus }
            : o
        )
      );
      logger.error('[Kitchen] Failed to update order:', error);
      Alert.alert('Error', 'Failed to update order. Please try again.');
    }
  }, []);

  // Sort and group orders
  const { newOrders, preparingOrders, readyOrders } = useMemo(() => {
    const sortByAge = (a: KitchenOrder, b: KitchenOrder) => a.createdAtMs - b.createdAtMs;
    return {
      newOrders: orders.filter(o => o.status === 'new').sort(sortByAge),
      preparingOrders: orders.filter(o => o.status === 'preparing').sort(sortByAge),
      readyOrders: orders.filter(o => o.status === 'ready').sort(sortByAge),
    };
  }, [orders]);

  const columns: Column[] = useMemo(() => [
    { ...COLUMN_CONFIG.new, status: 'new', orders: newOrders },
    { ...COLUMN_CONFIG.preparing, status: 'preparing', orders: preparingOrders },
    { ...COLUMN_CONFIG.ready, status: 'ready', orders: readyOrders },
  ], [newOrders, preparingOrders, readyOrders]);

  const pendingCount = newOrders.length + preparingOrders.length;

  const calculateElapsed = (ms: number) => Math.floor((Date.now() - ms) / 1000);

  const getElapsedColor = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    if (mins < 10) return Colors.success[500];
    if (mins < 20) return Colors.warning[500];
    return Colors.error[500];
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={{ marginTop: Spacing.lg, color: Colors.text.secondary }}>
          Loading Kitchen Display...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.headerLeft}>
          <Ionicons name="restaurant" size={24} color={Colors.primary[500]} />
          <View>
            <Text style={styles.headerTitle}>KITCHEN DISPLAY</Text>
            <Text style={styles.storeName}>{storeName}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.headerClock}>{clock}</Text>

          {pendingCount > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.soundToggle}
            onPress={() => setSoundEnabled(!soundEnabled)}
          >
            <Ionicons
              name={soundEnabled ? 'volume-high' : 'volume-mute'}
              size={24}
              color={Colors.primary[500]}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: Colors.success[500] }]} />
          <Text style={styles.statText}>New: {newOrders.length}</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: Colors.warning[500] }]} />
          <Text style={styles.statText}>Preparing: {preparingOrders.length}</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: Colors.error[500] }]} />
          <Text style={styles.statText}>Ready: {readyOrders.length}</Text>
        </View>
      </View>

      {/* Columns */}
      <View style={styles.columnsContainer}>
        {columns.map(column => (
          <View key={column.status} style={styles.column}>
            <View style={[styles.columnHeader, { backgroundColor: column.color }]}>
              <Text style={styles.columnTitle}>{column.title}</Text>
              <View style={styles.columnCount}>
                <Text style={styles.columnCountText}>{column.orders.length}</Text>
              </View>
            </View>

            <ScrollView style={styles.columnContent} contentContainerStyle={styles.columnContentInner}>
              {column.orders.length === 0 ? (
                <View style={styles.emptyColumn}>
                  <Ionicons name="checkmark-circle" size={40} color={column.color} />
                  <Text style={styles.emptyText}>All caught up!</Text>
                </View>
              ) : (
                column.orders.map(order => (
                  <KitchenTicket
                    key={order.id}
                    order={order}
                    elapsedSeconds={calculateElapsed(order.createdAtMs)}
                    elapsedColor={getElapsedColor(calculateElapsed(order.createdAtMs))}
                    onAction={() => handleOrderAction(order)}
                    onTimerUpdate={secondsTick}
                  />
                ))
              )}
            </ScrollView>
          </View>
        ))}
      </View>
    </View>
  );
}
