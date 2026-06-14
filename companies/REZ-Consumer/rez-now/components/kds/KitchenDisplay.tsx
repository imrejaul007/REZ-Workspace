'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { KDSOrder, KDSItem, KDSOrderStatus, KDSItemStatus, KDSEvent } from '@/lib/types';
import { formatINR } from '@/lib/utils/currency';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://api.rezapp.com';

// Sound notification for new orders
const NOTIFICATION_SOUND_URL = '/sounds/new-order.mp3';

interface KitchenDisplayProps {
  storeId: string;
  storeSlug: string;
  /** Filter by specific status */
  initialFilter?: KDSOrderStatus | 'all';
  /** Auto-refresh interval in ms (0 to disable) */
  refreshInterval?: number;
  /** Enable sound notifications */
  soundEnabled?: boolean;
  /** Callback when order is clicked */
  onOrderClick?: (order: KDSOrder) => void;
}

interface KitchenDisplayState {
  orders: KDSOrder[];
  isLoading: boolean;
  error: string | null;
  filter: KDSOrderStatus | 'all';
  soundEnabled: boolean;
  isConnected: boolean;
  lastUpdate: Date | null;
}

/**
 * KitchenDisplay - Real-time kitchen order display system
 *
 * Features:
 * - Real-time order queue via Socket.IO
 * - Item status updates (received -> preparing -> ready -> served)
 * - Timer tracking (time since order received)
 * - Color coding based on urgency (normal, warning, urgent)
 * - Sound notification on new order
 * - Mark item/cart as done
 * - Full-screen optimized layout
 */
export default function KitchenDisplay({
  storeId,
  storeSlug,
  initialFilter = 'all',
  refreshInterval = 0,
  soundEnabled: initialSoundEnabled = true,
  onOrderClick,
}: KitchenDisplayProps) {
  const [state, setState] = useState<KitchenDisplayState>({
    orders: [],
    isLoading: true,
    error: null,
    filter: initialFilter,
    soundEnabled: initialSoundEnabled,
    isConnected: false,
    lastUpdate: null,
  });

  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (state.soundEnabled && notificationSoundRef.current) {
      notificationSoundRef.current.currentTime = 0;
      notificationSoundRef.current.play().catch(() => {
        // Ignore autoplay restrictions
      });
    }
  }, [state.soundEnabled]);

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    try {
      const url = `/api/kds/${storeId}/orders${state.filter !== 'all' ? `?status=${state.filter}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setState((prev) => ({
        ...prev,
        orders: data.orders || [],
        isLoading: false,
        error: null,
        lastUpdate: new Date(),
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load orders',
      }));
    }
  }, [storeId, state.filter]);

  // Connect to Socket.IO for real-time updates
  useEffect(() => {
    const socket = io(`${SOCKET_URL}/kds`, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setState((prev) => ({ ...prev, isConnected: true }));
      socket.emit('kds:join', { storeId, storeSlug });
    });

    socket.on('disconnect', () => {
      setState((prev) => ({ ...prev, isConnected: false }));
    });

    // Handle new order
    socket.on('order.created', (event: KDSEvent) => {
      const newOrder = event.payload as KDSOrder;
      setState((prev) => ({
        ...prev,
        orders: [newOrder, ...prev.orders],
        lastUpdate: new Date(),
      }));
      playNotificationSound();
    });

    // Handle order status update
    socket.on('order.updated', (event: KDSEvent) => {
      const update = event.payload as { orderId: string; status: KDSOrderStatus };
      setState((prev) => ({
        ...prev,
        orders: prev.orders.map((order) =>
          order.orderId === update.orderId
            ? { ...order, status: update.status, updatedAt: event.timestamp }
            : order
        ),
        lastUpdate: new Date(),
      }));
    });

    // Handle item status update
    socket.on('item.updated', (event: KDSEvent) => {
      const update = event.payload as { orderId: string; itemId: string; status: KDSItemStatus };
      setState((prev) => ({
        ...prev,
        orders: prev.orders.map((order) =>
          order.orderId === update.orderId
            ? {
                ...order,
                items: order.items.map((item) =>
                  item.id === update.itemId ? { ...item, status: update.status } : item
                ),
              }
            : order
        ),
        lastUpdate: new Date(),
      }));
    });

    // Handle order ready
    socket.on('order.ready', (event: KDSEvent) => {
      const readyOrder = event.payload as KDSOrder;
      setState((prev) => ({
        ...prev,
        orders: prev.orders.map((order) =>
          order.orderId === readyOrder.orderId ? readyOrder : order
        ),
        lastUpdate: new Date(),
      }));
      playNotificationSound();
    });

    // Handle order cancelled
    socket.on('order.cancelled', (event: KDSEvent) => {
      const cancelled = event.payload as { orderId: string };
      setState((prev) => ({
        ...prev,
        orders: prev.orders.filter((order) => order.orderId !== cancelled.orderId),
        lastUpdate: new Date(),
      }));
    });

    return () => {
      socket.emit('kds:leave', { storeId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [storeId, storeSlug, playNotificationSound]);

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(fetchOrders, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, fetchOrders]);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Initialize audio
  useEffect(() => {
    notificationSoundRef.current = new Audio(NOTIFICATION_SOUND_URL);
    return () => {
      notificationSoundRef.current = null;
    };
  }, []);

  // Update item status
  const updateItemStatus = useCallback(
    async (orderId: string, itemId: string, newStatus: KDSItemStatus) => {
      try {
        await fetch(`/api/kds/${orderId}/items/${itemId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
      } catch {
        logger.error('Failed to update item status');
      }
    },
    []
  );

  // Update order status
  const updateOrderStatus = useCallback(async (orderId: string, newStatus: KDSOrderStatus) => {
    try {
      await fetch(`/api/kds/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      logger.error('Failed to update order status');
    }
  }, []);

  // Get urgency level based on elapsed time
  const getUrgencyLevel = useCallback((elapsedSeconds: number, status: KDSOrderStatus): 'normal' | 'warning' | 'urgent' => {
    if (status === 'ready' || status === 'served') return 'normal';
    if (elapsedSeconds < 300) return 'normal'; // < 5 min
    if (elapsedSeconds < 600) return 'warning'; // < 10 min
    return 'urgent'; // >= 10 min
  }, []);

  // Format elapsed time
  const formatElapsedTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Filter orders
  const filteredOrders = state.filter === 'all'
    ? state.orders
    : state.orders.filter((order) => order.status === state.filter);

  // Count by status
  const statusCounts = {
    pending: state.orders.filter((o) => o.status === 'pending').length,
    preparing: state.orders.filter((o) => o.status === 'preparing').length,
    ready: state.orders.filter((o) => o.status === 'ready').length,
    served: state.orders.filter((o) => o.status === 'served').length,
  };

  // Sound toggle
  const toggleSound = useCallback(() => {
    setState((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading kitchen display...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hidden audio for notifications */}
      <audio ref={audioRef} />

      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Kitchen Display</h1>
            <div className={cn(
              'flex items-center gap-2 px-3 py-1 rounded-full text-sm',
              state.isConnected ? 'bg-green-600' : 'bg-red-600'
            )}>
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              {state.isConnected ? 'Live' : 'Disconnected'}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Status counts */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-yellow-600 rounded-full text-sm">
                Pending: {statusCounts.pending}
              </span>
              <span className="px-3 py-1 bg-blue-600 rounded-full text-sm">
                Preparing: {statusCounts.preparing}
              </span>
              <span className="px-3 py-1 bg-green-600 rounded-full text-sm">
                Ready: {statusCounts.ready}
              </span>
            </div>

            {/* Sound toggle */}
            <button
              onClick={toggleSound}
              className={cn(
                'p-2 rounded-lg transition-colors',
                state.soundEnabled ? 'bg-gray-700 text-white' : 'bg-gray-700 text-gray-500'
              )}
              aria-label={state.soundEnabled ? 'Mute notifications' : 'Enable notifications'}
            >
              {state.soundEnabled ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
            </button>

            {/* Refresh */}
            <button
              onClick={fetchOrders}
              className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              aria-label="Refresh orders"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* Last update */}
            {state.lastUpdate && (
              <span className="text-sm text-gray-400">
                Updated: {state.lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-4">
          {(['all', 'pending', 'preparing', 'ready'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setState((prev) => ({ ...prev, filter: status }))}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors capitalize',
                state.filter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </header>

      {/* Error */}
      {state.error && (
        <div className="bg-red-600 text-white px-6 py-3">
          {state.error}
        </div>
      )}

      {/* Orders grid */}
      <main className="p-6">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-24 h-24 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-400 text-xl">No orders to display</p>
            <p className="text-gray-500 mt-2">New orders will appear here automatically</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onItemStatusChange={(itemId, status) => updateItemStatus(order.orderId, itemId, status)}
                onOrderStatusChange={(status) => updateOrderStatus(order.orderId, status)}
                getUrgencyLevel={getUrgencyLevel}
                formatElapsedTime={formatElapsedTime}
                onClick={() => onOrderClick?.(order)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Order Card Component
interface OrderCardProps {
  order: KDSOrder;
  onItemStatusChange: (itemId: string, status: KDSItemStatus) => void;
  onOrderStatusChange: (status: KDSOrderStatus) => void;
  getUrgencyLevel: (elapsedSeconds: number, status: KDSOrderStatus) => 'normal' | 'warning' | 'urgent';
  formatElapsedTime: (seconds: number) => string;
  onClick?: () => void;
}

function OrderCard({
  order,
  onItemStatusChange,
  onOrderStatusChange,
  getUrgencyLevel,
  formatElapsedTime,
  onClick,
}: OrderCardProps) {
  const urgency = getUrgencyLevel(order.elapsedSeconds, order.status);

  const urgencyStyles = {
    normal: 'border-gray-700 bg-gray-800',
    warning: 'border-yellow-600 bg-gray-800',
    urgent: 'border-red-600 bg-red-900/30',
  };

  const statusStyles: Record<KDSOrderStatus, string> = {
    pending: 'bg-yellow-600',
    preparing: 'bg-blue-600',
    ready: 'bg-green-600',
    served: 'bg-gray-600',
    cancelled: 'bg-red-600',
  };

  const itemStatusStyles: Record<KDSItemStatus, { bg: string; label: string }> = {
    received: { bg: 'bg-yellow-600', label: 'New' },
    preparing: { bg: 'bg-blue-600', label: 'Prep' },
    ready: { bg: 'bg-green-600', label: 'Ready' },
    served: { bg: 'bg-gray-600', label: 'Served' },
  };

  return (
    <div
      className={cn(
        'rounded-xl border-2 overflow-hidden transition-all hover:shadow-lg cursor-pointer',
        urgencyStyles[urgency]
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className={cn('px-4 py-3 flex items-center justify-between', statusStyles[order.status])}>
        <div>
          <span className="font-bold text-lg">#{order.orderNumber}</span>
          {order.tableNumber && (
            <span className="ml-3 text-sm opacity-90">Table {order.tableNumber}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {order.priority === 'rush' && (
            <span className="px-2 py-1 bg-red-500 text-xs font-bold rounded animate-pulse">
              RUSH
            </span>
          )}
          {order.priority === 'vip' && (
            <span className="px-2 py-1 bg-purple-500 text-xs font-bold rounded">
              VIP
            </span>
          )}
          <span className="text-sm font-medium capitalize">{order.status}</span>
        </div>
      </div>

      {/* Timer */}
      <div className={cn(
        'px-4 py-2 text-center font-mono text-2xl font-bold',
        urgency === 'urgent' ? 'bg-red-600' : urgency === 'warning' ? 'bg-yellow-600' : 'bg-gray-700'
      )}>
        {formatElapsedTime(order.elapsedSeconds)}
      </div>

      {/* Items */}
      <div className="p-4 space-y-3">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">{item.quantity}x</span>
                <span className="font-medium">{item.name}</span>
              </div>
              {item.customizations && Object.keys(item.customizations).length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {Object.entries(item.customizations)
                    .map(([key, values]) => `${key}: ${values.join(', ')}`)
                    .join(' | ')}
                </p>
              )}
              {item.notes && (
                <p className="text-xs text-yellow-400 mt-1">Note: {item.notes}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={cn(
                'px-2 py-1 rounded text-xs font-medium text-white',
                itemStatusStyles[item.status].bg
              )}>
                {itemStatusStyles[item.status].label}
              </span>
              {order.status === 'pending' || order.status === 'preparing' ? (
                <select
                  value={item.status}
                  onChange={(e) => {
                    e.stopPropagation();
                    onItemStatusChange(item.id, e.target.value as KDSItemStatus);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs bg-gray-700 text-white rounded px-2 py-1 border border-gray-600"
                >
                  <option value="received">Received</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="served">Served</option>
                </select>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      {order.status !== 'served' && order.status !== 'cancelled' && (
        <div className="px-4 pb-4 flex gap-2">
          {order.status === 'pending' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOrderStatusChange('preparing');
              }}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Start Preparing
            </button>
          )}
          {order.status === 'preparing' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOrderStatusChange('ready');
              }}
              className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
            >
              Mark Ready
            </button>
          )}
          {order.status === 'ready' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOrderStatusChange('served');
              }}
              className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors"
            >
              Mark Served
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-700/50 flex items-center justify-between text-xs text-gray-400">
        <span>{order.customerName || 'Guest'}</span>
        <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
