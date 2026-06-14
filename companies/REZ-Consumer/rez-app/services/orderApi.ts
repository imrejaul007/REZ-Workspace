// @ts-nocheck
/**
 * @deprecated Use ordersApi.ts instead. This file is only kept for
 * app/orders/[orderId]/tracking.tsx which should be migrated.
 * Marked: 2026-04-11
 */

// Order API Service
// API service for order-related operations

import apiClient, { ApiResponse } from './apiClient';
import { Order, OrderFilter, OrderSummary, OrderAnalytics } from '@/types/order';

interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * @deprecated Use ordersApi.ts CreateOrderRequest instead.
 * This interface is kept for test compatibility only.
 *
 * Backend (rezbackend) POST /orders expects:
 * {
 *   fulfillmentType?: 'delivery' | 'pickup' | 'drive_thru' | 'dine_in',
 *   deliveryAddress?: { name, phone, addressLine1, city, state, pincode, ... },
 *   paymentMethod: 'wallet' | 'card' | 'upi' | 'cod' | 'netbanking' | 'razorpay',
 *   fulfillmentDetails?: { tableNumber?, vehicleInfo?, pickupInstructions? },
 *   specialInstructions?: string,
 *   couponCode?: string,
 *   redemptionCode?: string,
 *   lockFeeDiscount?: number,
 *   coinsUsed?: { rezCoins, promoCoins, storePromoCoins, totalCoinsValue?, wasilCoins? },
 *   storeId?: string,
 *   items?: Array<{ product: string; quantity: number; price: number; name? }>,
 *   pickId?: string,
 * }
 *
 * Tests should migrate to ordersApi.ts which uses the correct format.
 */
interface CreateOrderData {
  fulfillmentType?: 'delivery' | 'pickup' | 'drive_thru' | 'dine_in';
  fulfillmentDetails?: {
    tableNumber?: string;
    vehicleInfo?: string;
    pickupInstructions?: string;
  };
  deliveryAddress?: {
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
  paymentMethod: 'wallet' | 'card' | 'upi' | 'cod' | 'netbanking' | 'razorpay';
  specialInstructions?: string;
  couponCode?: string;
  redemptionCode?: string;
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

class OrderApiService {
  private baseUrl = '/orders';

  /**
   * Get user's orders
   */
  async getOrders(params: GetOrdersParams = {}): Promise<ApiResponse<{ orders: Order[]; total: number; hasMore: boolean }>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);

      const url = `${this.baseUrl}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await apiClient.get<unknown>(url);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch orders',
        data: undefined,
      };
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<ApiResponse<Order>> {
    try {
      return await apiClient.get<unknown>(`${this.baseUrl}/${orderId}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch order',
        data: undefined,
      };
    }
  }

  /**
   * Create new order
   */
  async createOrder(orderData: CreateOrderData): Promise<ApiResponse<Order>> {
    try {
      return await apiClient.post<Order>(this.baseUrl, orderData);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order',
        data: undefined,
      };
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, reason?: string): Promise<ApiResponse<Order>> {
    try {
      return await apiClient.patch<unknown>(`${this.baseUrl}/${orderId}/cancel`, { reason });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel order',
        data: undefined,
      };
    }
  }

  /**
   * Request order return
   */
  async requestReturn(orderId: string, reason: string, items: string[]): Promise<ApiResponse<Order>> {
    try {
      return await apiClient.post<unknown>(`${this.baseUrl}/${orderId}/refund-request`, {
        reason,
        refundItems: items.map(itemId => ({ itemId, quantity: 1 })),
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to request return',
        data: undefined,
      };
    }
  }

  /**
   * Track order
   */
  async trackOrder(orderId: string): Promise<ApiResponse<{
    order: Order;
    tracking: {
      status: string;
      location: string;
      timestamp: string;
      description: string;
    }[];
  }>> {
    try {
      return await apiClient.get<unknown>(`${this.baseUrl}/${orderId}/tracking`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to track order',
        data: undefined,
      };
    }
  }

  /**
   * Get order summary
   */
  async getOrderSummary(): Promise<ApiResponse<OrderSummary>> {
    try {
      return await apiClient.get<unknown>(`${this.baseUrl}/stats`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch order summary',
        data: undefined,
      };
    }
  }

  /**
   * Get order analytics
   */
  async getOrderAnalytics(): Promise<ApiResponse<OrderAnalytics>> {
    try {
      return await apiClient.get<unknown>(`${this.baseUrl}/analytics`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch order analytics',
        data: undefined,
      };
    }
  }

  /**
   * Rate order
   */
  async rateOrder(orderId: string, rating: number, review?: string): Promise<ApiResponse<Order>> {
    try {
      return await apiClient.post<unknown>(`${this.baseUrl}/${orderId}/rate`, {
        rating,
        review,
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to rate order',
        data: undefined,
      };
    }
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber: string): Promise<ApiResponse<Order>> {
    try {
      return await apiClient.get<unknown>(`${this.baseUrl}/${orderNumber}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch order',
        data: undefined,
      };
    }
  }
}

// Singleton pattern using globalThis to persist across SSR module re-evaluations
const ORDER_API_SERVICE_KEY = '__rezOrderApiService__';

function getOrderApiService(): OrderApiService {
  if (typeof globalThis !== 'undefined') {
    if (!(globalThis as unknown)[ORDER_API_SERVICE_KEY]) {
      (globalThis as unknown)[ORDER_API_SERVICE_KEY] = new OrderApiService();
    }
    return (globalThis as unknown)[ORDER_API_SERVICE_KEY];
  }
  return new OrderApiService();
}

export const orderApi = getOrderApiService();
export default orderApi;
