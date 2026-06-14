/**
 * REZ Unified Service - Intelligence Integration
 *
 * Connects unified service operations to Company Intelligence
 * for cross-product insights and analytics.
 */

import { createRezCommerceIntelligence, RezCommerceIntelligence } from '../../../../../product-intelligence/company-intelligence/rez-commerce-intelligence/src/index.js';

let intel: RezCommerceIntelligence | null = null;

/**
 * Initialize REZ Commerce Company Intelligence
 */
export async function initializeRezCommerceIntelligence(): Promise<RezCommerceIntelligence> {
  if (intel) return intel;

  try {
    intel = createRezCommerceIntelligence();
    await intel.initialize();
    console.log('✅ REZ Commerce Intelligence initialized');
    return intel;
  } catch (error) {
    console.error('Failed to initialize REZ Commerce Intelligence:', error);
    return null as any;
  }
}

/**
 * Get intelligence instance
 */
export function getRezCommerceIntelligence(): RezCommerceIntelligence | null {
  return intel;
}

// ============================================
// CROSS-PRODUCT SIGNALS
// ============================================

/**
 * Emit cross-product order signal
 */
export async function emitCrossProductOrder(params: {
  userId: string;
  sourceProduct: 'merchant' | 'consumer' | 'airzy' | 'buzzlocal';
  orderId: string;
  total: number;
  category: string;
}): Promise<void> {
  if (!intel) return;

  await intel.receiveSignal({
    id: `sig_${Date.now()}`,
    type: 'user_action',
    source: params.sourceProduct,
    name: 'cross_product_order',
    payload: params,
    priority: 'high',
    timestamp: new Date(),
  });
}

/**
 * Emit user cross-product activity
 */
export async function emitCrossProductActivity(params: {
  userId: string;
  product: string;
  action: string;
  value?: number;
}): Promise<void> {
  if (!intel) return;

  await intel.receiveSignal({
    id: `sig_${Date.now()}`,
    type: 'user_action',
    source: params.product,
    name: 'cross_product_activity',
    payload: params,
    priority: 'low',
    timestamp: new Date(),
  });
}

// ============================================
// ANALYTICS
// ============================================

/**
 * Get unified analytics
 */
export async function getUnifiedAnalytics(startDate: Date, endDate: Date) {
  if (!intel) return null;

  try {
    return await intel.getUnifiedAnalytics({ start: startDate, end: endDate });
  } catch (error) {
    console.error('Failed to get unified analytics:', error);
    return null;
  }
}

/**
 * Generate cross-product insights
 */
export async function generateCrossProductInsights() {
  if (!intel) return [];

  try {
    return await intel.generateCrossProductInsights();
  } catch (error) {
    console.error('Failed to generate insights:', error);
    return [];
  }
}

// ============================================
// UTILITIES
// ============================================

export function getIntelligenceStats() {
  if (!intel) return { status: 'not_initialized', totalSignals: 0 };
  return intel.getStats();
}

export async function shutdownRezCommerceIntelligence() {
  if (intel) {
    await intel.shutdown();
    intel = null;
    console.log('🛑 REZ Commerce Intelligence shutdown');
  }
}
