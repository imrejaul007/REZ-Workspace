import { config } from '../config';
import { logger } from '../utils/logger';
import { INDUSTRY_VERTICALS } from '../types';

// Service URLs for each industry vertical
// In production, these would be discovered via service registry
const VERTICAL_SERVICE_URLS: Record<string, string> = {
  restaurant: process.env.RESTAURANT_SERVICE_URL || 'http://localhost:4001',
  spa: process.env.SPA_SERVICE_URL || 'http://localhost:4002',
  retail: process.env.RETAIL_SERVICE_URL || 'http://localhost:4003',
  hotel: process.env.HOTEL_SERVICE_URL || 'http://localhost:4004',
  travel: process.env.TRAVEL_SERVICE_URL || 'http://localhost:4005',
  transportation: process.env.TRANSPORTATION_SERVICE_URL || 'http://localhost:4006',
  entertainment: process.env.ENTERTAINMENT_SERVICE_URL || 'http://localhost:4007',
  healthcare: process.env.HEALTHCARE_SERVICE_URL || 'http://localhost:4008',
  fitness: process.env.FITNESS_SERVICE_URL || 'http://localhost:4009',
  beauty: process.env.BEAUTY_SERVICE_URL || 'http://localhost:4010',
  education: process.env.EDUCATION_SERVICE_URL || 'http://localhost:4011',
  automotive: process.env.AUTOMOTIVE_SERVICE_URL || 'http://localhost:4012',
  home_services: process.env.HOME_SERVICES_SERVICE_URL || 'http://localhost:4013',
  grocery: process.env.GROCERY_SERVICE_URL || 'http://localhost:4014',
  pharmacy: process.env.PHARMACY_SERVICE_URL || 'http://localhost:4015',
  events: process.env.EVENTS_SERVICE_URL || 'http://localhost:4016',
  gaming: process.env.GAMING_SERVICE_URL || 'http://localhost:4017'
};

// Service health status cache
const healthCache: Map<string, { healthy: boolean; lastChecked: Date }> = new Map();

/**
 * Get the service URL for a specific vertical
 */
export function getServiceUrl(vertical: string): string | null {
  const url = VERTICAL_SERVICE_URLS[vertical];
  if (!url) {
    logger.warn(`No service URL configured for vertical: ${vertical}`);
    return null;
  }
  return url;
}

/**
 * Check if a vertical service is available
 */
export async function isVerticalHealthy(vertical: string): Promise<boolean> {
  // Check cache first (5 minute TTL)
  const cached = healthCache.get(vertical);
  if (cached && Date.now() - cached.lastChecked.getTime() < 5 * 60 * 1000) {
    return cached.healthy;
  }

  const url = getServiceUrl(vertical);
  if (!url) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${url}/health/ready`, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeout);

    const healthy = response.ok;
    healthCache.set(vertical, { healthy, lastChecked: new Date() });
    return healthy;
  } catch (error) {
    healthCache.set(vertical, { healthy: false, lastChecked: new Date() });
    return false;
  }
}

/**
 * Verify a purchase/transaction with the source vertical service
 */
export async function verifyPurchase(
  vertical: string,
  sourceId: string,
  options: { merchantId?: string; userId?: string; amount?: number } = {}
): Promise<boolean> {
  const url = getServiceUrl(vertical);
  if (!url) {
    logger.warn(`Cannot verify purchase: no service for vertical ${vertical}`);
    return false;
  }

  try {
    const response = await fetch(`${url}/api/verify-loyalty`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': config.INTERNAL_TOKEN
      },
      body: JSON.stringify({
        sourceId,
        ...options
      }),
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      logger.warn(`Purchase verification failed for ${sourceId} in ${vertical}`);
      return false;
    }

    const data = await response.json();
    return data.valid === true;
  } catch (error) {
    logger.error(`Error verifying purchase ${sourceId}:`, error);
    // In case of error, we might want to be permissive
    // Change to `return false` if strict verification is required
    return true;
  }
}

/**
 * Notify a vertical service about loyalty activity
 */
export async function notifyVertical(
  vertical: string,
  event: 'points_earned' | 'points_redeemed' | 'transfer',
  data: {
    accountId: string;
    userId?: string;
    merchantId: string;
    points: number;
    transactionId: string;
    sourceId?: string;
  }
): Promise<boolean> {
  const url = getServiceUrl(vertical);
  if (!url) {
    return false;
  }

  try {
    const response = await fetch(`${url}/api/loyalty-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': config.INTERNAL_TOKEN
      },
      body: JSON.stringify({
        event: `loyalty.${event}`,
        timestamp: new Date().toISOString(),
        data
      }),
      signal: AbortSignal.timeout(5000)
    });

    return response.ok;
  } catch (error) {
    logger.error(`Error notifying vertical ${vertical}:`, error);
    return false;
  }
}

/**
 * Get available verticals with their health status
 */
export async function getVerticalsStatus(): Promise<Array<{
  vertical: string;
  url: string | null;
  healthy: boolean;
}>> {
  const results = await Promise.all(
    INDUSTRY_VERTICALS.map(async (vertical) => {
      const url = getServiceUrl(vertical);
      const healthy = url ? await isVerticalHealthy(vertical) : false;
      return { vertical, url, healthy };
    })
  );

  return results;
}

/**
 * Get cross-industry conversion rate from vertical service
 * This allows verticals to define their own conversion rates
 */
export async function getVerticalConversionRate(
  fromVertical: string,
  toVertical: string
): Promise<number | null> {
  const url = getServiceUrl(fromVertical);
  if (!url) {
    return null;
  }

  try {
    const response = await fetch(
      `${url}/api/conversion-rate?target=${toVertical}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': config.INTERNAL_TOKEN
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.rate || null;
  } catch (error) {
    return null;
  }
}

/**
 * Register this loyalty service with a vertical
 * Called during startup
 */
export async function registerWithVertical(vertical: string): Promise<boolean> {
  const url = getServiceUrl(vertical);
  if (!url) {
    return false;
  }

  try {
    const response = await fetch(`${url}/api/register-loyalty-service`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        serviceName: 'rez-cross-industry-loyalty-service',
        serviceUrl: `http://localhost:${config.PORT}`,
        capabilities: [
          'points_earn',
          'points_redeem',
          'points_transfer',
          'cross_industry_redemption',
          'tier_management'
        ]
      })
    });

    return response.ok;
  } catch (error) {
    logger.error(`Failed to register with vertical ${vertical}:`, error);
    return false;
  }
}

export default {
  getServiceUrl,
  isVerticalHealthy,
  verifyPurchase,
  notifyVertical,
  getVerticalsStatus,
  getVerticalConversionRate,
  registerWithVertical
};