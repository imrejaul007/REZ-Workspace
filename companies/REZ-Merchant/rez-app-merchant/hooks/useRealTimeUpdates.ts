import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { socketService } from '@/services';
import { SocketConnectionState } from '@/types/socket';
import { logger } from '@/utils/logger';

export interface RealTimeEvent {
  type:
    | 'order_created'
    | 'order_updated'
    | 'cashback_created'
    | 'cashback_updated'
    | 'product_updated'
    | 'metrics_updated';
  merchantId: string;
  data;
  timestamp: Date;
}

export interface RealTimeStats {
  totalConnections: number;
  totalRooms: number;
  merchantDashboards: number;
  activeSubscriptions: {
    metrics: number;
    orders: number;
    cashback: number;
  };
}

export interface DashboardUpdate {
  metrics;
  overview;
  notifications: unknown[];
  timestamp: Date;
}

export interface SystemNotification {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
}

export const useRealTimeUpdates = () => {
  const { state: authState } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<SocketConnectionState>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionStats, setConnectionStats] = useState<RealTimeStats | null>(null);
  const eventListeners = useRef<Map<string, (data) => void>>(new Map());
  const socketListenersAttached = useRef(false);
  const connectingRef = useRef(false);
  // Tracks whether the hook is still mounted. Prevents state updates on unmounted components,
  // which avoids memory leaks and React "setState on unmounted component" warnings.
  const mountedRef = useRef(true);

  // Stable references to each registered socket handler so cleanup can remove only
  // this hook instance's handlers without nuking handlers registered by other contexts
  // (e.g. TeamContext, NotificationContext) for the same event names.
  const socketHandlerRefs = useRef<Map<string, Function>>(new Map());

  // MERCH-012: Connect to real-time updates using Socket.IO
  // Note: setupSocketListeners is defined below in setupSocketListeners callback
  const connect = useCallback(async () => {
    if (connectingRef.current || socketService.isConnected()) return;
    if (!authState.merchant?.id) return;

    connectingRef.current = true;
    try {
      // Setup listeners if not already attached
      if (!socketListenersAttached.current) {
        // Connection status events
        const onConnectionStatus = (status: string) => {
          if (!mountedRef.current) return;
          setConnectionState(status as SocketConnectionState);
          setIsConnected(status === 'connected');
        };
        socketService.on('connection-status', onConnectionStatus);
        socketHandlerRefs.current.set('connection-status', onConnectionStatus);

        // Dashboard data events
        const onInitialDashboardData = (data) => {
          if (!mountedRef.current) return;
          setLastUpdate(new Date());
          const dashboardUpdate: DashboardUpdate = {
            metrics: data.metrics,
            overview: data.overview,
            notifications: data.notifications,
            timestamp: new Date(),
          };
          emitEvent('initial-dashboard-data', dashboardUpdate);
        };
        socketService.on('initial-dashboard-data', onInitialDashboardData);
        socketHandlerRefs.current.set('initial-dashboard-data', onInitialDashboardData);

        // Metrics update
        const onMetricsUpdated = (data) => {
          if (!mountedRef.current) return;
          setLastUpdate(new Date());
          const metricsUpdate: DashboardUpdate = {
            metrics: data,
            overview: null,
            notifications: [],
            timestamp: new Date(),
          };
          emitEvent('metrics-updated', metricsUpdate);
        };
        socketService.on('metrics-updated', onMetricsUpdated);
        socketHandlerRefs.current.set('metrics-updated', onMetricsUpdated);

        // Overview update
        const onOverviewUpdated = (data) => {
          if (!mountedRef.current) return;
          setLastUpdate(new Date());
          emitEvent('overview-updated', data);
        };
        socketService.on('overview-updated', onOverviewUpdated);
        socketHandlerRefs.current.set('overview-updated', onOverviewUpdated);

        // Real-time events
        const onOrderEvent = (event) => {
          if (!mountedRef.current) return;
          setLastUpdate(new Date());
          emitEvent('order-event', event);
        };
        socketService.on('order-event', onOrderEvent);
        socketHandlerRefs.current.set('order-event', onOrderEvent);

        const onCashbackEvent = (event) => {
          if (!mountedRef.current) return;
          setLastUpdate(new Date());
          emitEvent('cashback-event', event);
        };
        socketService.on('cashback-event', onCashbackEvent);
        socketHandlerRefs.current.set('cashback-event', onCashbackEvent);

        const onProductEvent = (event) => {
          if (!mountedRef.current) return;
          setLastUpdate(new Date());
          emitEvent('product-event', event);
        };
        socketService.on('product-event', onProductEvent);
        socketHandlerRefs.current.set('product-event', onProductEvent);

        // System notifications
        const onSystemNotification = (notification) => {
          if (!mountedRef.current) return;
          setLastUpdate(new Date());
          const systemNotification: SystemNotification = {
            type: notification.type,
            title: notification.title,
            message: notification.message,
            timestamp: new Date(),
          };
          emitEvent('system-notification', systemNotification);
        };
        socketService.on('system-notification', onSystemNotification);
        socketHandlerRefs.current.set('system-notification', onSystemNotification);

        // Connection error events
        const onConnectionError = (error) => {
          if (!mountedRef.current) return;
          if (__DEV__) console.error('Socket connection error:', error);
          setConnectionState('error');
          setIsConnected(false);
        };
        socketService.on('connection-error', onConnectionError);
        socketHandlerRefs.current.set('connection-error', onConnectionError);

        // Reconnection events
        const onReconnected = () => {
          if (!mountedRef.current) return;
          setConnectionState('connected');
          setIsConnected(true);
          setLastUpdate(new Date());
        };
        socketService.on('reconnected', onReconnected);
        socketHandlerRefs.current.set('reconnected', onReconnected);

        const onReconnecting = () => {
          if (!mountedRef.current) return;
          setConnectionState('reconnecting');
        };
        socketService.on('reconnecting', onReconnecting);
        socketHandlerRefs.current.set('reconnecting', onReconnecting);

        // Mark listeners as attached AFTER all have been successfully registered
        socketListenersAttached.current = true;
      }

      await socketService.connect();
      await socketService.joinMerchantDashboard();

      if (__DEV__) {
        logger.info('[Socket] Real-time updates connected');
      }
    } catch (error) {
      if (__DEV__) {
        logger.warn('[Socket] Connection failed (non-critical)');
      }
    } finally {
      connectingRef.current = false;
    }
  }, [authState.merchant?.id]);

  // MERCH-011: Reset connectingRef on disconnect
  const disconnect = useCallback(() => {
    connectingRef.current = false;
    socketService.disconnect();
    setIsConnected(false);
    setConnectionState('disconnected');
    if (__DEV__) {
      logger.info('Real-time Socket.IO disconnected');
    }
  }, []);

  // Cleanup socket listeners — removes only THIS hook instance's handlers so other
  // contexts (TeamContext, NotificationContext) that registered their own handlers
  // for overlapping event names (e.g. 'connection-status') are unaffected.
  const cleanupSocketListeners = useCallback(() => {
    if (!socketListenersAttached.current) return;

    socketHandlerRefs.current.forEach((handler, eventName) => {
      socketService.off(eventName, handler);
    });
    socketHandlerRefs.current.clear();

    socketListenersAttached.current = false;
  }, []);

  const emitEvent = (eventName: string, data) => {
    const listener = eventListeners.current.get(eventName);
    if (listener) {
      listener(data);
    }
  };

  // Get connection stats from socket service
  const fetchConnectionStats = useCallback(() => {
    const stats = socketService.getStats();
    const metricsCount = eventListeners.current.has('metrics-updated') ? 1 : 0;
    const ordersCount = eventListeners.current.has('order-event') ? 1 : 0;
    const cashbackCount = eventListeners.current.has('cashback-event') ? 1 : 0;
    const realtimeStats: RealTimeStats = {
      totalConnections: eventListeners.current.size,
      totalRooms: eventListeners.current.size,
      merchantDashboards: isConnected ? eventListeners.current.size : 0,
      activeSubscriptions: {
        metrics: metricsCount,
        orders: ordersCount,
        cashback: cashbackCount,
      },
    };
    setConnectionStats(realtimeStats);
  }, [isConnected]);

  // Event subscription methods
  const subscribeToMetrics = useCallback((callback: (data: DashboardUpdate) => void) => {
    eventListeners.current.set('metrics-updated', callback);
    socketService.subscribeToMetrics().catch((e) => {
      if (__DEV__) console.error('[Socket] subscribeToMetrics error:', e);
    });

    return () => {
      eventListeners.current.delete('metrics-updated');
    };
  }, []);

  const subscribeToOrders = useCallback((callback: (event: RealTimeEvent) => void) => {
    eventListeners.current.set('order-event', callback);
    socketService.subscribeToOrders().catch((e) => {
      if (__DEV__) console.error('[Socket] subscribeToOrders error:', e);
    });

    return () => {
      eventListeners.current.delete('order-event');
    };
  }, []);

  const subscribeToCashback = useCallback((callback: (event: RealTimeEvent) => void) => {
    eventListeners.current.set('cashback-event', callback);
    socketService.subscribeToCashback().catch((e) => {
      if (__DEV__) console.error('[Socket] subscribeToCashback error:', e);
    });

    return () => {
      eventListeners.current.delete('cashback-event');
    };
  }, []);

  const subscribeToProducts = useCallback((callback: (event: RealTimeEvent) => void) => {
    eventListeners.current.set('product-event', callback);
    socketService.subscribeToProducts().catch((e) => {
      if (__DEV__) console.error('[Socket] subscribeToProducts error:', e);
    });

    return () => {
      eventListeners.current.delete('product-event');
    };
  }, []);

  const subscribeToSystemNotifications = useCallback(
    (callback: (notification: SystemNotification) => void) => {
      eventListeners.current.set('system-notification', callback);
      socketService.subscribeToNotifications().catch((e) => {
        if (__DEV__) console.error('[Socket] subscribeToNotifications error:', e);
      });

      return () => {
        eventListeners.current.delete('system-notification');
      };
    },
    []
  );

  const subscribeToChartData = useCallback((callback: (data) => void) => {
    eventListeners.current.set('live-chart-data', callback);

    return () => {
      eventListeners.current.delete('live-chart-data');
    };
  }, []);

  // Manual trigger methods
  const triggerMetricsUpdate = useCallback(() => {
    fetchConnectionStats();
  }, [fetchConnectionStats]);

  const requestChartData = useCallback(
    async (period: number = 24) => {
      if (!authState.merchant?.id) return;
      logger.info('Chart data requested via Socket.IO');
      // Chart data requests can be sent via socket if backend supports it
    },
    [authState.merchant?.id]
  );

  const reconnect = useCallback(async () => {
    disconnect();
    await connect();
  }, [connect, disconnect]);

  // MERCH-013: Setup socket listeners and auto-connect when merchant is available
  // NOTE: Don't disconnect in cleanup — the socket is a singleton and should stay
  // alive while authenticated. AuthContext.logout() handles disconnect on logout.
  // Disconnecting in cleanup causes errors in React Strict Mode (dev) due to
  // mount→unmount→remount cycle destroying in-flight connections.
  useEffect(() => {
    mountedRef.current = true;

    if (authState.merchant?.id) {
      connect();
    } else {
      cleanupSocketListeners();
      disconnect();
    }

    return () => {
      // Remove all socket listeners before marking as unmounted so no in-flight
      // events can fire state setters on the now-dead component instance.
      cleanupSocketListeners();
      socketListenersAttached.current = false;
      // MERCH-011: Reset connectingRef on unmount to allow reconnection
      connectingRef.current = false;
      // Mark unmounted last so the guard in each listener is still true during cleanup.
      mountedRef.current = false;
    };
  }, [authState.merchant?.id, connect, cleanupSocketListeners, disconnect]);

  // Update connection stats periodically
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(fetchConnectionStats, 10000); // Every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isConnected, fetchConnectionStats]);

  return {
    // Connection state
    isConnected,
    connectionState,
    lastUpdate,
    connectionStats,

    // Connection methods
    connect,
    disconnect,
    reconnect,

    // Subscription methods
    subscribeToMetrics,
    subscribeToOrders,
    subscribeToCashback,
    subscribeToProducts,
    subscribeToSystemNotifications,
    subscribeToChartData,

    // Manual trigger methods
    triggerMetricsUpdate,
    requestChartData,
  };
};

// Hook for dashboard-specific real-time updates
export const useDashboardRealTime = () => {
  const realTime = useRealTimeUpdates();
  const [dashboardData, setDashboardData] = useState<DashboardUpdate | null>(null);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  // FIX-3: Destructure stable useCallback refs from realTime instead of depending on the
  // whole object. The `realTime` object is recreated on every render of useRealTimeUpdates,
  // so `[realTime]` as a dep causes infinite subscription/unsubscription loops.
  // subscribeToMetrics and subscribeToSystemNotifications are wrapped in useCallback([])
  // so their identities are stable across renders.
  const { subscribeToMetrics, subscribeToSystemNotifications } = realTime;

  useEffect(() => {
    // Subscribe to metrics updates
    const unsubscribeMetrics = subscribeToMetrics((data) => {
      setDashboardData(data);
    });

    // Subscribe to system notifications
    const unsubscribeNotifications = subscribeToSystemNotifications((notification) => {
      setNotifications((prev) => [notification, ...prev.slice(0, 9)]); // Keep last 10
    });

    return () => {
      unsubscribeMetrics();
      unsubscribeNotifications();
    };
  }, [subscribeToMetrics, subscribeToSystemNotifications]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  const markNotificationRead = (index: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  };

  return {
    ...realTime,
    dashboardData,
    notifications,
    clearNotifications,
    markNotificationRead,
  };
};

// Hook for order-specific real-time updates
export const useOrderRealTime = () => {
  const realTime = useRealTimeUpdates();
  const [orderEvents, setOrderEvents] = useState<RealTimeEvent[]>([]);

  // FIX-3: Destructure stable callback ref instead of depending on the whole realTime object.
  const { subscribeToOrders } = realTime;

  useEffect(() => {
    const unsubscribe = subscribeToOrders((event) => {
      setOrderEvents((prev) => [event, ...prev.slice(0, 19)]); // Keep last 20
    });

    return unsubscribe;
  }, [subscribeToOrders]);

  const clearOrderEvents = () => {
    setOrderEvents([]);
  };

  return {
    ...realTime,
    orderEvents,
    clearOrderEvents,
  };
};

// Hook for cashback-specific real-time updates
export const useCashbackRealTime = () => {
  const realTime = useRealTimeUpdates();
  const [cashbackEvents, setCashbackEvents] = useState<RealTimeEvent[]>([]);

  // FIX-3: Destructure stable callback ref to avoid infinite re-subscription.
  const { subscribeToCashback } = realTime;

  useEffect(() => {
    const unsubscribe = subscribeToCashback((event) => {
      setCashbackEvents((prev) => [event, ...prev.slice(0, 19)]); // Keep last 20
    });

    return unsubscribe;
  }, [subscribeToCashback]);

  const clearCashbackEvents = () => {
    setCashbackEvents([]);
  };

  return {
    ...realTime,
    cashbackEvents,
    clearCashbackEvents,
  };
};

// Hook for chart-specific real-time updates
export const useChartRealTime = () => {
  const realTime = useRealTimeUpdates();
  const [chartData, setChartData] = useState<unknown>(null);

  // FIX-3: Destructure stable callback ref to avoid infinite re-subscription.
  const { subscribeToChartData } = realTime;

  useEffect(() => {
    const unsubscribe = subscribeToChartData((data) => {
      setChartData(data);
    });

    return unsubscribe;
  }, [subscribeToChartData]);

  return {
    ...realTime,
    chartData,
  };
};
