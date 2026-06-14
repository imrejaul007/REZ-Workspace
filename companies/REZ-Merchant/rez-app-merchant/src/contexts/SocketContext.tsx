/**
 * SocketContext - React Context for WebSocket Management
 *
 * Provides WebSocket connection state and helpers throughout the app.
 * Must be nested inside AuthProvider to access authentication state.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  websocketManager,
  type OrderUpdate,
  type CustomerUpdate,
  type InventoryAlert,
  type NotificationMessage,
  type ConnectionCallback,
  type ErrorCallback,
} from '@/services/websocketManager';
import { logger } from '@/utils/logger';

// Context types
interface SocketContextValue {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  merchantId: string | null;
  reconnectAttempts: number;

  // Connection methods
  connect: (merchantId: string, token?: string) => void;
  disconnect: () => void;
  reconnect: () => void;

  // Subscription methods - typed callbacks
  subscribeToOrders: (callback: (update: OrderUpdate) => void) => () => void;
  subscribeToCustomers: (callback: (update: CustomerUpdate) => void) => () => void;
  subscribeToInventory: (callback: (alert: InventoryAlert) => void) => () => void;
  subscribeToNotifications: (callback: (notification: NotificationMessage) => void) => () => void;

  // Generic subscription
  subscribe: (channel: string, callback: (message: unknown) => void) => () => void;
  unsubscribe: (channel: string) => void;

  // Event listeners
  onConnect: (callback: ConnectionCallback) => () => void;
  onDisconnect: (callback: ConnectionCallback) => () => void;
  onError: (callback: ErrorCallback) => () => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

// Provider props
interface SocketProviderProps {
  children: React.ReactNode;
  /**
   * Auto-connect when merchant ID becomes available from auth
   * Defaults to true
   */
  autoConnect?: boolean;
  /**
   * Get auth token from parent context
   */
  getAuthToken?: () => string | null;
}

// Hook to get merchant ID from auth context
function useMerchantId(): string | null {
  // Try to get from AuthContext if available
  try {
    const { useAuth } = require('@/contexts/AuthContext');
    const { state } = useAuth();
    return state.merchant?.id || state.merchantId || null;
  } catch {
    return null;
  }
}

/**
 * SocketProvider - Provides WebSocket connection throughout the app
 *
 * Usage:
 * ```tsx
 * <SocketProvider>
 *   <App />
 * </SocketProvider>
 * ```
 */
export function SocketProvider({
  children,
  autoConnect = true,
  getAuthToken,
}: SocketProviderProps): JSX.Element {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Refs for stable callback references
  const autoConnectRef = useRef(autoConnect);
  const getAuthTokenRef = useRef(getAuthToken);

  // Update refs when props change
  useEffect(() => {
    autoConnectRef.current = autoConnect;
    getAuthTokenRef.current = getAuthToken;
  }, [autoConnect, getAuthToken]);

  // Setup connection state listeners
  useEffect(() => {
    const handleConnect = () => {
      logger.debug('[SocketContext] Connected');
      setIsConnected(true);
      setIsConnecting(false);
      setReconnectAttempts(0);
    };

    const handleDisconnect = () => {
      logger.debug('[SocketContext] Disconnected');
      setIsConnected(false);
      setIsConnecting(false);
    };

    const handleError = (error: Error) => {
      logger.error('[SocketContext] Error:', error);
      setIsConnecting(false);
    };

    const unsubscribeConnect = websocketManager.onConnect(handleConnect);
    const unsubscribeDisconnect = websocketManager.onDisconnect(handleDisconnect);
    const unsubscribeError = websocketManager.onError(handleError);

    // Check initial connection state
    if (websocketManager.isConnected()) {
      setIsConnected(true);
      setMerchantId(websocketManager.getMerchantId());
    }

    return () => {
      unsubscribeConnect();
      unsubscribeDisconnect();
      unsubscribeError();
    };
  }, []);

  // Auto-connect when merchant ID becomes available
  useEffect(() => {
    if (!autoConnectRef.current) return;

    const currentMerchantId = useMerchantId();

    if (currentMerchantId && currentMerchantId !== merchantId && !isConnected) {
      const token = getAuthTokenRef.current?.() || undefined;
      connect(currentMerchantId, token);
    }
  }, []);

  // Connect method
  const connect = useCallback((newMerchantId: string, token?: string) => {
    if (isConnecting) {
      logger.debug('[SocketContext] Already connecting');
      return;
    }

    logger.debug('[SocketContext] Connecting for merchant:', newMerchantId);
    setIsConnecting(true);
    setMerchantId(newMerchantId);
    websocketManager.connect(newMerchantId, token);
  }, [isConnecting]);

  // Disconnect method
  const disconnect = useCallback(() => {
    logger.debug('[SocketContext] Disconnecting');
    websocketManager.disconnect();
    setIsConnected(false);
    setIsConnecting(false);
    setMerchantId(null);
  }, []);

  // Reconnect method
  const reconnect = useCallback(() => {
    logger.debug('[SocketContext] Reconnecting');
    websocketManager.reconnect();
    setIsConnecting(true);
  }, []);

  // Subscribe to orders
  const subscribeToOrders = useCallback((callback: (update: OrderUpdate) => void) => {
    return websocketManager.subscribeToOrders(callback);
  }, []);

  // Subscribe to customers
  const subscribeToCustomers = useCallback((callback: (update: CustomerUpdate) => void) => {
    return websocketManager.subscribeToCustomers(callback);
  }, []);

  // Subscribe to inventory
  const subscribeToInventory = useCallback((callback: (alert: InventoryAlert) => void) => {
    return websocketManager.subscribeToInventory(callback);
  }, []);

  // Subscribe to notifications
  const subscribeToNotifications = useCallback((callback: (notification: NotificationMessage) => void) => {
    return websocketManager.subscribeToNotifications(callback);
  }, []);

  // Generic subscribe
  const subscribe = useCallback((channel: string, callback: (message: unknown) => void) => {
    return websocketManager.subscribe(channel, callback as (message: unknown) => void);
  }, []);

  // Unsubscribe
  const unsubscribe = useCallback((channel: string) => {
    websocketManager.unsubscribe(channel);
  }, []);

  // Event listeners
  const onConnect = useCallback((callback: ConnectionCallback) => {
    return websocketManager.onConnect(callback);
  }, []);

  const onDisconnect = useCallback((callback: ConnectionCallback) => {
    return websocketManager.onDisconnect(callback);
  }, []);

  const onError = useCallback((callback: ErrorCallback) => {
    return websocketManager.onError(callback);
  }, []);

  // Memoize context value
  const value = useMemo<SocketContextValue>(
    () => ({
      isConnected,
      isConnecting,
      merchantId,
      reconnectAttempts,
      connect,
      disconnect,
      reconnect,
      subscribeToOrders,
      subscribeToCustomers,
      subscribeToInventory,
      subscribeToNotifications,
      subscribe,
      unsubscribe,
      onConnect,
      onDisconnect,
      onError,
    }),
    [
      isConnected,
      isConnecting,
      merchantId,
      reconnectAttempts,
      connect,
      disconnect,
      reconnect,
      subscribeToOrders,
      subscribeToCustomers,
      subscribeToInventory,
      subscribeToNotifications,
      subscribe,
      unsubscribe,
      onConnect,
      onDisconnect,
      onError,
    ]
  );

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

/**
 * useSocket - Hook to access socket context
 *
 * Usage:
 * ```tsx
 * const { isConnected, subscribeToOrders } = useSocket();
 * ```
 */
export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext);

  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }

  return context;
}

/**
 * useSocketConnection - Hook for connection state only
 *
 * Usage:
 * ```tsx
 * const { isConnected, isConnecting, reconnect } = useSocketConnection();
 * ```
 */
export function useSocketConnection() {
  const { isConnected, isConnecting, merchantId, reconnectAttempts, connect, disconnect, reconnect } =
    useSocket();

  return {
    isConnected,
    isConnecting,
    merchantId,
    reconnectAttempts,
    connect,
    disconnect,
    reconnect,
  };
}

/**
 * useOrderUpdates - Hook for real-time order updates
 *
 * Usage:
 * ```tsx
 * const { lastOrder, subscribe } = useOrderUpdates();
 *
 * useEffect(() => {
 *   const unsub = subscribe((update) => {
 *     console.log('New order:', update.order);
 *   });
 *   return unsub;
 * }, []);
 * ```
 */
export function useOrderUpdates() {
  const { subscribeToOrders } = useSocket();
  const [lastUpdate, setLastUpdate] = useState<OrderUpdate | null>(null);

  const subscribe = useCallback(
    (callback: (update: OrderUpdate) => void) => {
      return subscribeToOrders((update) => {
        setLastUpdate(update);
        callback(update);
      });
    },
    [subscribeToOrders]
  );

  return {
    lastUpdate,
    subscribe,
  };
}

/**
 * useCustomerUpdates - Hook for real-time customer updates
 *
 * Usage:
 * ```tsx
 * const { lastUpdate, subscribe } = useCustomerUpdates();
 *
 * useEffect(() => {
 *   const unsub = subscribe((update) => {
 *     console.log('Customer update:', update.customer);
 *   });
 *   return unsub;
 * }, []);
 * ```
 */
export function useCustomerUpdates() {
  const { subscribeToCustomers } = useSocket();
  const [lastUpdate, setLastUpdate] = useState<CustomerUpdate | null>(null);

  const subscribe = useCallback(
    (callback: (update: CustomerUpdate) => void) => {
      return subscribeToCustomers((update) => {
        setLastUpdate(update);
        callback(update);
      });
    },
    [subscribeToCustomers]
  );

  return {
    lastUpdate,
    subscribe,
  };
}

/**
 * useInventoryAlerts - Hook for real-time inventory alerts
 *
 * Usage:
 * ```tsx
 * const { lastAlert, subscribe } = useInventoryAlerts();
 *
 * useEffect(() => {
 *   const unsub = subscribe((alert) => {
 *     if (alert.type === 'low_stock') {
 *       showLowStockNotification(alert.product);
 *     }
 *   });
 *   return unsub;
 * }, []);
 * ```
 */
export function useInventoryAlerts() {
  const { subscribeToInventory } = useSocket();
  const [lastAlert, setLastAlert] = useState<InventoryAlert | null>(null);

  const subscribe = useCallback(
    (callback: (alert: InventoryAlert) => void) => {
      return subscribeToInventory((alert) => {
        setLastAlert(alert);
        callback(alert);
      });
    },
    [subscribeToInventory]
  );

  return {
    lastAlert,
    subscribe,
  };
}

/**
 * useNotifications - Hook for real-time push notifications
 *
 * Usage:
 * ```tsx
 * const { lastNotification, subscribe } = useNotifications();
 *
 * useEffect(() => {
 *   const unsub = subscribe((notification) => {
 *     showToast(notification.title, notification.body);
 *   });
 *   return unsub;
 * }, []);
 * ```
 */
export function useNotifications() {
  const { subscribeToNotifications } = useSocket();
  const [lastNotification, setLastNotification] = useState<NotificationMessage | null>(null);

  const subscribe = useCallback(
    (callback: (notification: NotificationMessage) => void) => {
      return subscribeToNotifications((notification) => {
        setLastNotification(notification);
        callback(notification);
      });
    },
    [subscribeToNotifications]
  );

  return {
    lastNotification,
    subscribe,
  };
}

export default SocketContext;
