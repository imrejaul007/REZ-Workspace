/**
 * PRICING ENGINE INTEGRATION
 * Connects Merchant Service to Dynamic Pricing Engine
 */

import axios from 'axios';
import { logger } from '../config/logger';

const PRICING_ENGINE_URL = process.env.PRICING_ENGINE_URL || 'http://localhost:4105';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

// Fail-closed: prevent calls if token is not configured
if (!INTERNAL_TOKEN) {
  throw new Error('INTERNAL_SERVICE_TOKEN environment variable is required for internal service authentication');
}

interface PriceCalculation {
  productId: string;
  merchantId: string;
  basePrice: number;
}

interface PriceRecommendation {
  productId: string;
  recommendedPrice: number;
  discount: number;
  reason: string;
}

interface InventoryAlert {
  productId: string;
  productName: string;
  stockLevel: number;
  maxStock: number;
  alertType: 'low_stock' | 'overstock' | 'expiry_soon';
  message: string;
}

interface OfferSuggestion {
  productId: string;
  productName: string;
  suggestedOffer: string;
  discount: number;
  reason: string;
}

// Demand forecast data structure
interface DemandForecastData {
  productId: string;
  predictedDemand: number;
  confidence: number;
  period: string;
}

// Pricing factors returned by the pricing engine
interface PricingFactors {
  demandFactor: number;
  competitorFactor: number;
  seasonalityFactor: number;
  inventoryFactor: number;
}

/**
 * Calculate dynamic price for a product
 */
export async function calculateDynamicPrice(
  productId: string,
  merchantId: string,
  basePrice: number
): Promise<{
  success: boolean;
  price?: number;
  discount?: number;
  factors?: PricingFactors;
  error?: string;
}> {
  try {
    const response = await axios.post(`${PRICING_ENGINE_URL}/api/price/calculate`, {
      productId,
      merchantId,
      basePrice,
    }, {
      headers: {
        'x-internal-token': INTERNAL_TOKEN,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });

    return response.data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Pricing] Calculate failed:', message);
    // Fallback to base price
    return { success: true, price: basePrice };
  }
}

/**
 * Get price recommendations for merchant's products
 */
export async function getPriceRecommendations(
  merchantId: string,
  storeId?: string
): Promise<PriceRecommendation[]> {
  try {
    const response = await axios.get(`${PRICING_ENGINE_URL}/api/price/recommend`, {
      params: { merchantId, storeId },
      headers: {
        'x-internal-token': INTERNAL_TOKEN,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    return response.data.recommendations || [];
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Pricing] Get recommendations failed:', message);
    return [];
  }
}

/**
 * Get inventory alerts for merchant
 */
export async function getInventoryAlerts(
  merchantId: string
): Promise<InventoryAlert[]> {
  try {
    const response = await axios.get(`${PRICING_ENGINE_URL}/api/inventory/alerts`, {
      params: { merchantId },
      headers: {
        'x-internal-token': INTERNAL_TOKEN,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    return response.data.alerts || [];
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Pricing] Get alerts failed:', message);
    return [];
  }
}

/**
 * Get offer suggestions based on inventory and demand
 */
export async function getOfferSuggestions(
  merchantId: string
): Promise<OfferSuggestion[]> {
  try {
    const response = await axios.get(`${PRICING_ENGINE_URL}/api/offers/suggest`, {
      params: { merchantId },
      headers: {
        'x-internal-token': INTERNAL_TOKEN,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    return response.data.suggestions || [];
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Pricing] Get suggestions failed:', message);
    return [];
  }
}

/**
 * Get demand forecast for products
 */
export async function getDemandForecast(
  productIds: string[],
  horizon: number = 24
): Promise<DemandForecastData[]> {
  try {
    const response = await axios.post(`${PRICING_ENGINE_URL}/api/demand/forecast`, {
      productIds,
      horizon,
    }, {
      headers: {
        'x-internal-token': INTERNAL_TOKEN,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    return (response.data.forecasts || []) as DemandForecastData[];
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Pricing] Get forecast failed:', message);
    return [];
  }
}

/**
 * Send inventory update to pricing engine
 */
export async function sendInventoryUpdate(
  merchantId: string,
  productId: string,
  stockLevel: number,
  expiryDate?: Date
): Promise<void> {
  try {
    await axios.post(`${PRICING_ENGINE_URL}/api/inventory/update`, {
      merchantId,
      productId,
      stockLevel,
      expiryDate,
    }, {
      headers: {
        'x-internal-token': INTERNAL_TOKEN,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Pricing] Inventory update failed:', message);
  }
}

/**
 * Send sales data to pricing engine for learning
 */
export async function sendSalesData(
  merchantId: string,
  productId: string,
  quantity: number,
  price: number,
  timestamp: Date
): Promise<void> {
  try {
    await axios.post(`${PRICING_ENGINE_URL}/api/sales/record`, {
      merchantId,
      productId,
      quantity,
      price,
      timestamp,
    }, {
      headers: {
        'x-internal-token': INTERNAL_TOKEN,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Pricing] Sales data failed:', message);
  }
}

/**
 * Get all AI suggestions for merchant dashboard
 */
export async function getMerchantAISuggestions(
  merchantId: string
): Promise<{
  priceRecommendations: PriceRecommendation[];
  inventoryAlerts: InventoryAlert[];
  offerSuggestions: OfferSuggestion[];
}> {
  const [prices, alerts, offers] = await Promise.all([
    getPriceRecommendations(merchantId),
    getInventoryAlerts(merchantId),
    getOfferSuggestions(merchantId),
  ]);

  return {
    priceRecommendations: prices,
    inventoryAlerts: alerts,
    offerSuggestions: offers,
  };
}
