/**
 * Order Service - Real Order Service Integration
 *
 * Connects directly to https://rez-order-service.onrender.com
 * Provides order management, real-time updates via WebSocket, and webhook support.
 * Supports offline mode with local caching and action queuing.
 */

import { logger } from '@/utils/logger';
import {
  cacheData,
  getCachedData,
  queueOfflineAction,
  isOnline,
  getCachedOrFetch,
} from './offlineService';

// Order Service base URL
const ORDER_SERVICE_URL =
  process.env.EXPO_PUBLIC_ORDER_SERVICE_URL || 'https://rez-order-service.onrender.com';

// WebSocket URL
const ORDER_WS_URL = process.env.EXPO_PUBLIC_ORDER_WS_URL || 'wss://rez-order-service.onrender.com';

// Types
export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'dispatched'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  id?: string;
  productId?: string;
  productName: string;
  name?: string;
  quantity: number;
  price: number;
  subtotal?: number;
  total?: number;
  notes?: string;
  specialInstructions?: string;
  customizations?: string[];
}

export interface OrderCustomer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface OrderAddress {
  street?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  pincode?: string;
  country?: string;
  fullAddress?: string;
}

export interface LiveOrder {
  _id: string;
  orderId: string;
  merchantId?: string;
  orderNumber?: string;
  customerName: string;
  customerPhone?: string;
  customer?: OrderCustomer;
  items: OrderItem[];
  totalAmount: number;
  subtotal?: number;
  tax?: number;
  deliveryFee?: number;
  discount?: number;
  status: OrderStatus;
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  delivery?: {
    method: 'pickup' | 'delivery' | 'dine_in' | 'drive_thru';
    address?: OrderAddress;
    instructions?: string;
    estimatedTime?: string;
  };
  specialInstructions?: string;
  notes?: string;
  priority?: 'normal' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  readyAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
}

export interface OrderListResponse {
  orders: LiveOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface OrderSearchParams {
  merchantId: string;
  status?: OrderStatus | OrderStatus[];
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'totalAmount' | 'status';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  notes?: string;
  notifyCustomer?: boolean;
}

export interface CancelOrderRequest {
  reason: string;
  notifyCustomer?: boolean;
}

export interface WebSocketMessage {
  type: 'new_order' | 'order_updated' | 'order_cancelled' | 'order_status_changed' | 'ping' | 'pong';
  orderId?: string;
  order?: LiveOrder;
  status?: OrderStatus;
  timestamp?: string;
  data?: Record<string, unknown>;
}

export interface WebSocketOptions {
  merchantId: string;
  onNewOrder?: (order: LiveOrder) => void;
  onOrderUpdated?: (order: LiveOrder) => void;
  onOrderCancelled?: (orderId: string) => void;
  onOrderStatusChanged?: (orderId: string, status: OrderStatus) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface WebhookPayload {
  event: 'order.created' | 'order.updated' | 'order.status_changed' | 'order.cancelled';
  orderId: string;
  merchantId: string;
  timestamp: string;
  data: {
    order?: LiveOrder;
    previousStatus?: OrderStatus;
    newStatus?: OrderStatus;
  };
}

// Status configuration
export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  placed: { label: 'New Order', bg: '#FEF3C7', text: '#D97706' },
  confirmed: { label: 'Confirmed', bg: '#EFF6FF', text: '#3B82F6' },
  preparing: { label: 'Preparing', bg: '#F5F3FF', text: '#7C3AED' },
  ready: { label: 'Ready', bg: '#F0FDF4', text: '#16A34A' },
  dispatched: { label: 'Dispatched', bg: '#FFF7ED', text: '#EA580C' },
  out_for_delivery: { label: 'Out for Delivery', bg: '#FFF7ED', text: '#D97706' },
  delivered: { label: 'Delivered', bg: '#F3F4F6', text: '#6B7280' },
  cancelled: { label: 'Cancelled', bg: '#FEF2F2', text: '#DC2626' },
};

// API Error type
interface OrderServiceError {
  code: string;
  message: string;
  statusCode?: number;
}

class OrderService {
  private baseUrl: string;
  private wsUrl: string;
  private ws: WebSocket | null = null;
  private wsOptions: WebSocketOptions | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts: number = 0;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private token: string | null = null;

  constructor() {
    this.baseUrl = ORDER_SERVICE_URL;
    this.wsUrl = ORDER_WS_URL;
  }

  setToken(token: string): void {
    this.token = token;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: OrderServiceError = {
        code: errorData.code || `HTTP_${response.status}`,
        message: errorData.message || `Request failed with status ${response.status}`,
        statusCode: response.status,
      };
      throw error;
    }
    return response.json();
  }

  // GET /orders/:merchantId - Get real orders for merchant
  async getOrders(params: OrderSearchParams, options?: { forceRefresh?: boolean }): Promise<OrderListResponse> {
    // Create cache key from params
    const cacheKey = `orders_${params.merchantId}_${JSON.stringify(params)}`;

    // If not forcing refresh, try cache first with offline fallback
    if (!options?.forceRefresh) {
      try {
        return await getCachedOrFetch(
          cacheKey,
          async () => this.fetchOrdersFromAPI(params),
          5 * 60 * 1000 // 5 minute TTL
        );
      } catch {
        // getCachedOrFetch throws if no data available offline
        // Fall through to try API directly
      }
    }

    // Try fetching from API
    if (await isOnline()) {
      try {
        const result = await this.fetchOrdersFromAPI(params);
        // Cache the result
        await cacheData(cacheKey, result, 5 * 60 * 1000);
        return result;
      } catch (error) {
        logger.error('[OrderService] API fetch failed:', error);
        throw error;
      }
    }

    // Offline: try to get cached data
    const cached = await getCachedData<OrderListResponse>(cacheKey);
    if (cached) {
      logger.debug('[OrderService] Using cached orders (offline mode)');
      return cached;
    }

    throw new Error('No cached data available and offline');
  }

  // Internal method to fetch from API
  private async fetchOrdersFromAPI(params: OrderSearchParams): Promise<OrderListResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('merchantId', params.merchantId);

    if (params.status) {
      const statuses = Array.isArray(params.status) ? params.status : [params.status];
      statuses.forEach((s) => searchParams.append('status', s));
    }
    if (params.paymentStatus) searchParams.append('paymentStatus', params.paymentStatus);
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.order) searchParams.append('order', params.order);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const url = `${this.baseUrl}/orders/${params.merchantId}?${searchParams.toString()}`;
    logger.debug('[OrderService] Fetching orders from API:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await this.handleResponse<{
      success: boolean;
      data?: {
        orders?: LiveOrder[];
        items?: LiveOrder[];
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
        hasMore?: boolean;
      };
      orders?: LiveOrder[];
      pagination?: {
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
        hasMore?: boolean;
      };
    }>(response);

    // Normalize response - support multiple response shapes
    const orders = data.data?.orders || data.data?.items || data.orders || [];
    const pagination = data.data || data.pagination || {};

    return {
      orders,
      total: pagination.total || orders.length,
      page: pagination.page || 1,
      limit: pagination.limit || orders.length,
      totalPages: pagination.totalPages || 1,
      hasMore: pagination.hasMore || false,
    };
  }

  // GET /orders/:id - Get real order details
  async getOrderById(orderId: string, options?: { forceRefresh?: boolean }): Promise<LiveOrder> {
    const cacheKey = `order_${orderId}`;

    // If not forcing refresh, try cache first
    if (!options?.forceRefresh) {
      const cached = await getCachedData<LiveOrder>(cacheKey);
      if (cached) {
        logger.debug('[OrderService] Using cached order:', orderId);
        // Return cached data, but refresh in background if online
        if (await isOnline()) {
          this.fetchOrderFromAPI(orderId).then((fresh) => {
            cacheData(cacheKey, fresh, 10 * 60 * 1000).catch(() => {});
          }).catch(() => {});
        }
        return cached;
      }
    }

    // Try API
    if (await isOnline()) {
      try {
        const result = await this.fetchOrderFromAPI(orderId);
        await cacheData(cacheKey, result, 10 * 60 * 1000);
        return result;
      } catch (error) {
        logger.error('[OrderService] API fetch failed:', error);
        throw error;
      }
    }

    // Offline: try cache
    const cached = await getCachedData<LiveOrder>(cacheKey);
    if (cached) {
      logger.debug('[OrderService] Using cached order (offline mode):', orderId);
      return cached;
    }

    throw new Error('No cached order available and offline');
  }

  // Internal method to fetch from API
  private async fetchOrderFromAPI(orderId: string): Promise<LiveOrder> {
    const url = `${this.baseUrl}/orders/id/${orderId}`;
    logger.debug('[OrderService] Fetching order from API:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await this.handleResponse<{
      success: boolean;
      data?: LiveOrder;
      order?: LiveOrder;
    }>(response);

    // Support multiple response shapes
    return data.data || data.order!;
  }

  // PATCH /orders/:id/status - Update order status
  async updateOrderStatus(
    orderId: string,
    updateData: UpdateOrderStatusRequest,
    options?: { queueIfOffline?: boolean }
  ): Promise<LiveOrder> {
    const online = await isOnline();

    if (!online && options?.queueIfOffline !== false) {
      // Queue the action for later sync
      const actionId = await queueOfflineAction('order', 'updateStatus', {
        orderId,
        data: updateData,
      });
      logger.debug('[OrderService] Order status update queued:', actionId);

      // Return optimistic response
      return {
        _id: orderId,
        orderId,
        customerName: '',
        items: [],
        totalAmount: 0,
        status: updateData.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as LiveOrder;
    }

    try {
      const url = `${this.baseUrl}/orders/${orderId}/status`;
      logger.debug('[OrderService] Updating order status:', url, updateData);

      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(updateData),
      });

      const data = await this.handleResponse<{
        success: boolean;
        data?: LiveOrder;
        order?: LiveOrder;
      }>(response);

      const result = data.data || data.order!;

      // Update cache with new status
      await cacheData(`order_${orderId}`, result, 10 * 60 * 1000);

      return result;
    } catch (error) {
      logger.error('[OrderService] Error updating order status:', error);

      // If request failed and option to queue is enabled, queue now
      if (options?.queueIfOffline !== false) {
        await queueOfflineAction('order', 'updateStatus', {
          orderId,
          data: updateData,
        });
        logger.debug('[OrderService] Order status update queued after failed request');

        // Return optimistic response
        return {
          _id: orderId,
          orderId,
          customerName: '',
          items: [],
          totalAmount: 0,
          status: updateData.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as LiveOrder;
      }

      throw error;
    }
  }

  // POST /orders/:id/cancel - Cancel order
  async cancelOrder(
    orderId: string,
    cancelData: CancelOrderRequest,
    options?: { queueIfOffline?: boolean }
  ): Promise<LiveOrder> {
    const online = await isOnline();

    if (!online && options?.queueIfOffline !== false) {
      // Queue the action for later sync
      const actionId = await queueOfflineAction('order', 'cancel', {
        orderId,
        data: cancelData,
      });
      logger.debug('[OrderService] Order cancellation queued:', actionId);

      // Return optimistic response
      return {
        _id: orderId,
        orderId,
        customerName: '',
        items: [],
        totalAmount: 0,
        status: 'cancelled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as LiveOrder;
    }

    try {
      const url = `${this.baseUrl}/orders/${orderId}/cancel`;
      logger.debug('[OrderService] Cancelling order:', url, cancelData);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(cancelData),
      });

      const data = await this.handleResponse<{
        success: boolean;
        data?: LiveOrder;
        order?: LiveOrder;
      }>(response);

      const result = data.data || data.order!;

      // Update cache
      await cacheData(`order_${orderId}`, result, 10 * 60 * 1000);

      return result;
    } catch (error) {
      logger.error('[OrderService] Error cancelling order:', error);

      // If request failed and option to queue is enabled, queue now
      if (options?.queueIfOffline !== false) {
        await queueOfflineAction('order', 'cancel', {
          orderId,
          data: cancelData,
        });
        logger.debug('[OrderService] Order cancellation queued after failed request');

        // Return optimistic response
        return {
          _id: orderId,
          orderId,
          customerName: '',
          items: [],
          totalAmount: 0,
          status: 'cancelled',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as LiveOrder;
      }

      throw error;
    }
  }

  // POST /orders/:id/accept - Accept order
  async acceptOrder(orderId: string, notes?: string, options?: { queueIfOffline?: boolean }): Promise<LiveOrder> {
    return this.updateOrderStatus(orderId, {
      status: 'confirmed',
      notes,
      notifyCustomer: true,
    }, options);
  }

  // POST /orders/:id/ready - Mark order as ready
  async markOrderReady(orderId: string, notes?: string, options?: { queueIfOffline?: boolean }): Promise<LiveOrder> {
    return this.updateOrderStatus(orderId, {
      status: 'ready',
      notes,
      notifyCustomer: true,
    }, options);
  }

  // POST /orders/:id/dispatch - Dispatch order
  async dispatchOrder(orderId: string, notes?: string, options?: { queueIfOffline?: boolean }): Promise<LiveOrder> {
    return this.updateOrderStatus(orderId, {
      status: 'dispatched',
      notes,
      notifyCustomer: true,
    }, options);
  }

  // POST /orders/:id/deliver - Mark order as delivered
  async deliverOrder(orderId: string, notes?: string, options?: { queueIfOffline?: boolean }): Promise<LiveOrder> {
    return this.updateOrderStatus(orderId, {
      status: 'delivered',
      notes,
      notifyCustomer: true,
    }, options);
  }

  // Get active orders (placed, confirmed, preparing)
  async getActiveOrders(
    merchantId: string,
    limit: number = 50,
    options?: { forceRefresh?: boolean }
  ): Promise<LiveOrder[]> {
    const result = await this.getOrders({
      merchantId,
      status: ['placed', 'confirmed', 'preparing', 'ready'],
      limit,
      sortBy: 'createdAt',
      order: 'desc',
    }, options);
    return result.orders;
  }

  // Get new orders only (for live feed)
  async getNewOrders(
    merchantId: string,
    limit: number = 50,
    options?: { forceRefresh?: boolean }
  ): Promise<LiveOrder[]> {
    const result = await this.getOrders({
      merchantId,
      status: 'placed',
      limit,
      sortBy: 'createdAt',
      order: 'desc',
    }, options);
    return result.orders;
  }

  // Get order history
  async getOrderHistory(
    merchantId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
      forceRefresh?: boolean;
    }
  ): Promise<OrderListResponse> {
    return this.getOrders({
      merchantId,
      status: ['delivered', 'cancelled'],
      startDate: options?.startDate,
      endDate: options?.endDate,
      page: options?.page || 1,
      limit: options?.limit || 20,
      sortBy: 'createdAt',
      order: 'desc',
    }, { forceRefresh: options?.forceRefresh });
  }

  // WebSocket connection for real-time updates
  connectWebSocket(options: WebSocketOptions): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      logger.debug('[OrderService] WebSocket already connected');
      return;
    }

    this.wsOptions = options;
    this.reconnectAttempts = 0;

    const wsUrl = `${this.wsUrl}/ws/orders/${options.merchantId}`;
    logger.debug('[OrderService] Connecting WebSocket:', wsUrl);

    try {
      this.ws = new WebSocket(wsUrl);

      // Add auth token to headers if available
      if (this.token) {
        this.ws.setRequestHeader('Authorization', `Bearer ${this.token}`);
      }

      this.ws.onopen = () => {
        logger.debug('[OrderService] WebSocket connected');
        this.reconnectAttempts = 0;
        options.onConnect?.();

        // Start ping interval to keep connection alive
        this.startPingInterval();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'new_order':
              if (message.order) {
                options.onNewOrder?.(message.order);
              }
              break;
            case 'order_updated':
            case 'order_status_changed':
              if (message.order) {
                options.onOrderUpdated?.(message.order);
              }
              if (message.orderId && message.status) {
                options.onOrderStatusChanged?.(message.orderId, message.status);
              }
              break;
            case 'order_cancelled':
              if (message.orderId) {
                options.onOrderCancelled?.(message.orderId);
              }
              break;
            case 'pong':
              // Heartbeat response - connection is alive
              break;
          }
        } catch (error) {
          logger.error('[OrderService] Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        logger.error('[OrderService] WebSocket error:', error);
        options.onError?.(new Error('WebSocket connection error'));
      };

      this.ws.onclose = () => {
        logger.debug('[OrderService] WebSocket disconnected');
        this.stopPingInterval();
        options.onDisconnect?.();
        this.scheduleReconnect();
      };
    } catch (error) {
      logger.error('[OrderService] Failed to create WebSocket:', error);
      options.onError?.(error as Error);
    }
  }

  private startPingInterval(): void {
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (!this.wsOptions) return;

    const maxAttempts = this.wsOptions.maxReconnectAttempts || 5;
    const interval = this.wsOptions.reconnectInterval || 5000;

    if (this.reconnectAttempts < maxAttempts) {
      this.reconnectAttempts++;
      logger.debug(
        `[OrderService] Scheduling reconnect attempt ${this.reconnectAttempts}/${maxAttempts} in ${interval}ms`
      );

      this.reconnectTimer = setTimeout(() => {
        if (this.wsOptions) {
          this.connectWebSocket(this.wsOptions);
        }
      }, interval);
    } else {
      logger.warn('[OrderService] Max reconnect attempts reached');
      this.wsOptions.onError?.(new Error('Max reconnection attempts reached'));
    }
  }

  disconnectWebSocket(): void {
    this.stopPingInterval();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.wsOptions = null;
    this.reconnectAttempts = 0;
  }

  isWebSocketConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Register webhook endpoint for order updates
  async registerWebhook(merchantId: string, webhookUrl: string): Promise<{ success: boolean; webhookId: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/webhooks/register`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          merchantId,
          webhookUrl,
          events: ['order.created', 'order.updated', 'order.status_changed', 'order.cancelled'],
        }),
      });

      return this.handleResponse<{ success: boolean; webhookId: string }>(response);
    } catch (error) {
      logger.error('[OrderService] Error registering webhook:', error);
      throw error;
    }
  }

  // Unregister webhook
  async unregisterWebhook(webhookId: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      return this.handleResponse<{ success: boolean }>(response);
    } catch (error) {
      logger.error('[OrderService] Error unregistering webhook:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return this.handleResponse<{ status: string; timestamp: string }>(response);
    } catch (error) {
      logger.error('[OrderService] Health check failed:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
export const orderService = new OrderService();
export default orderService;
