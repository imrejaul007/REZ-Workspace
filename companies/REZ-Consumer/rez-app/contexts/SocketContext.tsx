// @ts-nocheck
import React, { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback, useMemo } from 'react';
// Lazy-loaded: socket.io-client (100KB+) only loaded when SocketProvider mounts
type Socket = unknown;
const getIO = async () => (await import('socket.io-client')).io;
import Constants from 'expo-constants';
import { useSocketStore, type SocketStoreState } from '@/stores/socketStore';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { getAuthToken, getUser } from '@/utils/authStorage';
import { useAuthStore, type AuthStoreState } from '@/stores/authStore';
import {
  SocketEvents,
  SocketState,
  SocketConfig,
  StockUpdatePayload,
  LowStockPayload,
  OutOfStockPayload,
  PriceUpdatePayload,
  ProductAvailabilityPayload,
  FlashSaleStartedPayload,
  FlashSaleEndingSoonPayload,
  FlashSaleEndedPayload,
  FlashSaleStockUpdatedPayload,
  FlashSaleStockLowPayload,
  FlashSaleSoldOutPayload,
  StockUpdateCallback,
  LowStockCallback,
  OutOfStockCallback,
  PriceUpdateCallback,
  ProductAvailabilityCallback,
  FlashSaleStartedCallback,
  FlashSaleEndingSoonCallback,
  FlashSaleEndedCallback,
  FlashSaleStockUpdatedCallback,
  FlashSaleStockLowCallback,
  FlashSaleSoldOutCallback,
  ConnectionCallback,
  ErrorCallback,
  OrderStatusUpdateCallback,
  OrderListUpdatedCallback,
  CashbackCreditedCallback,
  CashbackReversedCallback,
  StreakMilestoneCallback,
  StreakBrokenCallback,
} from '@/types/socket.types';

// Get Socket URL from environment
// SECURITY FIX: Removed localhost fallback - require explicit API_BASE_URL configuration.
const getSocketUrl = (): string => {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl) {
    if (__DEV__) {
      // Only allow localhost fallback in development
      return 'http://localhost:5001';
    }
    throw new Error('[SocketContext] FATAL: EXPO_PUBLIC_API_BASE_URL is not set in production.');
  }
  // Extract the base URL without /api path
  const baseUrl = apiBaseUrl.replace('/api', '');

  // For web, use the configured URL as-is
  if (Platform.OS === 'web') {
    return baseUrl;
  }

  // In development on the Android emulator, replace localhost with the emulator's
  // host alias so the socket can reach the dev server on the host machine.
  // Gated with __DEV__ so physical-device production builds never apply this rewrite.
  if (__DEV__ && (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1'))) {
    return baseUrl.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }

  return baseUrl;
};

// Socket configuration with sensible defaults
const DEFAULT_CONFIG: Partial<SocketConfig> = {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
};

interface SocketContextType {
  socket: Socket | null;
  state: SocketState;

  // Connection methods
  connect: () => void;
  disconnect: () => void;

  // Event subscription methods
  onStockUpdate: (callback: StockUpdateCallback) => () => void;
  onLowStock: (callback: LowStockCallback) => () => void;
  onOutOfStock: (callback: OutOfStockCallback) => () => void;
  onPriceUpdate: (callback: PriceUpdateCallback) => () => void;
  onProductAvailability: (callback: ProductAvailabilityCallback) => () => void;
  onProductCreated: (callback: (payload) => void) => () => void;
  onConnect: (callback: ConnectionCallback) => () => void;
  onDisconnect: (callback: ConnectionCallback) => () => void;
  onError: (callback: ErrorCallback) => () => void;

  // Flash sale event subscription methods
  onFlashSaleStarted: (callback: FlashSaleStartedCallback) => () => void;
  onFlashSaleEndingSoon: (callback: FlashSaleEndingSoonCallback) => () => void;
  onFlashSaleEnded: (callback: FlashSaleEndedCallback) => () => void;
  onFlashSaleStockUpdated: (callback: FlashSaleStockUpdatedCallback) => () => void;
  onFlashSaleStockLow: (callback: FlashSaleStockLowCallback) => () => void;
  onFlashSaleSoldOut: (callback: FlashSaleSoldOutCallback) => () => void;

  // Product/Store subscription methods
  subscribeToProduct: (productId: string) => void;
  unsubscribeFromProduct: (productId: string) => void;
  subscribeToStore: (storeId: string) => void;
  unsubscribeFromStore: (storeId: string) => void;

  // Order tracking subscription methods
  subscribeToOrder: (orderId: string, userId?: string) => void;
  unsubscribeFromOrder: (orderId: string) => void;
  onOrderStatusUpdate: (callback: OrderStatusUpdateCallback) => () => void;
  onOrderListUpdated: (callback: OrderListUpdatedCallback) => () => void;

  // Cashback event listeners
  onCashbackCredited: (callback: CashbackCreditedCallback) => () => void;
  onCashbackReversed: (callback: CashbackReversedCallback) => () => void;

  // Streak/milestone event listeners
  onStreakMilestone: (callback: StreakMilestoneCallback) => () => void;
  onStreakBroken: (callback: StreakBrokenCallback) => () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
  config?: Partial<SocketConfig>;
}

export function SocketProvider({ children, config }: SocketProviderProps) {
  // Reactive token from auth store — triggers socket reconnect when token refreshes
  const authToken = useAuthStore((s: AuthStoreState) => s.state.token);

  const [socketState, setSocketState] = useState<SocketState>({
    connected: false,
    reconnecting: false,
    error: null,
    lastConnected: null,
    reconnectAttempts: 0,
  });

  const socketRef = useRef<Socket | null>(null);
  const subscribedProducts = useRef<Set<string>>(new Set());
  const subscribedStores = useRef<Set<string>>(new Set());
  // Tracks orderId -> userId pairs so we can re-subscribe after reconnect
  const subscribedOrders = useRef<Map<string, string | undefined>>(new Map());

  // Initialize socket connection (deferred: socket.io-client loaded on demand)
  // FIXED: Properly cleanup event listeners to prevent memory leaks
  // FIXED: Re-runs when authToken changes (token refresh every ~2min) so the socket
  //        always carries a valid Bearer token. Cleanup disconnects the old socket first.
  useEffect(() => {
    let cancelled = false;
    const socketUrl = getSocketUrl();
    const socketConfig = { ...DEFAULT_CONFIG, ...config };

    Promise.all([getIO(), getAuthToken(), getUser()]).then(([io, storageToken, user]) => {
      if (cancelled) return;
      // Prefer the reactive authStore token (always up-to-date after refresh);
      // fall back to the async storage value for the initial mount before the store is populated.
      const token = authToken ?? storageToken;
      if (!token) {
        return;
      }
      // Skip socket connection during onboarding to reduce load on Android
      if (!user?.isOnboarded) {
        return;
      }
      try {
        const socket = io(socketUrl, {
          transports: ['websocket', 'polling'],
          autoConnect: socketConfig.autoConnect,
          reconnection: socketConfig.reconnection,
          reconnectionAttempts: socketConfig.reconnectionAttempts,
          reconnectionDelay: socketConfig.reconnectionDelay,
          reconnectionDelayMax: socketConfig.reconnectionDelayMax,
          timeout: socketConfig.timeout,
          auth: { token },
        });

        socketRef.current = socket;

      // Define all event handlers in an object for easy cleanup
      const handleConnect = () => {
        setSocketState(prev => ({
          ...prev,
          connected: true,
          reconnecting: false,
          error: null,
          lastConnected: new Date(),
          reconnectAttempts: 0,
        }));
        resubscribeAll();
      };

      const handleDisconnect = (reason: string) => {
        setSocketState(prev => ({
          ...prev,
          connected: false,
          reconnecting: reason === 'io server disconnect' ? false : true,
        }));
      };

      const handleConnectError = (error: Error) => {
        setSocketState(prev => ({
          ...prev,
          error: error.message,
          reconnecting: true,
        }));
      };

      const handleReconnectAttempt = (attemptNumber: number) => {
        setSocketState(prev => ({
          ...prev,
          reconnecting: true,
          reconnectAttempts: attemptNumber,
        }));
      };

      const handleReconnect = (attemptNumber: number) => {
        setSocketState(prev => ({
          ...prev,
          connected: true,
          reconnecting: false,
          error: null,
          lastConnected: new Date(),
          reconnectAttempts: 0,
        }));
      };

      const handleReconnectError = (error: Error) => {
        setSocketState(prev => ({
          ...prev,
          error: error.message,
        }));
      };

      const handleReconnectFailed = () => {
        setSocketState(prev => ({
          ...prev,
          reconnecting: false,
          error: 'Failed to reconnect after maximum attempts',
        }));
      };

      // Attach all connection event listeners
      socket.on(SocketEvents.CONNECT, handleConnect);
      socket.on(SocketEvents.DISCONNECT, handleDisconnect);
      socket.on(SocketEvents.CONNECT_ERROR, handleConnectError);
      socket.on(SocketEvents.RECONNECT_ATTEMPT, handleReconnectAttempt);
      socket.on(SocketEvents.RECONNECT, handleReconnect);
      socket.on(SocketEvents.RECONNECT_ERROR, handleReconnectError);
      socket.on(SocketEvents.RECONNECT_FAILED, handleReconnectFailed);

      } catch (error) {
        setSocketState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to initialize socket',
        }));
      }
    }).catch((err: Error) => {
      if (!cancelled) {
        setSocketState(prev => ({
          ...prev,
          connected: false,
          reconnecting: false,
          error: err?.message ?? 'Failed to initialize socket',
        }));
      }
    });

    // Pause/resume socket on app background/foreground (native only)
    const handleAppState = (nextAppState: AppStateStatus) => {
      if (!socketRef.current) return;

      if (nextAppState === 'active') {
        // App came to foreground — reconnect if disconnected
        if (!socketRef.current.connected) {
          socketRef.current.connect();
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App went to background — disconnect to save battery (native only)
        if (Platform.OS !== 'web' && socketRef.current.connected) {
          socketRef.current.disconnect();
        }
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppState);

    // CRITICAL: Cleanup function to prevent memory leaks
    return () => {
      cancelled = true;
      appStateSubscription.remove();
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [authToken]); // Re-run when token refreshes so socket auth stays current

  // Re-subscribe to all products, stores, and orders after reconnection
  const resubscribeAll = useCallback(() => {
    if (!socketRef.current) return;

    subscribedProducts.current.forEach(productId => {
      socketRef.current?.emit(SocketEvents.SUBSCRIBE_PRODUCT, { productId });
    });

    subscribedStores.current.forEach(storeId => {
      socketRef.current?.emit(SocketEvents.SUBSCRIBE_STORE, { storeId });
    });

    subscribedOrders.current.forEach((userId, orderId) => {
      socketRef.current?.emit(SocketEvents.SUBSCRIBE_ORDER, { orderId, userId });
    });
  }, []);

  // Connection methods
  const connect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {

      socketRef.current.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {

      socketRef.current.disconnect();
    }
  }, []);

  // Event subscription methods
  const onStockUpdate = useCallback((callback: StockUpdateCallback) => {
    if (!socketRef.current) return () => {};

    socketRef.current.on(SocketEvents.STOCK_UPDATED, callback);

    return () => {
      socketRef.current?.off(SocketEvents.STOCK_UPDATED, callback);
    };
  }, []);

  const onLowStock = useCallback((callback: LowStockCallback) => {
    if (!socketRef.current) return () => {};

    socketRef.current.on(SocketEvents.STOCK_LOW, callback);

    return () => {
      socketRef.current?.off(SocketEvents.STOCK_LOW, callback);
    };
  }, []);

  const onOutOfStock = useCallback((callback: OutOfStockCallback) => {
    if (!socketRef.current) return () => {};

    socketRef.current.on(SocketEvents.STOCK_OUT, callback);

    return () => {
      socketRef.current?.off(SocketEvents.STOCK_OUT, callback);
    };
  }, []);

  const onPriceUpdate = useCallback((callback: PriceUpdateCallback) => {
    if (!socketRef.current) return () => {};

    socketRef.current.on(SocketEvents.PRICE_UPDATED, callback);

    return () => {
      socketRef.current?.off(SocketEvents.PRICE_UPDATED, callback);
    };
  }, []);

  const onProductAvailability = useCallback((callback: ProductAvailabilityCallback) => {
    if (!socketRef.current) return () => {};

    socketRef.current.on(SocketEvents.PRODUCT_AVAILABILITY, callback);

    return () => {
      socketRef.current?.off(SocketEvents.PRODUCT_AVAILABILITY, callback);
    };
  }, []);

  // Listen for product creation events (backend must emit product_created event)
  // BACKEND REQUIREMENT: The backend must emit 'product_created' socket event when new products are created
  // for the product live updates to work. Event payload should include: { productId, storeId, product }
  const onProductCreated = useCallback((callback: (payload) => void) => {
    if (!socketRef.current) return () => {};

    socketRef.current.on('product_created', callback);

    return () => {
      socketRef.current?.off('product_created', callback);
    };
  }, []);

  const onConnect = useCallback((callback: ConnectionCallback) => {
    if (!socketRef.current) return () => {};

    socketRef.current.on(SocketEvents.CONNECT, callback);

    return () => {
      socketRef.current?.off(SocketEvents.CONNECT, callback);
    };
  }, []);

  const onDisconnect = useCallback((callback: ConnectionCallback) => {
    if (!socketRef.current) return () => {};

    socketRef.current.on(SocketEvents.DISCONNECT, callback);

    return () => {
      socketRef.current?.off(SocketEvents.DISCONNECT, callback);
    };
  }, []);

  const onError = useCallback((callback: ErrorCallback) => {
    if (!socketRef.current) return () => {};

    const errorHandler = (error) => {
      callback(error instanceof Error ? error : new Error(String(error)));
    };

    socketRef.current.on(SocketEvents.CONNECT_ERROR, errorHandler);

    return () => {
      socketRef.current?.off(SocketEvents.CONNECT_ERROR, errorHandler);
    };
  }, []);

  // Flash sale event subscription methods
  const onFlashSaleStarted = useCallback((callback: FlashSaleStartedCallback) => {
    if (!socketRef.current) return () => {};

    socketRef.current.on(SocketEvents.FLASH_SALE_STARTED, callback);

    return () => {
      socketRef.current?.off(SocketEvents.FLASH_SALE_STARTED, callback);
    };
  }, []);

  const onFlashSaleEndingSoon = useCallback((callback: FlashSaleEndingSoonCallback) => {
    if (!socketRef.current) return () => {};

    socketRef.current.on(SocketEvents.FLASH_SALE_ENDING_SOON, callback);

    return () => {
      socketRef.current?.off(SocketEvents.FLASH_SALE_ENDING_SOON, callback);
    };
  }, []);

  const onFlashSaleEnded = useCallback((callback: FlashSaleEndedCallback) => {
    if (!socketRef.current) return () => {};

    socketRef.current.on(SocketEvents.FLASH_SALE_ENDED, callback);

    return () => {
      socketRef.current?.off(SocketEvents.FLASH_SALE_ENDED, callback);
    };
  }, []);

  const onFlashSaleStockUpdated = useCallback((callback: FlashSaleStockUpdatedCallback) => {
    if (!socketRef.current) return () => {};

    socketRef.current.on(SocketEvents.FLASH_SALE_STOCK_UPDATED, callback);

    return () => {
      socketRef.current?.off(SocketEvents.FLASH_SALE_STOCK_UPDATED, callback);
    };
  }, []);

  const onFlashSaleStockLow = useCallback((callback: FlashSaleStockLowCallback) => {
    if (!socketRef.current) return () => {};

    socketRef.current.on(SocketEvents.FLASH_SALE_STOCK_LOW, callback);

    return () => {
      socketRef.current?.off(SocketEvents.FLASH_SALE_STOCK_LOW, callback);
    };
  }, []);

  const onFlashSaleSoldOut = useCallback((callback: FlashSaleSoldOutCallback) => {
    if (!socketRef.current) return () => {};

    socketRef.current.on(SocketEvents.FLASH_SALE_SOLD_OUT, callback);

    return () => {
      socketRef.current?.off(SocketEvents.FLASH_SALE_SOLD_OUT, callback);
    };
  }, []);

  // Product/Store subscription methods
  const subscribeToProduct = useCallback((productId: string) => {
    if (!socketRef.current || !socketRef.current.connected) {
      return;
    }

    socketRef.current.emit(SocketEvents.SUBSCRIBE_PRODUCT, { productId });
    subscribedProducts.current.add(productId);
  }, []);

  const unsubscribeFromProduct = useCallback((productId: string) => {
    if (!socketRef.current || !socketRef.current.connected) {
      return;
    }

    socketRef.current.emit(SocketEvents.UNSUBSCRIBE_PRODUCT, { productId });
    subscribedProducts.current.delete(productId);
  }, []);

  const subscribeToStore = useCallback((storeId: string) => {
    if (!socketRef.current || !socketRef.current.connected) {
      return;
    }

    socketRef.current.emit(SocketEvents.SUBSCRIBE_STORE, { storeId });
    subscribedStores.current.add(storeId);
  }, []);

  const unsubscribeFromStore = useCallback((storeId: string) => {
    if (!socketRef.current || !socketRef.current.connected) {
      return;
    }

    socketRef.current.emit(SocketEvents.UNSUBSCRIBE_STORE, { storeId });
    subscribedStores.current.delete(storeId);
  }, []);

  // Subscribe to a specific order room for live tracking.
  // The server validates ownership before allowing the join.
  // We store the orderId so resubscribeAll can re-join after reconnect.
  const subscribeToOrder = useCallback((orderId: string, userId?: string) => {
    subscribedOrders.current.set(orderId, userId);
    if (!socketRef.current || !socketRef.current.connected) {
      return;
    }
    socketRef.current.emit(SocketEvents.SUBSCRIBE_ORDER, { orderId, userId });
  }, []);

  const unsubscribeFromOrder = useCallback((orderId: string) => {
    subscribedOrders.current.delete(orderId);
    if (!socketRef.current || !socketRef.current.connected) {
      return;
    }
    socketRef.current.emit(SocketEvents.UNSUBSCRIBE_ORDER, { orderId });
  }, []);

  // Listen for order:status_updated events (emitted to the order-${orderId} room).
  // Also fires for status-specific sub-events (order:confirmed, order:preparing, etc.).
  const onOrderStatusUpdate = useCallback((callback: OrderStatusUpdateCallback) => {
    if (!socketRef.current) return () => {};

    const events = [
      SocketEvents.ORDER_STATUS_UPDATED,
      SocketEvents.ORDER_CONFIRMED,
      SocketEvents.ORDER_PREPARING,
      SocketEvents.ORDER_READY,
      SocketEvents.ORDER_DISPATCHED,
      SocketEvents.ORDER_OUT_FOR_DELIVERY,
      SocketEvents.ORDER_DELIVERED,
      SocketEvents.ORDER_CANCELLED,
      // CRITICAL-1 FIX: Listen for order:refunded emitted by the monolith after
      // admin-initiated refunds. On receipt the callback (e.g. useOrderTracking)
      // triggers a wallet refresh so the refunded coins appear immediately.
      'order:refunded',
    ];
    events.forEach(ev => socketRef.current?.on(ev, callback));
    return () => {
      events.forEach(ev => socketRef.current?.off(ev, callback));
    };
  }, []);

  // Listen for order:list_updated events (emitted to the user-${userId} room).
  // Useful for the orders list screen to update badges/statuses without a full refetch.
  const onOrderListUpdated = useCallback((callback: OrderListUpdatedCallback) => {
    if (!socketRef.current) return () => {};

    socketRef.current.on(SocketEvents.ORDER_LIST_UPDATED, callback);
    return () => {
      socketRef.current?.off(SocketEvents.ORDER_LIST_UPDATED, callback);
    };
  }, []);

  // Listen for cashback:credited events from the backend earnings service.
  // Emitted to the user-${userId} room when cashback is awarded after order completion.
  const onCashbackCredited = useCallback((callback: CashbackCreditedCallback) => {
    if (!socketRef.current) return () => {};

    socketRef.current.on(SocketEvents.CASHBACK_CREDITED, callback);
    return () => {
      socketRef.current?.off(SocketEvents.CASHBACK_CREDITED, callback);
    };
  }, []);

  // Listen for cashback:reversed events (e.g. order cancellation).
  const onCashbackReversed = useCallback((callback: CashbackReversedCallback) => {
    if (!socketRef.current) return () => {};

    socketRef.current.on(SocketEvents.CASHBACK_REVERSED, callback);
    return () => {
      socketRef.current?.off(SocketEvents.CASHBACK_REVERSED, callback);
    };
  }, []);

  // Listen for streak:milestone events from the gamification service.
  // Emitted to the user-${userId} room when a streak milestone is reached.
  const onStreakMilestone = useCallback((callback: StreakMilestoneCallback) => {
    if (!socketRef.current) return () => {};

    socketRef.current.on(SocketEvents.STREAK_MILESTONE, callback);
    return () => {
      socketRef.current?.off(SocketEvents.STREAK_MILESTONE, callback);
    };
  }, []);

  // Listen for streak:broken events when a daily streak is reset.
  const onStreakBroken = useCallback((callback: StreakBrokenCallback) => {
    if (!socketRef.current) return () => {};

    socketRef.current.on(SocketEvents.STREAK_BROKEN, callback);
    return () => {
      socketRef.current?.off(SocketEvents.STREAK_BROKEN, callback);
    };
  }, []);

  // OPTIMIZED: Separate stable actions (empty deps) from volatile state so that
  // consumers who only use actions are not re-rendered on every connection change.
  const stableActions = useMemo(() => ({
    connect,
    disconnect,
    onStockUpdate,
    onLowStock,
    onOutOfStock,
    onPriceUpdate,
    onProductAvailability,
    onProductCreated,
    onConnect,
    onDisconnect,
    onError,
    onFlashSaleStarted,
    onFlashSaleEndingSoon,
    onFlashSaleEnded,
    onFlashSaleStockUpdated,
    onFlashSaleStockLow,
    onFlashSaleSoldOut,
    subscribeToProduct,
    unsubscribeFromProduct,
    subscribeToStore,
    unsubscribeFromStore,
    subscribeToOrder,
    unsubscribeFromOrder,
    onOrderStatusUpdate,
    onOrderListUpdated,
    onCashbackCredited,
    onCashbackReversed,
    onStreakMilestone,
    onStreakBroken,
  }), []); // all action callbacks have stable identity (empty deps on each useCallback)

  const contextValue: SocketContextType = useMemo(() => ({
    socket: socketRef.current,
    state: socketState,
    ...stableActions,
  }), [socketState, stableActions]);

  // Sync connection state to Zustand store for crash-safe fallback
  const _setFromProvider = useSocketStore((s: SocketStoreState) => s._setFromProvider);
  useEffect(() => {
    _setFromProvider(socketState);
  }, [socketState, _setFromProvider]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}

// Custom hook to use socket context
// No-op unsubscribe function for safe defaults
const noopUnsubscribe = () => {};

// Safe defaults when provider hasn't loaded yet (deferred loading)
const SOCKET_DEFAULTS: SocketContextType = {
  socket: null,
  state: { connected: false, reconnecting: false, error: null, lastConnected: null, reconnectAttempts: 0 },
  connect: () => {},
  disconnect: () => {},
  onStockUpdate: () => noopUnsubscribe,
  onLowStock: () => noopUnsubscribe,
  onOutOfStock: () => noopUnsubscribe,
  onPriceUpdate: () => noopUnsubscribe,
  onProductAvailability: () => noopUnsubscribe,
  onProductCreated: () => noopUnsubscribe,
  onConnect: () => noopUnsubscribe,
  onDisconnect: () => noopUnsubscribe,
  onError: () => noopUnsubscribe,
  onFlashSaleStarted: () => noopUnsubscribe,
  onFlashSaleEndingSoon: () => noopUnsubscribe,
  onFlashSaleEnded: () => noopUnsubscribe,
  onFlashSaleStockUpdated: () => noopUnsubscribe,
  onFlashSaleStockLow: () => noopUnsubscribe,
  onFlashSaleSoldOut: () => noopUnsubscribe,
  subscribeToProduct: () => {},
  unsubscribeFromProduct: () => {},
  subscribeToStore: () => {},
  unsubscribeFromStore: () => {},
  subscribeToOrder: () => {},
  unsubscribeFromOrder: () => {},
  onOrderStatusUpdate: () => noopUnsubscribe,
  onOrderListUpdated: () => noopUnsubscribe,
  onCashbackCredited: () => noopUnsubscribe,
  onCashbackReversed: () => noopUnsubscribe,
  onStreakMilestone: () => noopUnsubscribe,
  onStreakBroken: () => noopUnsubscribe,
};

// Hook — falls back to Zustand store (connection state only) for crash safety when outside Provider
export function useSocket() {
  const context = useContext(SocketContext);
  const storeState = useSocketStore((s: SocketStoreState) => s.state);

  if (context !== undefined) {
    return context;
  }

  // Fallback: Zustand has connection state, but socket instance is unavailable
  // Return defaults with connection state from store
  return { ...SOCKET_DEFAULTS, state: storeState };
}

// Custom hook to subscribe to stock updates for a specific product
export function useStockUpdates(productId: string | null) {
  const { subscribeToProduct, unsubscribeFromProduct, onStockUpdate, onLowStock, onOutOfStock } = useSocket();
  const [stockData, setStockData] = useState<StockUpdatePayload | null>(null);
  const [isLowStock, setIsLowStock] = useState(false);
  const [isOutOfStock, setIsOutOfStock] = useState(false);

  useEffect(() => {
    if (!productId) return;

    // Subscribe to product
    subscribeToProduct(productId);

    // Listen for stock updates
    const unsubscribeStock = onStockUpdate((payload) => {
      if (payload.productId === productId) {
        setStockData(payload);
        // FL-20 fix: normalize status to uppercase before comparison.
        // socket.types.ts defines StockStatus as UPPERCASE ('IN_STOCK'|'LOW_STOCK'|'OUT_OF_STOCK'),
        // but the backend WebSocket payload may send lowercase values per standard enum conventions.
        // Normalizing here prevents silent mismatches if the backend ever changes casing.
        const normalizedStatus = ((payload.status as string) ?? '').toUpperCase();
        setIsOutOfStock(normalizedStatus === 'OUT_OF_STOCK');
        setIsLowStock(normalizedStatus === 'LOW_STOCK');
      }
    });

    const unsubscribeLow = onLowStock((payload) => {
      if (payload.productId === productId) {
        setIsLowStock(true);
      }
    });

    const unsubscribeOut = onOutOfStock((payload) => {
      if (payload.productId === productId) {
        setIsOutOfStock(true);
      }
    });

    // Cleanup
    return () => {
      unsubscribeFromProduct(productId);
      unsubscribeStock();
      unsubscribeLow();
      unsubscribeOut();
    };
  }, [productId]);

  return {
    stockData,
    isLowStock,
    isOutOfStock,
    isInStock: ((stockData?.status as string) ?? '').toUpperCase() === 'IN_STOCK',
  };
}

export { SocketContext };