// @ts-nocheck
// Orders API Service
// Handles order creation, management, and tracking

import apiClient, { ApiResponse } from './apiClient';
import uuid from 'react-native-uuid';
import {
  Order as UnifiedOrder,
  OrderItem as UnifiedOrderItem,
  toOrder,
  canCancelOrder
} from '@/types/unified';
// Week-4: Response guards — validate backend responses at runtime using the
// no-zod guards from @rez/shared-types. Guards narrow the response shape so
// downstream code always receives well-typed data.
import { isOrderResponse, isArrayOf } from '@rez/shared-types';

// Keep the old OrderItem interface for backwards compatibility during migration
export interface OrderItem {
  id: string;
  productId: string;
  variantId?: string;
  product: {
    id: string;
    name: string;
    description: string;
    images: Array<{
      url: string;
      alt: string;
    }>;
    store: {
      id: string;
      name: string;
      logo?: string;
    };
  };
  variant?: {
    id: string;
    name: string;
    sku: string;
    attributes: Record<string, unknown>;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  _id: string; // MongoDB ID from backend
  id: string;
  orderNumber: string;
  userId: string;
  store?: {  // Primary store for the order (populated)
    _id: string;
    id?: string;
    name: string;
    logo?: string;
    location?;
  } | string; // Can be populated object or just ID string
  // Extended backend fields (not in canonical Order but sent by backend)
  /** Fulfillment type from backend */
  fulfillmentType?: 'delivery' | 'pickup' | 'drive_thru' | 'dine_in';
  /** Fulfillment details from backend */
  fulfillmentDetails?: {
    tableNumber?: string;
    storeAddress?: string;
    vehicleInfo?: string;
    pickupInstructions?: string;
  };
  /** Coins used in payment */
  coinsUsed?: {
    rezCoins?: number;
    promoCoins?: number;
    storePromoCoins?: number;
    totalCoinsValue?: number;
    wasilCoins?: number; // Legacy field
    [key: string]: number | undefined;
  };
  /** Extended store data */
  storeData?: {
    _id?: string;
    name?: string;
    logo?: string;
  };
  /**
   * Order status from the backend FSM.
   * Canonical values: 'placed' | 'confirmed' | 'preparing' | 'ready' | 'dispatched' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded'
   *
   * CA-CMC-042 FIX: Removed legacy values ('pending', 'processing', 'shipped').
   * These are obsolete and never emitted by the backend FSM.
   * Migration is handled in toOrder() mapper which normalizes legacy values to canonical ones.
   * Mapping: pending→placed, processing→preparing, shipped→dispatched
   */
  status: 'placed' | 'confirmed' | 'preparing' | 'ready' | 'dispatched' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus?: 'pending' | 'awaiting_payment' | 'processing' | 'authorized' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  items: OrderItem[];
  createdAt: string; // Order creation timestamp
  updatedAt: string; // Last update timestamp
  totals: {
    subtotal: number;
    tax: number;
    delivery: number;
    discount: number;
    lockFeeDiscount?: number;
    cashback: number;
    total: number;
    paidAmount: number;
    refundAmount: number;
  };
  summary?: { // Deprecated - use totals instead
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    total: number;
  };
  payment: {
    method: 'cod' | 'wallet' | 'card' | 'upi' | 'netbanking';
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    /** Coins used in payment (extends canonical payment type) */
    coinsUsed?: {
      rezCoins?: number;
      promoCoins?: number;
      storePromoCoins?: number;
      totalCoinsValue?: number;
      wasilCoins?: number;
      [key: string]: number | undefined;
    };
  };
  delivery: {
    method: 'standard' | 'express' | 'pickup';
    status: 'pending' | 'confirmed' | 'dispatched' | 'delivered';
    address: {
      name: string;
      phone: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      pincode: string;
      country?: string;
      landmark?: string;
      addressType?: 'home' | 'work' | 'other';
    };
    deliveryFee: number;
    attempts: unknown[];
  };
  timeline: Array<{
    status: string;
    message: string;
    timestamp: string;
    _id?: string;
    details?: Record<string, unknown>;
  }>;
  couponCode?: string;
  specialInstructions?: string;
  cancellation?: {
    reason: string;
    cancelledAt: string;
  };
  cancelReason?: string;
  cancelledAt?: string;
  shippingAddress?: { // Deprecated - use delivery.address instead
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  billingAddress: {
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  coupon?: {
    code: string;
    discountAmount: number;
  };
  tracking?: {
    number: string;
    carrier: string;
    url: string;
    status: string;
    estimatedDelivery?: string;
  };
  notes?: string;
  redemption?: {
    code: string;
    discount: number;
    dealTitle?: string;
  };
}

// Export unified Order types for new code
export { UnifiedOrder, UnifiedOrderItem };

/** Backend pagination shape (field names differ from frontend) */
interface BackendPagination {
  page?: number;
  totalPages?: number;
  current?: number;
  pages?: number;
  total?: number;
  limit?: number;
}

/** Backend response shape before normalization */
interface BackendOrdersResponse {
  orders: Order[];
  nextCursor?: string | null;
  hasMore?: boolean;
  counts?: OrderCounts;
  pagination: BackendPagination;
  summary?: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
  };
}

export interface CreateOrderRequest {
  fulfillmentType?: 'delivery' | 'pickup' | 'drive_thru' | 'dine_in';
  fulfillmentDetails?: {
    tableNumber?: string;
    vehicleInfo?: string;
    pickupInstructions?: string;
  };
  deliveryAddress?: {
    name: string;
    phone: string;
    email?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
    landmark?: string;
    addressType?: 'home' | 'work' | 'other';
  };
  paymentMethod: 'wallet' | 'card' | 'upi' | 'cod' | 'netbanking' | 'razorpay';
  specialInstructions?: string;
  couponCode?: string;
  redemptionCode?: string;
  voucherCode?: string;
  offerRedemptionCode?: string;
  lockFeeDiscount?: number;
  coinsUsed?: {
    rezCoins: number;
    promoCoins: number;
    storePromoCoins: number;
    totalCoinsValue?: number;
    wasilCoins?: number;
  };
  storeId?: string;
  items?: Array<{
    product: string;
    quantity: number;
    price: number;
    name?: string;
  }>;
  pickId?: string;
}

export interface OrdersQuery {
  page?: number;
  limit?: number;
  status?: Order['status'];
  statusGroup?: 'active' | 'past';
  cursor?: string;
  paymentStatus?: Order['paymentStatus'];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sort?: 'newest' | 'oldest' | 'total_asc' | 'total_desc';
}

export interface OrderCounts {
  active: number;
  past: number;
}

export interface TrackingEvent {
  status: string;
  message: string;
  timestamp: string;
  _id?: string;
  details?: Record<string, unknown>;
}

export interface OrderTracking {
  orderId: string;
  currentStatus: string;
  estimatedDelivery?: string;
  events: TrackingEvent[];
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  orders: number;
}

export interface OrderStats {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  topStores: Array<{ storeId: string; storeName: string; orderCount: number; totalSpent: number }>;
  monthlyRevenue: MonthlyRevenue[];
}

export interface OrdersResponse {
  orders: Order[];
  nextCursor?: string | null;
  hasMore?: boolean;
  counts?: OrderCounts;
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
  summary?: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
  };
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface RefundRequest {
  orderId: string;
  amount?: number;
  reason: string;
  items?: Array<{
    itemId: string;
    quantity?: number;
  }>;
}

class OrdersService {
  // Create new order from cart
  // OG-001 FIX: Generate a stable idempotency key per checkout session and attach
  // it via the Idempotency-Key header so the backend middleware (middleware/idempotency.ts)
  // can de-duplicate requests fired on reconnect, double-tap, or network retry.
  // The key must be generated ONCE per user checkout intent (not per API call) and
  // passed in from useCheckout/useCheckoutUI so reconnect retries reuse the same key.
  async createOrder(
    data: CreateOrderRequest,
    idempotencyKey?: string
  ): Promise<ApiResponse<Order>> {
    try {
      const key =
        idempotencyKey ||
        `order-${Date.now()}-${uuid.v4()}`;

      const response = await apiClient.post<Order>('/orders', data as unknown as Record<string, unknown>, {
        headers: { 'Idempotency-Key': key },
      });

      if (!response.success) {
        throw new Error(response.message || 'Order creation failed');
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error?.message || 'Failed to create order',
        message: error?.message || 'Failed to create order',
      };
    }
  }

  // Get user orders with filtering
  async getOrders(query: OrdersQuery = {}): Promise<ApiResponse<OrdersResponse>> {
    try {
      const response = await apiClient.get<BackendOrdersResponse>('/orders', query as unknown as Record<string, string | number | boolean | null | undefined>);

      // Map backend pagination field names to the frontend interface.
      // Backend sends { page, totalPages } but the consumer app expects { current, pages }.
      if (response.success && response.data) {
        // Week-4: Guard each order in the list. Malformed orders are excluded so
        // the UI renders cleanly rather than crashing on undefined fields.
        const validOrders = (response.data.orders ?? []).filter(isOrderResponse);
        const pag = response.data.pagination;
        const mapped: OrdersResponse = {
          ...response.data,
          orders: validOrders as unknown,
          pagination: {
            current: pag.current ?? pag.page ?? 1,
            pages: pag.pages ?? pag.totalPages ?? 1,
            total: pag.total ?? 0,
            limit: pag.limit ?? 20,
          },
        };
        return { ...response, data: mapped };
      }

      return response as unknown as ApiResponse<OrdersResponse>;
    } catch (error) {
      return {
        success: false,
        error: error?.message || 'Failed to fetch orders',
        message: error?.message || 'Failed to fetch orders',
      };
    }
  }

  // Get order counts (lightweight, for header display)
  async getOrderCounts(): Promise<ApiResponse<OrderCounts>> {
    try {
      const response = await apiClient.get<OrderCounts>('/orders/counts');
      return response;
    } catch (error) {
      return {
        success: false,
        error: error?.message || 'Failed to fetch order counts',
        message: error?.message || 'Failed to fetch order counts',
      };
    }
  }

  // Get single order by ID
  async getOrderById(orderId: string): Promise<ApiResponse<Order>> {
    try {
      const response = await apiClient.get<Order>(`/orders/${orderId}`);
      // Week-4: Guard the single-order response. A malformed response crashes the
      // order detail screen at runtime — better to surface an error.
      if (response.success && response.data && !isOrderResponse(response.data)) {
        throw new Error('Malformed order response from backend');
      }
      return response;
    } catch (error) {
      return {
        success: false,
        error: error?.message || 'Failed to fetch order',
        message: error?.message || 'Failed to fetch order',
      };
    }
  }

  // Get order tracking
  async getOrderTracking(orderId: string): Promise<ApiResponse<OrderTracking>> {
    try {
      const response = await apiClient.get<OrderTracking>(`/orders/${orderId}/tracking`);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error?.message || 'Failed to fetch order tracking',
        message: error?.message || 'Failed to fetch order tracking',
      };
    }
  }

  // Cancel order
  async cancelOrder(
    orderId: string,
    reason?: string
  ): Promise<ApiResponse<Order>> {
    try {
      const response = await apiClient.patch<Order>(`/orders/${orderId}/cancel`, { reason });
      // Week-4: Guard the returned order object.
      if (response.success && response.data && !isOrderResponse(response.data)) {
        throw new Error('Malformed order response from backend');
      }
      return response;
    } catch (error) {
      return {
        success: false,
        error: error?.message || 'Failed to cancel order',
        message: error?.message || 'Failed to cancel order',
      };
    }
  }

  // Rate order
  async rateOrder(
    orderId: string,
    rating: number,
    review?: string
  ): Promise<ApiResponse<Order>> {
    try {
      // Validate rating
      if (rating < 1 || rating > 5) {
        return {
          success: false,
          error: 'Invalid rating',
          message: 'Rating must be between 1 and 5',
        };
      }

      const response = await apiClient.post<Order>(`/orders/${orderId}/rate`, { rating, review });
      // Week-4: Guard the returned order object.
      if (response.success && response.data && !isOrderResponse(response.data)) {
        throw new Error('Malformed order response from backend');
      }
      return response;
    } catch (error) {
      return {
        success: false,
        error: error?.message || 'Failed to rate order',
        message: error?.message || 'Failed to rate order',
      };
    }
  }

  // Get order statistics
  async getOrderStats(): Promise<ApiResponse<OrderStats>> {
    try {
      const response = await apiClient.get<OrderStats>('/orders/stats');
      return response;
    } catch (error) {
      return {
        success: false,
        error: error?.message || 'Failed to fetch order statistics',
        message: error?.message || 'Failed to fetch order statistics',
      };
    }
  }

  /**
   * @deprecated ADMIN/STORE-OWNER ONLY — consumer app must NOT call PATCH /orders/:id/status.
   * This endpoint is restricted to admin and merchant roles on the backend.
   * Consumer app should use specific consumer-facing endpoints instead:
   *   - To cancel an order: PATCH /orders/:id/cancel (cancelOrder method above)
   *   - To rate an order:   POST  /orders/:id/rate   (rateOrder method above)
   * Calling this directly from the consumer app will result in a 403 Forbidden response.
   */
  // Update order status (admin/store owner)
  async updateOrderStatus(
    orderId: string,
    status: Order['status'],
    estimatedDeliveryTime?: string,
    trackingInfo?: unknown
  ): Promise<ApiResponse<Order>> {
    try {
      const response = await apiClient.patch<Order>(`/orders/${orderId}/status`, {
        status,
        estimatedDeliveryTime,
        trackingInfo
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: error?.message || 'Failed to update order status',
        message: error?.message || 'Failed to update order status',
      };
    }
  }

}

// Create singleton instance
const ordersService = new OrdersService();

export default ordersService;
