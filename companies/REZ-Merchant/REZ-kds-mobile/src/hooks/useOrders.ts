import logger from './utils/logger';

/**
 * KDS Mobile Custom Hooks
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useKDSStore } from '../store/kdsStore';
import { kdsNotifications } from '../services/notifications';
import { kdsApi } from '../services/api';
import {
  KDSOrder,
  OrderStatus,
  OrderPriority,
  KitchenStation,
  KDSNotificationPayload,
} from '../types';
import { getElapsedSeconds, getTimerColor } from '../utils/helpers';
import { TIMER_THRESHOLDS } from '../utils/constants';

/**
 * Hook to manage orders with real-time updates
 */
export function useOrders() {
  const {
    orders,
    isLoading,
    isRefreshing,
    error,
    fetchOrders,
    refreshOrders,
    setSelectedOrder,
    selectedOrder,
    getFilteredOrders,
    addOrder,
    updateOrder,
    removeOrder,
  } = useKDSStore();

  const [isConnected, setIsConnected] = useState(false);

  // WebSocket connection for real-time updates
  useEffect(() => {
    // Initialize notifications
    kdsNotifications.initialize();

    // Fetch initial orders
    fetchOrders();

    // Set up polling as fallback
    const pollInterval = setInterval(() => {
      fetchOrders();
    }, 30000);

    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  // Handle new order notification
  const handleNewOrder = useCallback(async (order: KDSOrder) => {
    addOrder(order);

    // Notify
    const notificationPayload: KDSNotificationPayload = {
      orderId: order.id,
      orderNumber: order.displayNumber,
      priority: order.priority,
      station: Array.isArray(order.station) ? order.station[0] : order.station,
      itemCount: order.items.length,
      totalAmount: order.totalAmount,
      customerName: order.customer?.name || 'Guest',
      source: order.source,
    };

    await kdsNotifications.announceNewOrder(notificationPayload);
  }, [addOrder]);

  // Handle order update
  const handleOrderUpdate = useCallback((order: KDSOrder) => {
    updateOrder(order.id, order);
  }, [updateOrder]);

  // Handle order bump
  const handleOrderBump = useCallback(async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      await kdsNotifications.announceOrderBumped(order.displayNumber);
    }
  }, [orders]);

  return {
    orders: getFilteredOrders(),
    allOrders: orders,
    isLoading,
    isRefreshing,
    error,
    isConnected,
    selectedOrder,
    setSelectedOrder,
    fetchOrders,
    refreshOrders,
    handleNewOrder,
    handleOrderUpdate,
    handleOrderBump,
  };
}

/**
 * Hook for order timer
 */
export function useOrderTimer(order: KDSOrder) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    // Calculate initial elapsed time
    setElapsedSeconds(getElapsedSeconds(order.createdAt));

    // Update every second
    const interval = setInterval(() => {
      setElapsedSeconds(getElapsedSeconds(order.createdAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [order.createdAt]);

  const timerColor = useMemo(() => getTimerColor(elapsedSeconds), [elapsedSeconds]);

  const isWarning = elapsedSeconds >= TIMER_THRESHOLDS.NORMAL;
  const isCritical = elapsedSeconds >= TIMER_THRESHOLDS.WARNING;
  const isUrgent = elapsedSeconds >= TIMER_THRESHOLDS.CRITICAL;

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [elapsedSeconds]);

  return {
    elapsedSeconds,
    formattedTime,
    timerColor,
    isWarning,
    isCritical,
    isUrgent,
  };
}

/**
 * Hook for network status
 */
export function useNetworkStatus() {
  const { isOnline, setOnlineStatus } = useKDSStore();

  useEffect(() => {
    // In a real app, use @react-native-community/netinfo
    const handleConnectionChange = (connected: boolean) => {
      setOnlineStatus(connected);
    };

    // Initial check
    setOnlineStatus(true);

    // Set up listener (placeholder for actual implementation)
    const interval = setInterval(async () => {
      try {
        const isValid = await kdsApi.validateToken();
        setOnlineStatus(isValid);
      } catch {
        setOnlineStatus(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return isOnline;
}

/**
 * Hook for sound/vibration feedback
 */
export function useHapticFeedback() {
  const playHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'medium') => {
    // In a real app, use expo-haptics
    logger.info(`Haptic feedback: ${type}`);
  }, []);

  return { playHaptic };
}

/**
 * Hook for debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for interval
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const tick = () => {
      savedCallback.current();
    };

    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
}

/**
 * Hook for auto-scroll
 */
export function useAutoScroll(enabled: boolean, interval: number = 30000) {
  const scrollRef = useRef<{ scrollTo: (offset: number) => void } | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      // Implement auto-scroll logic
      logger.info('Auto-scroll triggered');
    }, interval);

    return () => clearInterval(timer);
  }, [enabled, interval]);

  return scrollRef;
}

/**
 * Hook for order statistics
 */
export function useOrderStats() {
  const orders = useKDSStore((state) => state.orders);
  const stats = useKDSStore((state) => state.stats);

  const computedStats = useMemo(() => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const activeOrders = orders.filter((o) =>
      [OrderStatus.PENDING, OrderStatus.ACKNOWLEDGED, OrderStatus.IN_PROGRESS].includes(o.status)
    );

    const completedToday = orders.filter(
      (o) =>
        o.status === OrderStatus.COMPLETED &&
        new Date(o.completedAt || o.updatedAt).getTime() > new Date(new Date().setHours(0, 0, 0, 0)).getTime()
    );

    const completedLastHour = orders.filter(
      (o) =>
        o.status === OrderStatus.COMPLETED &&
        new Date(o.completedAt || o.updatedAt).getTime() > oneHourAgo
    );

    const urgentOrders = orders.filter(
      (o) => o.priority === OrderPriority.URGENT
    );

    return {
      activeCount: activeOrders.length,
      pendingCount: activeOrders.filter((o) => o.status === OrderStatus.PENDING).length,
      inProgressCount: activeOrders.filter((o) => o.status === OrderStatus.IN_PROGRESS).length,
      completedTodayCount: completedToday.length,
      completedLastHourCount: completedLastHour.length,
      urgentCount: urgentOrders.length,
      ordersPerHour: completedLastHour.length,
    };
  }, [orders]);

  return {
    ...computedStats,
    serverStats: stats,
  };
}

/**
 * Hook for station filtering
 */
export function useStationFilter() {
  const {
    stations,
    activeStation,
    allStationActive,
    setActiveStation,
    toggleAllStation,
  } = useKDSStore();

  const filteredOrders = useMemo(() => {
    const orders = useKDSStore.getState().orders;
    if (allStationActive) return orders;

    return orders.filter((order) => {
      const orderStations = Array.isArray(order.station) ? order.station : [order.station];
      return orderStations.includes(activeStation);
    });
  }, [activeStation, allStationActive]);

  return {
    stations,
    activeStation,
    allStationActive,
    setActiveStation,
    toggleAllStation,
    filteredOrders,
  };
}
