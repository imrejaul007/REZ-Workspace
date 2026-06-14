// @ts-nocheck
/**
 * useSocketEvent Hook
 * Socket event subscription utilities
 * Split from SocketContext.tsx for better modularity
 */

import { useCallback, useRef } from 'react';
import { SocketEvents } from '@/types/socket.types';
import {
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

type Socket = unknown;

interface UseSocketEventReturn {
  onStockUpdate: (callback: StockUpdateCallback) => () => void;
  onLowStock: (callback: LowStockCallback) => () => void;
  onOutOfStock: (callback: OutOfStockCallback) => () => void;
  onPriceUpdate: (callback: PriceUpdateCallback) => () => void;
  onProductAvailability: (callback: ProductAvailabilityCallback) => () => void;
  onProductCreated: (callback: (payload: unknown) => void) => () => void;
  onConnect: (callback: ConnectionCallback) => () => void;
  onDisconnect: (callback: ConnectionCallback) => () => void;
  onError: (callback: ErrorCallback) => () => void;
  onFlashSaleStarted: (callback: FlashSaleStartedCallback) => () => void;
  onFlashSaleEndingSoon: (callback: FlashSaleEndingSoonCallback) => () => void;
  onFlashSaleEnded: (callback: FlashSaleEndedCallback) => () => void;
  onFlashSaleStockUpdated: (callback: FlashSaleStockUpdatedCallback) => () => void;
  onFlashSaleStockLow: (callback: FlashSaleStockLowCallback) => () => void;
  onFlashSaleSoldOut: (callback: FlashSaleSoldOutCallback) => () => void;
  subscribeToProduct: (productId: string) => void;
  unsubscribeFromProduct: (productId: string) => void;
  subscribeToStore: (storeId: string) => void;
  unsubscribeFromStore: (storeId: string) => void;
  subscribeToOrder: (orderId: string, userId?: string) => void;
  unsubscribeFromOrder: (orderId: string) => void;
  onOrderStatusUpdate: (callback: OrderStatusUpdateCallback) => () => void;
  onOrderListUpdated: (callback: OrderListUpdatedCallback) => () => void;
  onCashbackCredited: (callback: CashbackCreditedCallback) => () => void;
  onCashbackReversed: (callback: CashbackReversedCallback) => () => void;
  onStreakMilestone: (callback: StreakMilestoneCallback) => () => void;
  onStreakBroken: (callback: StreakBrokenCallback) => () => void;
}

/**
 * Hook for socket event subscriptions
 * Requires socketRef to be passed in from parent context/provider
 */
export function useSocketEvent(socketRef: { current: Socket | null }): UseSocketEventReturn {
  // Event subscription helpers
  const createEventSubscription = useCallback(<T>(
    event: string,
    callback: (data: T) => void
  ) => {
    return () => {
      if (!socketRef.current) return;
      socketRef.current.off(event, callback as unknown as () => void);
    };
  }, []);

  const onStockUpdate = useCallback((callback: StockUpdateCallback) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on(SocketEvents.STOCK_UPDATED, callback);
    return () => { socketRef.current?.off(SocketEvents.STOCK_UPDATED, callback); };
  }, []);

  const onLowStock = useCallback((callback: LowStockCallback) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on(SocketEvents.STOCK_LOW, callback);
    return () => { socketRef.current?.off(SocketEvents.STOCK_LOW, callback); };
  }, []);

  const onOutOfStock = useCallback((callback: OutOfStockCallback) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on(SocketEvents.STOCK_OUT, callback);
    return () => { socketRef.current?.off(SocketEvents.STOCK_OUT, callback); };
  }, []);

  const onPriceUpdate = useCallback((callback: PriceUpdateCallback) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on(SocketEvents.PRICE_UPDATED, callback);
    return () => { socketRef.current?.off(SocketEvents.PRICE_UPDATED, callback); };
  }, []);

  const onProductAvailability = useCallback((callback: ProductAvailabilityCallback) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on(SocketEvents.PRODUCT_AVAILABILITY, callback);
    return () => { socketRef.current?.off(SocketEvents.PRODUCT_AVAILABILITY, callback); };
  }, []);

  const onProductCreated = useCallback((callback: (payload: unknown) => void) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on('product_created', callback);
    return () => { socketRef.current?.off('product_created', callback); };
  }, []);

  const onConnect = useCallback((callback: ConnectionCallback) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on(SocketEvents.CONNECT, callback);
    return () => { socketRef.current?.off(SocketEvents.CONNECT, callback); };
  }, []);

  const onDisconnect = useCallback((callback: ConnectionCallback) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on(SocketEvents.DISCONNECT, callback);
    return () => { socketRef.current?.off(SocketEvents.DISCONNECT, callback); };
  }, []);

  const onError = useCallback((callback: ErrorCallback) => {
    if (!socketRef.current) return () => {};
    const errorHandler = (error: unknown) => {
      callback(error instanceof Error ? error : new Error(String(error)));
    };
    socketRef.current.on(SocketEvents.CONNECT_ERROR, errorHandler);
    return () => { socketRef.current?.off(SocketEvents.CONNECT_ERROR, errorHandler); };
  }, []);

  const onFlashSaleStarted = useCallback((callback: FlashSaleStartedCallback) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on(SocketEvents.FLASH_SALE_STARTED, callback);
    return () => { socketRef.current?.off(SocketEvents.FLASH_SALE_STARTED, callback); };
  }, []);

  const onFlashSaleEndingSoon = useCallback((callback: FlashSaleEndingSoonCallback) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on(SocketEvents.FLASH_SALE_ENDING_SOON, callback);
    return () => { socketRef.current?.off(SocketEvents.FLASH_SALE_ENDING_SOON, callback); };
  }, []);

  const onFlashSaleEnded = useCallback((callback: FlashSaleEndedCallback) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on(SocketEvents.FLASH_SALE_ENDED, callback);
    return () => { socketRef.current?.off(SocketEvents.FLASH_SALE_ENDED, callback); };
  }, []);

  const onFlashSaleStockUpdated = useCallback((callback: FlashSaleStockUpdatedCallback) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on(SocketEvents.FLASH_SALE_STOCK_UPDATED, callback);
    return () => { socketRef.current?.off(SocketEvents.FLASH_SALE_STOCK_UPDATED, callback); };
  }, []);

  const onFlashSaleStockLow = useCallback((callback: FlashSaleStockLowCallback) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on(SocketEvents.FLASH_SALE_STOCK_LOW, callback);
    return () => { socketRef.current?.off(SocketEvents.FLASH_SALE_STOCK_LOW, callback); };
  }, []);

  const onFlashSaleSoldOut = useCallback((callback: FlashSaleSoldOutCallback) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on(SocketEvents.FLASH_SALE_SOLD_OUT, callback);
    return () => { socketRef.current?.off(SocketEvents.FLASH_SALE_SOLD_OUT, callback); };
  }, []);

  const subscribeToProduct = useCallback((productId: string) => {
    if (!socketRef.current || !socketRef.current.connected) return;
    socketRef.current.emit(SocketEvents.SUBSCRIBE_PRODUCT, { productId });
  }, []);

  const unsubscribeFromProduct = useCallback((productId: string) => {
    if (!socketRef.current || !socketRef.current.connected) return;
    socketRef.current.emit(SocketEvents.UNSUBSCRIBE_PRODUCT, { productId });
  }, []);

  const subscribeToStore = useCallback((storeId: string) => {
    if (!socketRef.current || !socketRef.current.connected) return;
    socketRef.current.emit(SocketEvents.SUBSCRIBE_STORE, { storeId });
  }, []);

  const unsubscribeFromStore = useCallback((storeId: string) => {
    if (!socketRef.current || !socketRef.current.connected) return;
    socketRef.current.emit(SocketEvents.UNSUBSCRIBE_STORE, { storeId });
  }, []);

  const subscribeToOrder = useCallback((orderId: string, userId?: string) => {
    if (!socketRef.current || !socketRef.current.connected) return;
    socketRef.current.emit(SocketEvents.SUBSCRIBE_ORDER, { orderId, userId });
  }, []);

  const unsubscribeFromOrder = useCallback((orderId: string) => {
    if (!socketRef.current || !socketRef.current.connected) return;
    socketRef.current.emit(SocketEvents.UNSUBSCRIBE_ORDER, { orderId });
  }, []);

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
      'order:refunded',
    ];
    events.forEach(ev => socketRef.current?.on(ev, callback));
    return () => { events.forEach(ev => socketRef.current?.off(ev, callback)); };
  }, []);

  const onOrderListUpdated = useCallback((callback: OrderListUpdatedCallback) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on(SocketEvents.ORDER_LIST_UPDATED, callback);
    return () => { socketRef.current?.off(SocketEvents.ORDER_LIST_UPDATED, callback); };
  }, []);

  const onCashbackCredited = useCallback((callback: CashbackCreditedCallback) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on(SocketEvents.CASHBACK_CREDITED, callback);
    return () => { socketRef.current?.off(SocketEvents.CASHBACK_CREDITED, callback); };
  }, []);

  const onCashbackReversed = useCallback((callback: CashbackReversedCallback) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on(SocketEvents.CASHBACK_REVERSED, callback);
    return () => { socketRef.current?.off(SocketEvents.CASHBACK_REVERSED, callback); };
  }, []);

  const onStreakMilestone = useCallback((callback: StreakMilestoneCallback) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on(SocketEvents.STREAK_MILESTONE, callback);
    return () => { socketRef.current?.off(SocketEvents.STREAK_MILESTONE, callback); };
  }, []);

  const onStreakBroken = useCallback((callback: StreakBrokenCallback) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on(SocketEvents.STREAK_BROKEN, callback);
    return () => { socketRef.current?.off(SocketEvents.STREAK_BROKEN, callback); };
  }, []);

  return {
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
  };
}
