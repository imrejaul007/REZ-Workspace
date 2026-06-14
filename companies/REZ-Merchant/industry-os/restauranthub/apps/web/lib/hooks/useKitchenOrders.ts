import logger from './utils/logger';

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * Kitchen Order Item Status Interface
 */
interface KitchenOrderItem {
  id: string;
  name: string;
  quantity: number;
  modifications?: string[];
  cookingTime: number;
  station: string;
  status: 'pending' | 'preparing' | 'ready';
  allergens?: string[];
  price: number;
}

/**
 * Kitchen Order Interface
 */
interface KitchenOrder {
  id: string;
  orderNumber: string;
  tableNumber?: string;
  customerName?: string;
  orderType: 'dine-in' | 'takeout' | 'delivery';
  status: 'new' | 'preparing' | 'ready' | 'served' | 'delayed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  items: KitchenOrderItem[];
  totalItems: number;
  estimatedTime: number;
  elapsedTime: number;
  orderTime: string;
  specialInstructions?: string;
  allergens?: string[];
  station: string;
  createdAt: Date;
  storeId: string;
}

/**
 * useKitchenOrders Hook
 *
 * Manages real-time kitchen orders using Socket.IO connection to REZ Backend.
 * Handles:
 * - Real-time order arrival notifications
 * - Order status synchronization
 * - Item status updates with backend persistence
 * - Allergen tracking
 * - SLA monitoring
 *
 * @param merchantId - Merchant/store ID for filtering orders
 * @param storeId - Store ID for Socket.IO room joining
 * @returns Object with orders, update functions, loading state, and error state
 */
export const useKitchenOrders = (merchantId?: string, storeId?: string) => {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  /**
   * Initialize Socket.IO connection to KDS namespace
   */
  useEffect(() => {
    if (!merchantId || !storeId) {
      setError('merchantId and storeId are required');
      return;
    }

    // Get authentication token (from localStorage or context)
    const token = typeof window !== 'undefined' ? localStorage.getItem('restauranthub_token') : null;

    if (!token) {
      setError('Authentication token not found');
      return;
    }

    // Create Socket.IO connection to KDS namespace
    const socket = io(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/kds`, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    /**
     * Handle successful connection
     */
    socket.on('connect', () => {
      logger.info('[KDS] Connected to kitchen display system');
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;

      // Join the store's KDS room
      socket.emit('join-store', { storeId }, (response) => {
        console.log('[KDS] Joined store room:', storeId, response);
      });

      // Load initial orders from server
      socket.emit('get-current-orders', { storeId }, (response) => {
        if (response?.orders) {
          setOrders(response.orders);
        }
        setIsLoading(false);
      });
    });

    /**
     * Handle connection error
     */
    socket.on('connect_error', (error) => {
      console.error('[KDS] Connection error:', error);
      setError(`Connection failed: ${error.message}`);
      reconnectAttemptsRef.current += 1;

      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        setError('Lost connection to kitchen display system. Please refresh the page.');
      }
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', (reason) => {
      console.log('[KDS] Disconnected:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Server forcibly disconnected, reconnect
        socket.connect();
      }
    });

    /**
     * Receive new order notifications
     */
    socket.on('merchant:new_order', (data) => {
      console.log('[KDS] New order received:', data);
      const newOrder: KitchenOrder = {
        id: data.orderId,
        orderNumber: data.orderNumber,
        customerName: data.customerName,
        orderType: data.orderType || 'delivery',
        status: 'new',
        priority: determinePriority(data),
        items: (data.items || []).map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          modifications: item.modifications,
          cookingTime: item.cookingTime || 15,
          station: item.station || 'main',
          status: 'pending' as const,
          allergens: item.allergens,
          price: item.price,
        })),
        totalItems: data.items?.length || 0,
        estimatedTime: calculateEstimatedTime(data.items),
        elapsedTime: 0,
        orderTime: new Date().toLocaleTimeString(),
        specialInstructions: data.specialInstructions,
        allergens: data.allergens,
        station: 'mixed',
        createdAt: new Date(),
        storeId: data.storeId,
      };

      setOrders((prev) => [newOrder, ...prev]);
    });

    /**
     * Receive order status update notifications
     */
    socket.on('order:status_updated', (data) => {
      console.log('[KDS] Order status updated:', data);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === data.orderId
            ? { ...order, status: data.status as unknown }
            : order
        )
      );
    });

    /**
     * Receive item status update notifications
     */
    socket.on('order:item_status_updated', (data) => {
      console.log('[KDS] Item status updated:', data);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === data.orderId
            ? {
                ...order,
                items: order.items.map((item) =>
                  item.id === data.itemId
                    ? { ...item, status: data.status as unknown }
                    : item
                ),
              }
            : order
        )
      );
    });

    /**
     * Acknowledge that item status was successfully updated
     */
    socket.on('item-status-updated:ack', (data) => {
      console.log('[KDS] Item status update acknowledged:', data);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [merchantId, storeId]);

  /**
   * Update item status and persist to backend
   */
  const updateItemStatus = useCallback(
    async (orderId: string, itemId: string, newStatus: 'pending' | 'preparing' | 'ready') => {
      if (!socketRef.current?.connected) {
        setError('Not connected to server');
        return;
      }

      try {
        // Update local state optimistically
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  items: order.items.map((item) =>
                    item.id === itemId
                      ? { ...item, status: newStatus }
                      : item
                  ),
                }
              : order
          )
        );

        // Call backend API to persist status change
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/orders/${orderId}/status`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('restauranthub_token')}`,
            },
            body: JSON.stringify({ status: newStatus }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to update item status: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('[KDS] Item status updated:', result);

        // Emit Socket.IO event to notify other kitchen displays
        socketRef.current?.emit('item-status-changed', {
          orderId,
          itemId,
          status: newStatus,
          storeId,
        });
      } catch (err) {
        console.error('[KDS] Error updating item status:', err);
        setError(err instanceof Error ? err.message : 'Error updating item status');

        // Revert local state on error
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  items: order.items.map((item) =>
                    item.id === itemId
                      ? {
                          ...item,
                          status: order.items.find((i) => i.id === itemId)?.status,
                        }
                      : item
                  ),
                }
              : order
          )
        );
      }
    },
    [storeId]
  );

  /**
   * Update entire order status
   */
  const updateOrderStatus = useCallback(
    async (orderId: string, newStatus: 'new' | 'preparing' | 'ready' | 'served' | 'delayed') => {
      if (!socketRef.current?.connected) {
        setError('Not connected to server');
        return;
      }

      try {
        // Update local state optimistically
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? { ...order, status: newStatus }
              : order
          )
        );

        // Call backend API to persist status change
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/orders/${orderId}/status`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('restauranthub_token')}`,
            },
            body: JSON.stringify({ status: newStatus }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to update order status: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('[KDS] Order status updated:', result);

        // Emit Socket.IO event to notify other kitchen displays
        socketRef.current?.emit('order-status-changed', {
          orderId,
          status: newStatus,
          storeId,
        });
      } catch (err) {
        console.error('[KDS] Error updating order status:', err);
        setError(err instanceof Error ? err.message : 'Error updating order status');

        // Revert local state on error
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? { ...order, status: order.status }
              : order
          )
        );
      }
    },
    [storeId]
  );

  /**
   * Determine order priority based on various factors
   */
  const determinePriority = (orderData): 'low' | 'normal' | 'high' | 'urgent' => {
    if (orderData.priority === 'urgent' || orderData.isExpress) return 'urgent';
    if (orderData.priority === 'high' || orderData.isRush) return 'high';
    if (orderData.orderType === 'delivery') return 'normal';
    return 'low';
  };

  /**
   * Calculate estimated time based on items
   */
  const calculateEstimatedTime = (items: unknown[]): number => {
    if (!items || items.length === 0) return 15;
    const maxCookingTime = Math.max(...items.map((i) => i.cookingTime || 15));
    return Math.ceil(maxCookingTime * 1.2); // Add 20% buffer
  };

  return {
    orders,
    updateItemStatus,
    updateOrderStatus,
    isLoading,
    error,
    isConnected,
  };
};
