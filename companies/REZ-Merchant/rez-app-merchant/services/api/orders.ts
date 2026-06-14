import { randomUUID } from 'crypto';
import { apiClient } from './client';
import { Order, OrderStatus, PaymentStatus, OrderAnalytics, OrderFilters } from '../../types/api';
import { logger } from '../../utils/logger';

/** Cross-platform UUID generator — works in React Native, Expo, and Node.js. */
const generateUUID = (): string => {
  // Use crypto.randomUUID if available (Node.js 19+, modern browsers)
  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }
  // React Native / Expo: use react-native-get-random-values polyfill
  if (typeof require !== 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { v4 } = require('uuid');
      return v4() as string;
    } catch (_e) {
      // uuid not available at runtime — fall through
    }
  }
  // Node.js fallback with crypto.randomUUID
  try {
    return randomUUID();
  } catch {
    // Final fallback for truly ancient environments
    // NOTE: This is NOT cryptographically secure, but we have no other options
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
};

export interface OrderSearchParams {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  customerId?: string;
  orderNumber?: string;
  storeId?: string;
  sortBy?: 'createdAt' | 'total' | 'status' | 'orderNumber';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  // Backend query param names are startDate/endDate — aligned with /api/merchant/orders route validation
  startDate?: string;
  endDate?: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  notes?: string;
  notifyCustomer?: boolean;
}

export interface BulkOrderActionRequest {
  orderIds: string[];
  action: 'confirm' | 'prepare' | 'ready' | 'deliver' | 'cancel';
  notes?: string;
  notifyCustomers?: boolean;
}

export interface OrderListResponse {
  orders: Order[];
  // AC2-M6 FIX: Removed duplicate `totalCount` field — `total` is the canonical count field.
  // Callers that previously used `totalCount` must use `total` instead.
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

class OrdersService {
  // Canonical status transitions — mirrored from rezbackend/src/config/orderStateMachine.ts
  // STATUS_TRANSITIONS map. Keep in lockstep with the backend FSM; the backend is the
  // authoritative validator and will reject any transition not on this list.
  //
  // Phase 3 canonical transitions:
  //   placed        → confirmed, cancelled, cancelling
  //   confirmed     → preparing, cancelled, cancelling
  //   preparing     → ready, cancelled, cancelling
  //   ready         → dispatched, cancelled, cancelling
  //   dispatched    → out_for_delivery, delivered, cancelled
  //   out_for_delivery → delivered, cancelled
  //   delivered     → returned, refunded
  //   cancelling    → cancelled, placed, confirmed, preparing, ready  (rollback + commit)
  //   cancelled     → refunded
  //   returned      → refunded
  //   refunded      → (terminal)
  private readonly VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
    placed: ['confirmed', 'cancelled', 'cancelling'],
    confirmed: ['preparing', 'cancelled', 'cancelling'],
    preparing: ['ready', 'cancelled', 'cancelling'],
    ready: ['dispatched', 'cancelled', 'cancelling'],
    dispatched: ['out_for_delivery', 'delivered', 'cancelled'],
    out_for_delivery: ['delivered', 'cancelled'],
    delivered: ['returned', 'refunded'],
    cancelling: ['cancelled', 'placed', 'confirmed', 'preparing', 'ready'],
    cancelled: ['refunded'],
    returned: ['refunded'],
    refunded: [],
  };

  private readonly baseUrl = 'merchant/orders';

  /**
   * MED-09: Optimistic order status update.
   *
   * Immediately updates the matching order in the local orders array and returns
   * a rollback function. Callers should apply the update to React Query cache
   * in `onMutate`, then call the rollback in `onError` if the API call fails.
   *
   * Usage with React Query:
   *   const queryClient = useQueryClient();
   *   const { optimisticallyUpdated, rollback } = ordersService.optimisticallyUpdateOrderStatus(
   *     orders, orderId, newStatus, currentStatus
   *   );
   *   queryClient.setQueryData(['orders', ...], optimisticallyUpdated);
   *   // In onError: rollback(); queryClient.invalidateQueries(['orders', ...]);
   *
   * @param orders Current orders array
   * @param orderId ID of the order to update
   * @param newStatus The target status
   * @param previousStatus The status before the change (for rollback)
   * @returns { updatedOrders: Order[]; rollback: () => Order[] } — rollback restores previous status
   */
  optimisticallyUpdateOrderStatus(
    orders: Order[],
    orderId: string,
    newStatus: OrderStatus,
    previousStatus?: string
  ): { updatedOrders: Order[]; rollback: () => Order[] } {
    const snapshot = orders.map((o) => ({ ...o }));
    const updatedOrders = orders.map((order) => {
      if (order.id === orderId || order._id === orderId) {
        return {
          ...order,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        };
      }
      return order;
    });
    const rollback = (): Order[] => snapshot;
    return { updatedOrders, rollback };
  }

  // MERCH-016: Validate order status transitions
  private validateStatusTransition(currentStatus: string, newStatus: string): boolean {
    const allowedTransitions = this.VALID_STATUS_TRANSITIONS[currentStatus.toLowerCase()];
    if (!allowedTransitions) {
      return false;
    }
    return allowedTransitions.includes(newStatus.toLowerCase());
  }

  // Get orders with filtering and pagination
  //
  // Normalizes two supported response shapes from the backend:
  //   Shape 1 (CANONICAL): { success, data: { orders: [...], total, totalPages, page, limit, hasMore } }
  //     Returned by the current monolith /api/merchant/orders endpoint.
  //     This is the authoritative shape. rez-merchant-service should also adopt it.
  //   Shape 2 (LEGACY):    { success, data: [...orders], pagination: { total, page, hasMore } }
  //     Returned by older rez-merchant-service builds. Retained as a fallback while
  //     merchant-service is updated to Shape 1. Remove this branch once confirmed unused.
  //
  // Shape 3 (old rez-backend items/totalCount) has been removed — that endpoint no longer
  // exists in production. If you see "orders is empty unexpectedly" after this change,
  // the backend has regressed to an unknown shape — add explicit logging rather than
  // adding another normalization branch.
  //
  // The hook downstream calls `result.orders.map(...)` so `orders` MUST be a
  // non-null array. If we return undefined here the page crashes with
  // "Cannot read properties of undefined (reading 'map')".
  async getOrders(params: OrderSearchParams = {}): Promise<OrderListResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const qs = searchParams.toString();
    const url = qs ? `${this.baseUrl}?${qs}` : this.baseUrl;

    // Two supported envelope shapes — typed via discriminated union.
    // Shape 1 (canonical): data is an object with an orders array at the top level.
    // Shape 2 (legacy):    data is a bare array; pagination lives as a response sibling.
    interface OrderListPayload {
      orders?: Order[];
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
      hasMore?: boolean;
      pagination?: {
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
        hasMore?: boolean;
      };
    }
    const response = await apiClient.get<OrderListPayload | Order[]>(url);
    if (!response.success) {
      throw new Error(response.error || response.message || 'Failed to get orders');
    }

    // Cast to OrderListPayload for field access; Array.isArray guards handle the bare-array shape.
    const payloadRaw = response.data ?? {};
    const pagination =
      (!Array.isArray(payloadRaw) && typeof payloadRaw === 'object'
        ? (payloadRaw as OrderListPayload).pagination
        : undefined) ??
      (response as { pagination?: OrderListPayload['pagination'] }).pagination ??
      {};

    const payload = payloadRaw as OrderListPayload | Order[];

    // Resolve the orders array from the two supported shapes.
    // Shape 1 (canonical): { data: { orders: [...], total, totalPages, ... } }
    // Shape 2 (legacy):    { data: [...orders], pagination: {...} }
    // If neither shape matches, `orders` stays empty and a warning is logged in dev
    // so the root cause is surfaced rather than hidden behind another fallback branch.
    let orders: Order[] = [];
    if (!Array.isArray(payload) && Array.isArray((payload as OrderListPayload).orders)) {
      // Shape 1 — canonical backend response
      orders = (payload as OrderListPayload).orders!;
    } else if (Array.isArray(payload)) {
      // Shape 2 — data is a bare array (legacy rez-merchant-service)
      orders = payload as Order[];
    } else if (__DEV__) {
      logger.warn(
        '[OrdersService] getOrders: unrecognised response shape — ' +
          'expected { orders: [...] } or a bare array. ' +
          'Check backend response and update this normalizer if the shape has changed.',
        payloadRaw
      );
    }

    const p = Array.isArray(payload) ? {} : (payload as OrderListPayload);
    const total =
      Number(p.total ?? (pagination as OrderListPayload['pagination'])?.total ?? orders.length) ||
      0;
    const page = Number(p.page ?? (pagination as OrderListPayload['pagination'])?.page ?? 1) || 1;
    const limit =
      Number(p.limit ?? (pagination as OrderListPayload['pagination'])?.limit ?? orders.length) ||
      orders.length;
    const totalPages =
      Number(
        p.totalPages ??
          (pagination as OrderListPayload['pagination'])?.totalPages ??
          (limit > 0 ? Math.ceil(total / limit) : 0)
      ) || 0;
    const hasMore = Boolean(
      p.hasMore ??
      (pagination as OrderListPayload['pagination'])?.hasMore ??
      (page > 0 && limit > 0 && page * limit < total)
    );

    return {
      orders,
      total,
      page,
      limit,
      totalPages,
      hasMore,
    };
  }

  // Get single order by ID
  async getOrderById(orderId: string): Promise<Order> {
    const response = await apiClient.get<Order>(`${this.baseUrl}/${orderId}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get order');
    }
    return response.data;
  }

  // MERCH-014: Track order events for analytics
  private trackOrderEvent(eventType: string, orderId: string, status: string): void {
    try {
      // Check if gtag is available in global scope (for analytics)
      const windowGlobal = typeof window !== 'undefined' ? (window as unknown) : null;
      if (windowGlobal && windowGlobal.gtag) {
        windowGlobal.gtag('event', eventType, {
          order_id: orderId,
          order_status: status,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (e) {
      logger.warn('Analytics tracking failed:', e);
    }
  }

  // Update order status
  async updateOrderStatus(
    orderId: string,
    updateData: UpdateOrderStatusRequest,
    currentStatus?: string
  ): Promise<Order> {
    try {
      // MERCH-016: Validate status transition if current status is provided
      if (currentStatus && !this.validateStatusTransition(currentStatus, updateData.status)) {
        throw new Error(
          `Invalid status transition: ${currentStatus} → ${updateData.status}. ` +
            `Valid transitions: ${this.VALID_STATUS_TRANSITIONS[currentStatus.toLowerCase()]?.join(', ') || 'none'}`
        );
      }

      // MA-GAP-156 FIX: crypto.randomUUID() replaces Date.now() for collision-safe idempotency.
      const idempotencyKey = `${orderId}-${updateData.status}-${generateUUID()}`;
      const response = await apiClient.put<Order>(`${this.baseUrl}/${orderId}/status`, updateData, {
        headers: { 'Idempotency-Key': idempotencyKey },
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update order status');
      }
      // MERCH-014: Track order status change for analytics
      this.trackOrderEvent('order_status_updated', orderId, response.data.status);
      return response.data;
    } catch (error) {
      if (__DEV__) console.error('[OrdersAPI] Error updating order status:', error);
      throw error;
    }
  }

  // Perform bulk action on multiple orders
  // MA-GAP-154 FIX: crypto.randomUUID() replaces Date.now() for collision-safe idempotency.
  async bulkAction(actionData: BulkOrderActionRequest): Promise<{
    results: Array<{ success: boolean; orderId: string; message?: string }>;
    summary: { total: number; successful: number; failed: number };
  }> {
    const idempotencyKey = `bulk-order-${generateUUID()}`;
    const response = await apiClient.post<{
      results: Array<{ success: boolean; orderId: string; message?: string }>;
      summary: { total: number; successful: number; failed: number };
    }>(`${this.baseUrl}/bulk-action`, actionData, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to perform bulk action');
    }
    return response.data;
  }

  // MA-GAP-155: Guard to prevent repeated fallback storms — set per-class-instance flag
  private _analyticsFallbackAttempted = false;

  // H3 FIX: call the real order analytics endpoint first; fall back to dashboard
  // metrics only if the endpoint is genuinely absent (404), so that once the
  // backend ships /merchant/orders/analytics the data populates automatically.
  async getAnalytics(dateStart?: string, dateEnd?: string): Promise<OrderAnalytics> {
    try {
      const params = new URLSearchParams();
      // Backend route validates startDate/endDate (not dateStart/dateEnd)
      if (dateStart) params.append('startDate', dateStart);
      if (dateEnd) params.append('endDate', dateEnd);
      const qs = params.toString();
      const response = await apiClient.get<OrderAnalytics>(
        `${this.baseUrl}/analytics${qs ? `?${qs}` : ''}`
      );
      if (response.success && response.data) {
        this._analyticsFallbackAttempted = false; // Reset on success
        return response.data;
      }
    } catch (error) {
      // If it's not a "not found" type error, surface it
      const status = error?.response?.status ?? error?.status;
      if (status && status !== 404) {
        if (__DEV__) console.error('Get order analytics error:', error);
      }
    }

    // MA-GAP-155: Only fire the 11-query fallback ONCE per class instance.
    // Repeated calls return zeros rather than hammering the API with parallel queries.
    if (this._analyticsFallbackAttempted) {
      logger.warn('[OrdersService] Analytics fallback already attempted, returning zeros');
      return {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        statusBreakdown: {
          pending: 0,
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
        },
        revenueGrowth: 0,
        orderGrowth: 0,
        topProducts: [],
      };
    }
    this._analyticsFallbackAttempted = true;

    // Fallback: query orders by status to derive accurate counts for all statuses.
    logger.warn(
      '[OrdersService] /orders/analytics not available, deriving from orders-by-status queries'
    );
    try {
      const { dashboardService } = await import('./dashboard');
      const metricsData = await dashboardService.getMetrics();

      // Query each status in parallel for performance
      const [
        placedResult,
        confirmedResult,
        preparingResult,
        readyResult,
        dispatchedResult,
        outForDeliveryResult,
        deliveredResult,
        cancellingResult,
        cancelledResult,
        returnedResult,
        refundedResult,
      ] = await Promise.allSettled([
        this.getOrdersByStatus('placed', 1, 1),
        this.getOrdersByStatus('confirmed', 1, 1),
        this.getOrdersByStatus('preparing', 1, 1),
        this.getOrdersByStatus('ready', 1, 1),
        this.getOrdersByStatus('dispatched', 1, 1),
        this.getOrdersByStatus('out_for_delivery', 1, 1),
        this.getOrdersByStatus('delivered', 1, 1),
        this.getOrdersByStatus('cancelling', 1, 1),
        this.getOrdersByStatus('cancelled', 1, 1),
        this.getOrdersByStatus('returned', 1, 1),
        this.getOrdersByStatus('refunded', 1, 1),
      ]);

      const totalOrders = metricsData.orders?.total || 0;
      const totalRevenue = metricsData.revenue?.total || 0;

      return {
        totalOrders,
        totalRevenue,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        statusBreakdown: {
          pending: placedResult.status === 'fulfilled' ? placedResult.value.total : 0,
          confirmed: confirmedResult.status === 'fulfilled' ? confirmedResult.value.total : 0,
          preparing: preparingResult.status === 'fulfilled' ? preparingResult.value.total : 0,
          ready: readyResult.status === 'fulfilled' ? readyResult.value.total : 0,
          dispatched: dispatchedResult.status === 'fulfilled' ? dispatchedResult.value.total : 0,
          out_for_delivery:
            outForDeliveryResult.status === 'fulfilled' ? outForDeliveryResult.value.total : 0,
          delivered: deliveredResult.status === 'fulfilled' ? deliveredResult.value.total : 0,
          cancelling: cancellingResult.status === 'fulfilled' ? cancellingResult.value.total : 0,
          cancelled: cancelledResult.status === 'fulfilled' ? cancelledResult.value.total : 0,
          returned: returnedResult.status === 'fulfilled' ? returnedResult.value.total : 0,
          refunded: refundedResult.status === 'fulfilled' ? refundedResult.value.total : 0,
        },
        revenueGrowth: metricsData.revenue?.trend || 0,
        orderGrowth: metricsData.orders?.trend || 0,
        topProducts: [],
      };
    } catch (error) {
      if (__DEV__) console.error('[OrdersService] Analytics fallback failed:', error);
      return {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        statusBreakdown: {
          pending: 0,
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
        },
        revenueGrowth: 0,
        orderGrowth: 0,
        topProducts: [],
      };
    }
  }

  // MA-GAP-162: Guard with __DEV__ — prevents accidental test data creation in production
  async createSampleData(): Promise<{ message: string; merchantId: string }> {
    if (!__DEV__) {
      throw new Error('Sample data creation is disabled in production');
    }
    const response = await apiClient.post<{ message: string; merchantId: string }>(
      `${this.baseUrl}/sample-data`,
      {}
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create sample orders');
    }
    return response.data;
  }

  // Get orders with comprehensive filters
  async searchOrders(filters: OrderFilters): Promise<OrderListResponse> {
    const sortByMap: Record<string, OrderSearchParams['sortBy']> = {
      created: 'createdAt',
      updated: 'createdAt',
      total: 'total',
      priority: 'createdAt',
      createdAt: 'createdAt',
      status: 'status',
      orderNumber: 'orderNumber',
    };
    const params: OrderSearchParams = {
      status: filters.status,
      paymentStatus: filters.paymentStatus,
      customerId: filters.customerId,
      orderNumber: filters.orderNumber,
      sortBy: sortByMap[filters.sortBy || 'createdAt'] || 'createdAt',
      order: filters.sortOrder || 'desc',
      page: filters.page || 1,
      limit: filters.limit || 20,
      // Map OrderFilters.startDate/endDate → backend's startDate/endDate query param names
      startDate: filters.startDate,
      endDate: filters.endDate,
    };

    return this.getOrders(params);
  }

  // Get recent orders (shortcut for dashboard)
  async getRecentOrders(limit: number = 10): Promise<Order[]> {
    const result = await this.getOrders({
      sortBy: 'createdAt',
      order: 'desc',
      limit,
      page: 1,
    });

    return result.orders || [];
  }

  // Get orders by status (shortcut)
  async getOrdersByStatus(
    status: OrderStatus,
    page: number = 1,
    limit: number = 20
  ): Promise<OrderListResponse> {
    return this.getOrders({
      status,
      page,
      limit,
      sortBy: 'createdAt',
      order: 'desc',
    });
  }

  // Get pending orders count
  async getPendingOrdersCount(): Promise<number> {
    const result = await this.getOrdersByStatus('placed', 1, 1);
    return result.total || 0;
  }

  // Cancel order
  async cancelOrder(orderId: string, notes?: string): Promise<Order> {
    return this.updateOrderStatus(orderId, {
      status: 'cancelled',
      notes,
      notifyCustomer: true,
    });
  }

  // Confirm order
  async confirmOrder(orderId: string, notes?: string): Promise<Order> {
    return this.updateOrderStatus(orderId, {
      status: 'confirmed',
      notes,
      notifyCustomer: true,
    });
  }

  // Mark order as delivered
  async deliverOrder(orderId: string, notes?: string): Promise<Order> {
    return this.updateOrderStatus(orderId, {
      status: 'delivered',
      notes,
      notifyCustomer: true,
    });
  }

  // Get order status options
  // Canonical status options — aligned with rez-shared/src/orderStatuses.ts
  getOrderStatusOptions(): Array<{ label: string; value: OrderStatus; color: string }> {
    return [
      { label: 'Placed', value: 'placed', color: '#f59e0b' },
      { label: 'Confirmed', value: 'confirmed', color: '#3b82f6' },
      { label: 'Preparing', value: 'preparing', color: '#8b5cf6' },
      { label: 'Ready', value: 'ready', color: '#06b6d4' },
      { label: 'Dispatched', value: 'dispatched', color: '#0284c7' },
      { label: 'Out for Delivery', value: 'out_for_delivery', color: '#0ea5e9' },
      { label: 'Delivered', value: 'delivered', color: '#10b981' },
      { label: 'Cancelling', value: 'cancelling', color: '#f97316' },
      { label: 'Cancelled', value: 'cancelled', color: '#ef4444' },
      { label: 'Returned', value: 'returned', color: '#a855f7' },
      { label: 'Refunded', value: 'refunded', color: '#6b7280' },
    ];
  }

  // Get order summary metrics
  async getOrderSummary(): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    preparing: number;
    ready: number;
    dispatched: number;
    outForDelivery: number;
    delivered: number;
    cancelling: number;
    cancelled: number;
    returned: number;
    refunded: number;
  }> {
    try {
      const analytics = await this.getAnalytics();

      return {
        total: analytics.totalOrders || 0,
        pending: analytics.statusBreakdown?.pending || 0,
        confirmed: analytics.statusBreakdown?.confirmed || 0,
        preparing: analytics.statusBreakdown?.preparing || 0,
        ready: analytics.statusBreakdown?.ready || 0,
        dispatched: analytics.statusBreakdown?.dispatched || 0,
        outForDelivery: analytics.statusBreakdown?.out_for_delivery || 0,
        delivered: analytics.statusBreakdown?.delivered || 0,
        cancelling: analytics.statusBreakdown?.cancelling || 0,
        cancelled: analytics.statusBreakdown?.cancelled || 0,
        returned: analytics.statusBreakdown?.returned || 0,
        refunded: analytics.statusBreakdown?.refunded || 0,
      };
    } catch (error) {
      if (__DEV__) console.error('Failed to get order summary:', error);
      return {
        total: 0,
        pending: 0,
        confirmed: 0,
        preparing: 0,
        ready: 0,
        dispatched: 0,
        outForDelivery: 0,
        delivered: 0,
        cancelling: 0,
        cancelled: 0,
        returned: 0,
        refunded: 0,
      };
    }
  }
}

// Create and export singleton instance
export const ordersService = new OrdersService();
export default ordersService;
