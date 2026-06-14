/**
 * ECONOMIC ENGINE API SERVICE
 * Integration with REZ Economic Engine
 *
 * Service: rez-economic-engine
 * URL: https://rez-economic-engine.onrender.com
 *
 * Features:
 * - Dynamic pricing
 * - Economic modeling
 * - Price optimization
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

export interface PriceQuote {
  productId: string;
  originalPrice: number;
  finalPrice: number;
  discount: number;
  discountType: 'percentage' | 'fixed' | 'cashback';
  expiresAt: string;
}

export interface PriceHistory {
  productId: string;
  history: Array<{ price: number; timestamp: string }>;
}

/**
 * Get dynamic price
 */
export async function getDynamicPrice(productId: string): Promise<ApiResponse<PriceQuote>> {
  try {
    return await apiClient.get(`/economic/price/${productId}`);
  } catch (error) {
    logger.error('economicEngineApi.getPrice', { productId, error });
    throw error;
  }
}

/**
 * Get price history
 */
export async function getPriceHistory(productId: string, days?: number): Promise<ApiResponse<PriceHistory>> {
  try {
    return await apiClient.get(`/economic/price/${productId}/history${days ? `?days=${days}` : ''}`);
  } catch (error) {
    logger.error('economicEngineApi.getHistory', { productId, error });
    throw error;
  }
}

/**
 * Calculate order economics
 */
export async function calculateOrderEconomics(order: { items: Array<{ productId: string; quantity: number }> }): Promise<ApiResponse<{
  subtotal: number;
  discounts: number;
  margin: number;
  customerSavings: number;
}>> {
  try {
    return await apiClient.post('/economic/order/calculate', order);
  } catch (error) {
    logger.error('economicEngineApi.calculateOrder', { error });
    throw error;
  }
}

/**
 * Get active offers
 */
export async function getActiveOffers(): Promise<ApiResponse<Array<{ id: string; type: string; value: number; description: string }>>> {
  try {
    return await apiClient.get('/economic/offers/active');
  } catch (error) {
    logger.error('economicEngineApi.getOffers', { error });
    throw error;
  }
}

/**
 * Get price alerts
 */
export async function setPriceAlert(productId: string, targetPrice: number): Promise<ApiResponse<{ alertId: string; success: boolean }>> {
  try {
    return await apiClient.post('/economic/alerts', { productId, targetPrice });
  } catch (error) {
    logger.error('economicEngineApi.setAlert', { productId, targetPrice, error });
    throw error;
  }
}

export default {
  getDynamicPrice,
  getPriceHistory,
  calculateOrderEconomics,
  getActiveOffers,
  setPriceAlert,
};
