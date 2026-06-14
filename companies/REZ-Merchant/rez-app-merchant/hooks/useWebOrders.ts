/**
 * useWebOrders — Hook for fetching and managing Web QR orders.
 *
 * Web orders come from the WebOrder model (customers who scanned a table QR
 * and ordered through the web app) and are separate from in-app REZ orders.
 */

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/services/api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WebOrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  image?: string;
  customisation?: string;
}

export interface BillSplit {
  name: string;
  amount: number;
  paid: boolean;
  paidAt?: string;
}

export type WebOrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export interface WebOrder {
  _id: string;
  orderNumber: string;
  storeId: string;
  storeSlug: string;
  storeName: string;
  customerPhone: string;
  customerName?: string;
  tableNumber?: string;
  items: WebOrderItem[];
  subtotal?: number;
  taxes?: number;
  total: number;
  tipAmount?: number;
  tipPercentage?: number;
  totalWithTip?: number;
  billSplits?: BillSplit[];
  status: WebOrderStatus;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  specialInstructions?: string;
  channel: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebOrdersPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// ─── Status helpers ───────────────────────────────────────────────────────────

export const WEB_ORDER_STATUS_COLORS: Record<WebOrderStatus, string> = {
  pending_payment: '#9E9E9E',
  paid: '#2196F3',
  confirmed: '#3F51B5',
  preparing: '#FF9800',
  ready: '#4CAF50',
  completed: '#388E3C',
  cancelled: '#F44336',
};

export const WEB_ORDER_STATUS_LABELS: Record<WebOrderStatus, string> = {
  pending_payment: 'Pending Payment',
  paid: 'Paid',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWebOrders(storeId?: string) {
  const [orders, setOrders] = useState<WebOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState<WebOrdersPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [statusFilter, setStatusFilter] = useState<WebOrderStatus | 'all'>('all');

  const fetchOrders = useCallback(
    async (page = 1, isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else if (page === 1) {
          setLoading(true);
        }

        const params: Record<string, string | number> = { page, limit: 20 };
        if (storeId) params.storeId = storeId;
        if (statusFilter !== 'all') params.status = statusFilter;

        const queryString = new URLSearchParams(
          Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
        ).toString();

        const response = await apiClient.get(`merchant/web-orders?${queryString}`);

        if (response.success) {
          const newOrders: WebOrder[] = response.data ?? [];
          const paginationData: WebOrdersPagination = (response as unknown).pagination ?? {
            page,
            limit: 20,
            total: newOrders.length,
            totalPages: 1,
            hasMore: false,
          };

          setOrders(page === 1 ? newOrders : (prev) => [...prev, ...newOrders]);
          setPagination(paginationData);
        }
      } catch (err) {
        if (__DEV__) console.error('[useWebOrders] fetch error:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [storeId, statusFilter]
  );

  const onRefresh = useCallback(() => fetchOrders(1, true), [fetchOrders]);

  const loadMore = useCallback(() => {
    if (pagination.hasMore && !loading) {
      fetchOrders(pagination.page + 1);
    }
  }, [pagination, loading, fetchOrders]);

  // Re-fetch when filter or storeId changes
  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  // Status counts derived from the current page's orders
  const statusCounts = orders.reduce(
    (acc, order) => {
      acc.all += 1;
      acc[order.status] = (acc[order.status] ?? 0) + 1;
      return acc;
    },
    { all: 0 } as Record<string, number>
  );

  return {
    orders,
    loading,
    refreshing,
    pagination,
    statusFilter,
    setStatusFilter,
    statusCounts,
    onRefresh,
    loadMore,
  };
}
