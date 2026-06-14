import { useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '@/services/api/socket';
import { logger } from '@/utils/logger';
import { trackOrderReceived } from '@/services/intentCaptureService';

// Merchant order socket events
export const MerchantOrderSocketEvents = {
  MERCHANT_NEW_ORDER: 'merchant:new_order',
  ORDER_STATUS_UPDATED: 'order:status_updated',
  WEB_ORDER_NEW: 'web-order:new',
  WEB_ORDER_CANCELLED: 'web-order:cancelled',
  JOIN_STORE: 'join-store',
  LEAVE_STORE: 'leave-store',
} as const;

export interface MerchantNewOrderPayload {
  orderId: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  itemCount: number;
  paymentMethod: string;
  status: string;
  timestamp?: Date;
}

export interface OrderStatusUpdatePayload {
  orderId: string;
  orderNumber: string;
  status: string;
  previousStatus?: string;
  message: string;
  timestamp: Date;
  estimatedDeliveryTime?: Date;
  metadata?;
}

export interface MerchantOrdersState {
  newOrders: MerchantNewOrderPayload[];
  recentUpdates: OrderStatusUpdatePayload[];
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;
  lastNewOrderTime: Date | null;
  error: string | null;
}

const MAX_ORDERS_BUFFER = 100; // Limit to prevent memory leak

/**
 * Custom hook for merchant live order board with Socket.io
 * Uses the shared socketService singleton — no duplicate raw io() connections.
 * @param storeId - The store ID to listen for orders
 */
export function useMerchantOrders(storeId: string | null, merchantToken?: string) {
  const [ordersState, setOrdersState] = useState<MerchantOrdersState>({
    newOrders: [],
    recentUpdates: [],
    isConnected: false,
    isReconnecting: false,
    reconnectAttempts: 0,
    lastNewOrderTime: null,
    error: null,
  });

  const storeRoomRef = useRef<string>('');
  const listenersAttachedRef = useRef(false);

  // Connect using socketService and set up event listeners
  const setupListeners = useCallback(async () => {
    if (listenersAttachedRef.current) return;

    try {
      await socketService.connect();
      listenersAttachedRef.current = true;

      // Track connection state
      const onConnect = () => {
        logger.info('[Merchant Socket] Connected via socketService');
        setOrdersState((prev) => ({
          ...prev,
          isConnected: true,
          isReconnecting: false,
          reconnectAttempts: 0,
          error: null,
        }));

        // Join store room once connected
        if (storeId) {
          socketService.emit(MerchantOrderSocketEvents.JOIN_STORE, { storeId });
          storeRoomRef.current = storeId;
        }
      };

      const onDisconnect = () => {
        logger.info('[Merchant Socket] Disconnected');
        setOrdersState((prev) => ({
          ...prev,
          isConnected: false,
        }));
      };

      // New order event
      const handleNewOrder = (payload: MerchantNewOrderPayload) => {
        logger.info(`[Merchant Orders] New order received: ${payload.orderNumber}`);
        setOrdersState((prev) => {
          const newOrders = [payload, ...prev.newOrders];
          return {
            ...prev,
            newOrders: newOrders.slice(0, MAX_ORDERS_BUFFER),
            lastNewOrderTime: new Date(),
          };
        });

        // Track order received for ReZ Mind intent graph
        trackOrderReceived(storeId || payload.orderId, payload.orderId, payload.orderNumber);
      };

      // Order status update event
      const handleStatusUpdate = (payload: OrderStatusUpdatePayload) => {
        logger.info(`[Merchant Orders] Status update: ${payload.orderNumber} -> ${payload.status}`);
        setOrdersState((prev) => {
          const filtered = prev.recentUpdates.filter((u) => u.orderId !== payload.orderId);
          const recentUpdates = [payload, ...filtered].slice(0, 50);
          const newOrders = prev.newOrders.map((order) =>
            order.orderId === payload.orderId ? { ...order, status: payload.status } : order
          );
          return { ...prev, newOrders, recentUpdates };
        });
      };

      // Web QR new order event
      const handleWebOrderNew = (payload: {
        orderId: string;
        orderNumber: string;
        items: unknown[];
        total: number;
        tableNumber?: string;
        customerPhone: string;
        customerName?: string;
        channel: string;
      }) => {
        logger.info(`[Merchant Orders] New web QR order received: ${payload.orderNumber}`);
        const mapped: MerchantNewOrderPayload = {
          orderId: payload.orderId,
          orderNumber: payload.orderNumber,
          customerName: payload.customerName || payload.customerPhone,
          totalAmount: payload.total,
          itemCount: payload.items?.length ?? 0,
          paymentMethod: 'online',
          status: 'confirmed',
          timestamp: new Date(),
        };
        setOrdersState((prev) => {
          const newOrders = [mapped, ...prev.newOrders];
          return {
            ...prev,
            newOrders: newOrders.slice(0, MAX_ORDERS_BUFFER),
            lastNewOrderTime: new Date(),
          };
        });

        // Track order received for ReZ Mind intent graph (web QR order)
        trackOrderReceived(storeId || payload.orderId, payload.orderId, payload.orderNumber);
      };

      // Web QR order cancelled event
      const handleWebOrderCancelled = (payload: {
        orderId: string;
        orderNumber: string;
        reason?: string;
        cancelledAt?: string;
      }) => {
        logger.info(`[Merchant Orders] Web QR order cancelled: ${payload.orderNumber}`);
        setOrdersState((prev) => {
          const newOrders = prev.newOrders.filter((o) => o.orderId !== payload.orderId);
          const cancelUpdate: OrderStatusUpdatePayload = {
            orderId: payload.orderId,
            orderNumber: payload.orderNumber,
            status: 'cancelled',
            message: payload.reason || 'Order cancelled by customer',
            timestamp: new Date(payload.cancelledAt || Date.now()),
          };
          const filtered = prev.recentUpdates.filter((u) => u.orderId !== payload.orderId);
          const recentUpdates = [cancelUpdate, ...filtered].slice(0, 50);
          return { ...prev, newOrders, recentUpdates };
        });
      };

      socketService.on('connect', onConnect);
      socketService.on('disconnect', onDisconnect);
      socketService.on(MerchantOrderSocketEvents.MERCHANT_NEW_ORDER, handleNewOrder);
      socketService.on(MerchantOrderSocketEvents.ORDER_STATUS_UPDATED, handleStatusUpdate);
      socketService.on(MerchantOrderSocketEvents.WEB_ORDER_NEW, handleWebOrderNew);
      socketService.on(MerchantOrderSocketEvents.WEB_ORDER_CANCELLED, handleWebOrderCancelled);

      // Reflect current connection state immediately
      const alreadyConnected = socketService.isConnected();
      if (alreadyConnected) {
        setOrdersState((prev) => ({ ...prev, isConnected: true, error: null }));
        if (storeId) {
          socketService.emit(MerchantOrderSocketEvents.JOIN_STORE, { storeId });
          storeRoomRef.current = storeId;
        }
      }

      return () => {
        socketService.off('connect', onConnect);
        socketService.off('disconnect', onDisconnect);
        socketService.off(MerchantOrderSocketEvents.MERCHANT_NEW_ORDER, handleNewOrder);
        socketService.off(MerchantOrderSocketEvents.ORDER_STATUS_UPDATED, handleStatusUpdate);
        socketService.off(MerchantOrderSocketEvents.WEB_ORDER_NEW, handleWebOrderNew);
        socketService.off(MerchantOrderSocketEvents.WEB_ORDER_CANCELLED, handleWebOrderCancelled);
        listenersAttachedRef.current = false;
      };
    } catch (error) {
      logger.error('[Merchant Socket] Initialization failed:', error);
      listenersAttachedRef.current = false;
      setOrdersState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to connect',
      }));
    }
  }, [storeId]);

  // Initialize on mount
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    setupListeners().then((fn) => {
      cleanup = fn;
    });

    return () => {
      if (cleanup) cleanup();
      // Leave the store room on unmount
      if (storeRoomRef.current) {
        socketService.emit(MerchantOrderSocketEvents.LEAVE_STORE, {
          storeId: storeRoomRef.current,
        });
        storeRoomRef.current = '';
      }
    };
  }, [setupListeners]);

  // Join new store room when storeId changes (after socket is connected)
  useEffect(() => {
    if (!storeId || !socketService.isConnected()) return;

    // Leave old room if different
    if (storeRoomRef.current && storeRoomRef.current !== storeId) {
      socketService.emit(MerchantOrderSocketEvents.LEAVE_STORE, { storeId: storeRoomRef.current });
    }

    socketService.emit(MerchantOrderSocketEvents.JOIN_STORE, { storeId });
    storeRoomRef.current = storeId;
    logger.info(`[Merchant Orders] Joined store room: ${storeId}`);
  }, [storeId]);

  // Clear new orders from display
  const clearNewOrders = useCallback(() => {
    setOrdersState((prev) => ({ ...prev, newOrders: [] }));
  }, []);

  // Mark order as acknowledged (removes from new orders)
  const acknowledgeOrder = useCallback((orderId: string) => {
    setOrdersState((prev) => ({
      ...prev,
      newOrders: prev.newOrders.filter((order) => order.orderId !== orderId),
    }));
  }, []);

  // Get connection status indicator
  const getConnectionStatus = useCallback(() => {
    if (ordersState.isConnected) return 'live';
    if (ordersState.isReconnecting) return 'reconnecting';
    return 'offline';
  }, [ordersState.isConnected, ordersState.isReconnecting]);

  return {
    ...ordersState,
    clearNewOrders,
    acknowledgeOrder,
    getConnectionStatus,
  };
}

/**
 * Hook to detect new order sound/notification trigger
 * @param newOrders - From useMerchantOrders hook
 */
export function useMerchantOrderNotification(newOrders: MerchantNewOrderPayload[]) {
  const lastOrderCountRef = useRef(0);

  useEffect(() => {
    if (newOrders.length > lastOrderCountRef.current) {
      const newOrdersCount = newOrders.length - lastOrderCountRef.current;
      logger.info(`[Merchant] ${newOrdersCount} new order(s) detected`);
      // Trigger notification/sound here
    }
    lastOrderCountRef.current = newOrders.length;
  }, [newOrders.length]);
}
