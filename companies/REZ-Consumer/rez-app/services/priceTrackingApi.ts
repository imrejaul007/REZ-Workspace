/**
 * Price Tracking API Service
 *
 * Handles price history and price alert requests
 */

import apiClient from './apiClient';

export interface PricePoint {
  basePrice: number;
  salePrice: number;
  discount: number;
  discountPercentage?: number;
  currency: string;
}

export interface PriceHistoryRecord {
  _id: string;
  productId: string;
  variantId?: string;
  price: PricePoint;
  previousPrice?: PricePoint;
  changeType: 'increase' | 'decrease' | 'no_change' | 'initial';
  changeAmount: number;
  changePercentage: number;
  recordedAt: Date;
  createdAt: Date;
}

export interface PriceStats {
  latest?: PricePoint;
  lowest?: PricePoint;
  highest?: PricePoint;
  average?: {
    salePrice: number;
    basePrice: number;
  };
  trend?: {
    trend: 'increasing' | 'decreasing' | 'stable';
    latest: number;
    oldest: number;
    change: number;
    changePercentage: string;
    dataPoints: number;
    increaseCount: number;
    decreaseCount: number;
  };
  period?: string;
}

export interface PriceAlert {
  _id: string;
  userId: string;
  productId: string;
  variantId?: string;
  alertType: 'target_price' | 'percentage_drop' | 'any_drop';
  targetPrice?: number;
  percentageDrop?: number;
  currentPriceAtCreation: number;
  notificationMethod: ('email' | 'push' | 'sms')[];
  contact?: {
    email?: string;
    phone?: string;
  };
  status: 'active' | 'triggered' | 'expired' | 'cancelled';
  triggeredAt?: Date;
  triggeredPrice?: number;
  expiresAt: Date;
  daysUntilExpiration?: number;
  metadata?: {
    productName?: string;
    productImage?: string;
    variantAttributes?: Record<string, unknown>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePriceAlertRequest {
  productId: string;
  variantId?: string;
  alertType: 'target_price' | 'percentage_drop' | 'any_drop';
  targetPrice?: number;
  percentageDrop?: number;
  notificationMethod?: ('email' | 'push' | 'sms')[];
  contact?: {
    email?: string;
    phone?: string;
  };
}

class PriceTrackingApi {
  private baseUrl = '/price-tracking';

  /**
   * Get price history for a product
   */
  async getPriceHistory(
    productId: string,
    options?: {
      variantId?: string;
      limit?: number;
      startDate?: string;
      endDate?: string;
    }
  ) {
    try {

      const response = await apiClient.get<unknown>(`${this.baseUrl}/history/${productId}`, {
        params: options as unknown,
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get price statistics for a product
   */
  async getPriceStats(
    productId: string,
    options?: {
      variantId?: string;
      days?: number;
    }
  ) {
    try {

      const response = await apiClient.get<unknown>(`${this.baseUrl}/stats/${productId}`, {
        params: options as unknown,
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a price alert
   */
  async createPriceAlert(data: CreatePriceAlertRequest) {
    try {

      const response = await apiClient.post<unknown>(`${this.baseUrl}/alerts`, data as unknown);

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user's price alerts
   */
  async getMyAlerts(params?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'triggered' | 'expired' | 'cancelled';
  }) {
    try {

      const response = await apiClient.get<unknown>(`${this.baseUrl}/alerts/my-alerts`, params as unknown);

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user has active alert for product
   */
  async checkAlert(productId: string, variantId?: string) {
    try {
      const response = await apiClient.get<unknown>(`${this.baseUrl}/alerts/check/${productId}`, variantId ? { variantId } : undefined);

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel a price alert
   */
  async cancelAlert(alertId: string) {
    try {

      const response = await apiClient.delete<unknown>(`${this.baseUrl}/alerts/${alertId}`);

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get alert statistics for a product (Admin/Store)
   */
  async getAlertStats(productId: string) {
    try {
      const response = await apiClient.get<unknown>(`${this.baseUrl}/alerts/stats/${productId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

const priceTrackingApi = new PriceTrackingApi();
export default priceTrackingApi;
