/**
 * REZ Merchant Intelligence Aggregator - Product Intelligence Integration
 *
 * Connects to @hojai/rez-merchant-intelligence for:
 * - Cross-merchant signal aggregation
 * - Unified order insights
 * - Demand forecasting across merchants
 */

import { createRezMerchantIntelligence, RezMerchantIntelligence } from '../../../../../product-intelligence/rez-merchant-intelligence/src/index.js';

let intel: RezMerchantIntelligence | null = null;

/**
 * Initialize the REZ Merchant Intelligence layer
 */
export async function initializeMerchantIntelligence(config?: {
  merchantId?: string;
  merchantName?: string;
}): Promise<RezMerchantIntelligence> {
  if (intel) return intel;

  try {
    intel = createRezMerchantIntelligence({
      merchantId: config?.merchantId || 'aggregator',
      merchantName: config?.merchantName || 'REZ Merchant Aggregator',
      type: 'restaurant',
      location: { lat: 0, lng: 0 },
    });

    await intel.initialize();
    console.log('✅ REZ Merchant Intelligence initialized');
    return intel;
  } catch (error) {
    console.error('Failed to initialize Merchant Intelligence:', error);
    return null as any;
  }
}

/**
 * Get the intelligence instance
 */
export function getMerchantIntelligence(): RezMerchantIntelligence | null {
  return intel;
}

/**
 * Aggregate signals from multiple merchants
 */
export async function aggregateMerchantSignals() {
  if (!intel) return;

  // Get insights from all connected merchants
  const insights = await intel.demand.forecastForHours(24);

  console.log('📊 Demand forecast aggregated:', {
    merchantCount: 1, // Would be multiple in production
    peakHours: insights.peakHours.map(h => `${h.hour}:00 - ${h.avgOrders} orders`),
  });

  return insights;
}

/**
 * Emit cross-merchant insight signal
 */
export async function emitCrossMerchantInsight(params: {
  type: 'demand_spike' | 'inventory_alert' | 'pricing_opportunity';
  affectedMerchants: string[];
  data: Record<string, unknown>;
}) {
  if (!intel) return;

  await intel.emitSignal({
    type: 'insight',
    source: 'merchant-aggregator',
    name: `cross_merchant_${params.type}`,
    payload: params,
    priority: 'medium',
  });
}

/**
 * Get aggregated stats
 */
export function getAggregatedStats() {
  if (!intel) {
    return { status: 'not_initialized', totalSignals: 0 };
  }
  return intel.getStats();
}

/**
 * Shutdown
 */
export async function shutdownMerchantIntelligence() {
  if (intel) {
    await intel.shutdown();
    intel = null;
    console.log('🛑 REZ Merchant Intelligence shutdown');
  }
}
