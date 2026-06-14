/**
 * Order Service Client
 *
 * Provides methods for the ads service to communicate with the order service.
 * Uses internal service tokens for authentication (X-Internal-Token header).
 *
 * Security: Uses crypto.timingSafeEqual for constant-time token comparison
 * to prevent timing attacks.
 */

import crypto from 'crypto';
import { getOrderServiceConfig, validateOrderServiceConfig } from '../config/orderServiceConfig';
import { logger } from '../config/logger';

const INTERNAL_TOKEN_HEADER = 'x-internal-token';
const REQUEST_TIMEOUT_DEFAULT_MS = 5000;

/**
 * Order service response interfaces
 */
export interface OrderServiceResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  statusCode?: number;
}

export interface MerchantOrderStats {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
}

export interface CampaignRevenue {
  merchantId: string;
  totalRevenue: number;
  orderCount: number;
  avgOrderValue: number;
}

/**
 * Timing-safe token comparison to prevent timing attacks
 */
function secureCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  // Use constant-time comparison via crypto.timingSafeEqual
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  // If lengths differ, still perform a comparison to maintain constant time
  if (bufA.length !== bufB.length) {
    // Compare against itself to maintain constant time
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Validate the provided token against the configured token
 * Uses constant-time comparison to prevent timing attacks
 */
function validateToken(providedToken: string, configuredToken: string): boolean {
  if (!providedToken || !configuredToken) {
    return false;
  }
  return secureCompare(providedToken, configuredToken);
}

/**
 * Create headers for order service requests
 */
function createRequestHeaders(token: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    [INTERNAL_TOKEN_HEADER]: token,
    'X-Requesting-Service': 'ads-service',
  };
}

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_DEFAULT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Check if the order service is available
 */
export async function isOrderServiceAvailable(): Promise<boolean> {
  const config = getOrderServiceConfig();

  if (!config.baseUrl) {
    logger.debug('[OrderServiceClient] ORDER_SERVICE_URL not configured');
    return false;
  }

  if (!config.token) {
    logger.debug('[OrderServiceClient] No order service token configured');
    return false;
  }

  try {
    const healthUrl = `${config.baseUrl}/health/ready`;
    const response = await fetchWithTimeout(healthUrl, {
      method: 'GET',
      headers: createRequestHeaders(config.token),
    }, 3000);

    return response.ok;
  } catch (error) {
    logger.debug('[OrderServiceClient] Order service health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Fetch order statistics for a merchant
 *
 * @param merchantId - The merchant's ObjectId as a string
 * @returns Merchant order statistics or null if unavailable
 */
export async function getMerchantOrderStats(merchantId: string): Promise<MerchantOrderStats | null> {
  const config = getOrderServiceConfig();

  const validationError = validateOrderServiceConfig();
  if (validationError) {
    logger.debug('[OrderServiceClient] ' + validationError);
    return null;
  }

  try {
    const url = `${config.baseUrl}/orders/stats/${merchantId}`;
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: createRequestHeaders(config.token),
    }, config.timeoutMs);

    if (!response.ok) {
      logger.warn('[OrderServiceClient] Failed to fetch merchant stats', {
        merchantId,
        status: response.status,
      });
      return null;
    }

    const data = await response.json() as OrderServiceResponse<MerchantOrderStats>;

    if (!data.success || !data.data) {
      logger.warn('[OrderServiceClient] Invalid response from order service', {
        merchantId,
        success: data.success,
      });
      return null;
    }

    return data.data;
  } catch (error) {
    logger.warn('[OrderServiceClient] Error fetching merchant order stats', {
      merchantId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Fetch actual campaign revenue from order service
 *
 * This function queries the order service to get real revenue data for a campaign
 * based on the merchant's order history. It is used to replace estimated revenue
 * calculations with actual transaction data.
 *
 * @param campaignId - The ad campaign ObjectId as a string
 * @param merchantId - The merchant's ObjectId as a string (used to look up orders)
 * @returns Campaign revenue data or null if order service is unavailable
 */
export async function fetchCampaignRevenue(
  campaignId: string,
  merchantId: string
): Promise<CampaignRevenue | null> {
  const config = getOrderServiceConfig();

  const validationError = validateOrderServiceConfig();
  if (validationError) {
    logger.debug('[OrderServiceClient] ' + validationError);
    return null;
  }

  if (!merchantId) {
    logger.debug('[OrderServiceClient] No merchantId provided for revenue lookup');
    return null;
  }

  try {
    // Fetch merchant order stats from order service
    const stats = await getMerchantOrderStats(merchantId);

    if (!stats) {
      logger.debug('[OrderServiceClient] Could not fetch order stats for merchant', { merchantId });
      return null;
    }

    // Calculate campaign revenue based on actual order data
    // Note: This returns total merchant revenue. For campaign-attributed revenue,
    // the attribution service tracks which orders came from which campaigns.
    const revenue: CampaignRevenue = {
      merchantId,
      totalRevenue: stats.totalRevenue,
      orderCount: stats.totalOrders,
      avgOrderValue: stats.avgOrderValue,
    };

    logger.info('[OrderServiceClient] Fetched campaign revenue from order service', {
      campaignId,
      merchantId,
      totalRevenue: revenue.totalRevenue,
      orderCount: revenue.orderCount,
    });

    return revenue;
  } catch (error) {
    logger.warn('[OrderServiceClient] Error fetching campaign revenue', {
      campaignId,
      merchantId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Order service client singleton
 */
class OrderServiceClient {
  private available: boolean | null = null;
  private lastAvailabilityCheck: number = 0;
  private availabilityCacheTtlMs = 60000; // Cache availability for 1 minute

  /**
   * Check if the order service is available with caching
   */
  async checkAvailability(): Promise<boolean> {
    const now = Date.now();

    // Return cached result if still valid
    if (this.available !== null && (now - this.lastAvailabilityCheck) < this.availabilityCacheTtlMs) {
      return this.available;
    }

    this.available = await isOrderServiceAvailable();
    this.lastAvailabilityCheck = now;

    return this.available;
  }

  /**
   * Get campaign revenue from order service
   *
   * Falls back to null if order service is unavailable,
   * allowing the caller to use estimated revenue instead.
   */
  async getCampaignRevenue(campaignId: string, merchantId: string): Promise<CampaignRevenue | null> {
    // Quick availability check
    const isAvailable = await this.checkAvailability();
    if (!isAvailable) {
      logger.debug('[OrderServiceClient] Order service not available, skipping revenue fetch');
      return null;
    }

    return fetchCampaignRevenue(campaignId, merchantId);
  }

  /**
   * Get merchant order statistics
   */
  async getMerchantStats(merchantId: string): Promise<MerchantOrderStats | null> {
    const isAvailable = await this.checkAvailability();
    if (!isAvailable) {
      return null;
    }

    return getMerchantOrderStats(merchantId);
  }

  /**
   * Invalidate the availability cache
   */
  invalidateCache(): void {
    this.available = null;
    this.lastAvailabilityCheck = 0;
  }
}

// Singleton instance
export const orderServiceClient = new OrderServiceClient();
