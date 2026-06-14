/**
 * useOrdersDashboard — Extracted state and logic from orders.tsx
 *
 * Manages order fetching, filtering, sorting, status updates,
 * real-time events, and modal state for the merchant orders screen.
 */

import { logger } from '@/utils/logger';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Platform } from 'react-native';
import { showAlert } from '@/utils/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { ordersService } from '@/services';
import { useOrderRealTime } from '@/hooks/useRealTimeUpdates';
import type { Order, OrderStatus } from '@/types/api';

// ---------------------------------------------------------------------------
// Typed shape of a raw order object as received from the backend API.
// The mapper (mapApiOrder) converts this into an Order-compatible shape.
// ---------------------------------------------------------------------------
interface RawApiOrderItem {
  _id?: string;
  id?: string;
  product?: { _id?: string; images?: string[]; image?: string };
  productId?: string;
  name?: string;
  productName?: string;
  quantity?: number;
  price?: number;
  subtotal?: number;
  customizations?: string[];
  image?: string;
  discount?: number;
}

interface RawApiOrder {
  _id?: string;
  id?: string;
  orderNumber?: string;
  merchantId?: string;
  user?: {
    _id?: string;
    phoneNumber?: string;
    profile?: { firstName?: string; lastName?: string; email?: string };
  };
  items?: RawApiOrderItem[];
  status?: string;
  paymentStatus?: string;
  payment?: { method?: string; status?: string; transactionId?: string; coinsUsed?: unknown };
  totals?: {
    subtotal?: number;
    tax?: number;
    delivery?: number;
    discount?: number;
    cashback?: number;
    total?: number;
    paidAmount?: number;
    refundAmount?: number;
  };
  delivery?: {
    method?: string;
    address?: string | { addressLine1?: string; [key: string]: unknown };
    estimatedTime?: string;
    deliveryFee?: number;
    status?: string;
  };
  priority?: 'normal' | 'high' | 'urgent';
  createdAt?: string;
  updatedAt?: string;
  notes?: string;
  store?: Order['store'];
  timeline?: unknown[];
  rating?: unknown;
  analytics?: unknown;
}

// ---------------------------------------------------------------------------
// MappedOrder extends the canonical Order type with fields that mapApiOrder
// populates but that are not declared in the base Order interface.
// ---------------------------------------------------------------------------
interface MappedOrder extends Order {
  pricing: Order['pricing'] & {
    cashback: number;
    paidAmount: number;
    refundAmount: number;
  };
  delivery: NonNullable<Order['delivery']> & {
    address: string;
    fullAddress: RawApiOrder['delivery'] | null;
    deliveryFee: number;
    status: string;
  };
  payment: NonNullable<Order['payment']> & {
    coinsUsed: unknown | null;
  };
  timeline: unknown[];
  rating: unknown | null;
  analytics: unknown | null;
}

// 'pending' is a UI-only alias for the backend 'placed' status so the dashboard
// can surface a "Pending" tab (G-MA-C14).
export type StatusFilter = OrderStatus | 'all' | 'pending';
export type SortBy = 'created' | 'priority' | 'total';

// Unify 'completed' → 'delivered' to match the backend OrderStatus.
// The original used 'completed' which is not a valid backend status value, so status
// update calls would be rejected. Use 'delivered' consistently throughout.
// Canonical transitions — mirrors backend orderStateMachine.ts
const STATUS_TRANSITIONS: Record<string, string[]> = {
  placed: ['confirmed', 'cancelled', 'cancelling'],
  confirmed: ['preparing', 'cancelled', 'cancelling'],
  preparing: ['ready', 'cancelled', 'cancelling'],
  ready: ['dispatched', 'cancelled', 'cancelling'],
  dispatched: ['out_for_delivery', 'delivered', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: ['returned', 'refunded'],
  cancelling: ['cancelled'],
  cancelled: ['refunded'],
  returned: ['refunded'],
  refunded: [],
};

function mapApiOrder(order: RawApiOrder): MappedOrder {
  const deliveryAddr = order.delivery?.address;
  const deliveryAddressStr =
    typeof deliveryAddr === 'string'
      ? deliveryAddr
      : ((deliveryAddr as { addressLine1?: string } | undefined)?.addressLine1 ?? '');

  return {
    id: order._id || order.id || '',
    _id: order._id,
    orderNumber: order.orderNumber ?? '',
    merchantId: order.merchantId || '',
    customer: {
      id: order.user?._id || '',
      name: (() => {
        const firstName = order.user?.profile?.firstName;
        const lastName = order.user?.profile?.lastName;
        if (firstName && lastName) return `${firstName} ${lastName}`.trim();
        if (firstName) return firstName;
        if (lastName) return lastName;
        if (order.user?.phoneNumber) return order.user.phoneNumber;
        return 'Unknown Customer';
      })(),
      email: order.user?.profile?.email || '',
      phone: order.user?.phoneNumber || '',
    },
    items: (order.items || []).map((item) => ({
      id: item._id || item.id,
      productId: item.product?._id || item.productId || '',
      productName: item.name || item.productName || 'Unknown Product',
      quantity: item.quantity || 0,
      price: item.price || 0,
      total: item.subtotal || (item.price || 0) * (item.quantity || 0),
      customizations: item.customizations || [],
      image: item.image || item.product?.images?.[0] || item.product?.image || null,
      discount: item.discount || 0,
    })),
    status: (order.status as OrderStatus) || 'placed',
    paymentStatus: (order.payment?.status ||
      order.paymentStatus ||
      'pending') as Order['paymentStatus'],
    payment: {
      method: order.payment?.method || 'unknown',
      status: order.payment?.status || 'pending',
      transactionId: order.payment?.transactionId || '',
      coinsUsed: order.payment?.coinsUsed ?? null,
    },
    pricing: {
      subtotal: order.totals?.subtotal || 0,
      tax: order.totals?.tax || 0,
      taxAmount: order.totals?.tax || 0,
      delivery: order.totals?.delivery || order.delivery?.deliveryFee || 0,
      shippingAmount: order.totals?.delivery || 0,
      discount: order.totals?.discount || 0,
      discountAmount: order.totals?.discount || 0,
      cashback: order.totals?.cashback || 0,
      totalAmount: order.totals?.total || order.totals?.paidAmount || 0,
      paidAmount: order.totals?.paidAmount || order.totals?.total || 0,
      refundAmount: order.totals?.refundAmount || 0,
    },
    delivery: {
      method: order.delivery?.method || 'pickup',
      address: deliveryAddressStr,
      fullAddress: (order.delivery?.address ?? null) as unknown,
      estimatedTime: order.delivery?.estimatedTime || '',
      deliveryFee: order.delivery?.deliveryFee || 0,
      status: order.delivery?.status || 'pending',
    },
    priority: order.priority || 'normal',
    createdAt: order.createdAt || '',
    updatedAt: order.updatedAt || '',
    notes: order.notes || '',
    store: order.store,
    timeline: order.timeline || [],
    rating: order.rating ?? null,
    analytics: order.analytics ?? null,
  };
}

export function useOrdersDashboard() {
  const { state } = useAuth();
  const { stores, activeStore } = useStore();
  const realTime = useOrderRealTime();

  const [orders, setOrders] = useState<MappedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('created');
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>(activeStore?._id);

  // Status update modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusOrderId, setStatusOrderId] = useState<string | null>(null);
  const [statusOrderCurrent, setStatusOrderCurrent] = useState<string>('');
  const [processingStatus, setProcessingStatus] = useState(false);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: orders.length,
      pending: 0,
      placed: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      dispatched: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelling: 0,
      cancelled: 0,
      returned: 0,
      refunded: 0,
    };
    orders.forEach((order) => {
      if (order.status in counts) {
        counts[order.status]++;
      }
    });
    // G-MA-C14: The dashboard exposes a "pending" tab but the backend status
    // is "placed". Alias the two so the tab reflects the real pending count.
    counts.pending = counts.placed ?? 0;
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    // G-MA-C14: "pending" is a UI alias for the backend "placed" status.
    const filtered =
      activeFilter === 'all'
        ? orders
        : activeFilter === 'pending'
          ? orders.filter((order) => order.status === 'placed')
          : orders.filter((order) => order.status === activeFilter);

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority': {
          const priorityOrder: Record<string, number> = { urgent: 3, high: 2, normal: 1 };
          return (
            (priorityOrder[b.priority || 'normal'] || 0) -
            (priorityOrder[a.priority || 'normal'] || 0)
          );
        }
        case 'total':
          return (b.pricing?.totalAmount || 0) - (a.pricing?.totalAmount || 0);
        case 'created':
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });
  }, [orders, activeFilter, sortBy]);

  const fetchOrders = useCallback(async () => {
    try {
      setError(null);
      const apiSortByMap: Record<SortBy, string> = {
        created: 'createdAt',
        total: 'total',
        priority: 'status',
      };

      const params = {
        sortBy: (apiSortByMap[sortBy] || 'createdAt') as
          | 'createdAt'
          | 'total'
          | 'status'
          | 'orderNumber',
        limit: 50,
        page: 1,
        ...(selectedStoreId ? { storeId: selectedStoreId } : {}),
      };

      const result = await ordersService.getOrders(params);
      // result.orders are typed as Order[] from the service; cast to RawApiOrder[] since
      // the backend shape has additional fields that mapApiOrder extracts.
      // Defensively coerce to an array — `ordersService.getOrders` is meant
      // to guarantee this, but a regression there used to crash the page with
      // "Cannot read properties of undefined (reading 'map')". Belt-and-suspenders.
      const rawOrders = Array.isArray(result?.orders) ? (result.orders as RawApiOrder[]) : [];
      const mappedOrders = rawOrders.map(mapApiOrder);
      setOrders(mappedOrders);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch orders. Please try again.';
      setError(errorMessage);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`Error: ${errorMessage}`);
      } else {
        showAlert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedStoreId, sortBy]);

  const handleQuickAction = useCallback(
    async (orderId: string, action: string) => {
      const actionStatusMap: Record<string, OrderStatus> = {
        confirm: 'confirmed' as OrderStatus,
        prepare: 'preparing' as OrderStatus,
        ready: 'ready' as OrderStatus,
        cancel: 'cancelled' as OrderStatus,
      };
      const newStatus = actionStatusMap[action];
      if (!newStatus) return;

      try {
        await ordersService.updateOrderStatus(orderId, { status: newStatus, notifyCustomer: true });
        await fetchOrders();
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'Failed to update order status. Please try again.';
        showAlert('Error', msg);
      }
    },
    [fetchOrders]
  );

  const handleUpdateStatus = useCallback((orderId: string, currentStatus: string) => {
    setStatusOrderId(orderId);
    setStatusOrderCurrent(currentStatus);
    setShowStatusModal(true);
  }, []);

  const handleStatusSelect = useCallback(
    async (newStatus: string) => {
      if (!statusOrderId) return;
      try {
        setProcessingStatus(true);
        await ordersService.updateOrderStatus(statusOrderId, {
          status: newStatus as OrderStatus,
          notifyCustomer: true,
        });
        setShowStatusModal(false);
        await fetchOrders();
        showAlert('Success', `Order status updated to ${newStatus.replace(/_/g, ' ')}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update order status.';
        showAlert('Error', msg);
      } finally {
        setProcessingStatus(false);
        setStatusOrderId(null);
      }
    },
    [statusOrderId, fetchOrders]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // setLoading(true) was missing here; without it the loading spinner
    // never appears during pull-to-refresh and the UI shows stale data until the
    // fetch resolves (fetchOrders only sets loading=false in its finally block).
    setLoading(true);
    fetchOrders();
  }, [fetchOrders]);

  const clearNewOrders = useCallback(() => setNewOrdersCount(0), []);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle real-time order events
  useEffect(() => {
    if (realTime.orderEvents && realTime.orderEvents.length > 0) {
      const latestEvent = realTime.orderEvents[0];

      switch (latestEvent.type) {
        case 'order_created':
          if (latestEvent.data) {
            // latestEvent.data is typed as `any` in RealTimeEvent; cast to RawApiOrder
            const newOrder = mapApiOrder(latestEvent.data as RawApiOrder);
            setOrders((prev) => [newOrder, ...prev]);
            setNewOrdersCount((prev) => prev + 1);
            showAlert('New Order Received', `Order #${newOrder.orderNumber} has been placed.`, [
              { text: 'OK', onPress: () => setNewOrdersCount(0) },
            ]);
          }
          break;
        case 'order_updated':
          if (latestEvent.data) {
            const updatedOrder = mapApiOrder(latestEvent.data as RawApiOrder);
            setOrders((prev) =>
              prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
            );
          }
          break;
      }
    }
  }, [realTime.orderEvents]);

  return {
    // Data
    orders: filteredOrders,
    allOrders: orders,
    statusCounts,
    loading,
    refreshing,
    error,

    // Filters
    activeFilter,
    setActiveFilter,
    sortBy,
    setSortBy,
    selectedStoreId,
    setSelectedStoreId,

    // Real-time
    realTime,
    newOrdersCount,
    clearNewOrders,

    // Status modal
    showStatusModal,
    setShowStatusModal,
    statusOrderId,
    statusOrderCurrent,
    processingStatus,

    // Actions
    fetchOrders,
    onRefresh,
    handleQuickAction,
    handleUpdateStatus,
    handleStatusSelect,

    // Context data
    stores,
    activeStore,
    STATUS_TRANSITIONS,
  };
}
