/**
 * REZ App Services - Intelligence Integration
 *
 * Connects REZ Consumer app operations to REZ Consumer Intelligence
 * for unified user insights, recommendations, and cross-product analytics.
 *
 * @module services/intelligence
 */

// Types for the intelligence module
interface IntelligenceSignal {
  type: string;
  source: string;
  name: string;
  payload: Record<string, unknown>;
  priority: string;
}

interface IntelligenceStats {
  status: string;
  totalSignals: number;
}

interface RecommendationsResponse {
  products: unknown[];
}

interface UserInsights {
  // User insights structure
  [key: string]: unknown;
}

interface RezConsumerIntelligence {
  initialize: () => Promise<void>;
  emitSignal: (signal: IntelligenceSignal) => Promise<void>;
  recommendations: {
    getPersonalizedRecommendations: (userId: string, limit: number) => Promise<RecommendationsResponse>;
    getTrendingNow: (limit: number) => Promise<RecommendationsResponse>;
  };
  customers: {
    getUserInsights: (userId: string) => Promise<UserInsights>;
  };
  getStats: () => IntelligenceStats;
  shutdown: () => Promise<void>;
}

// Dynamic import with graceful fallback
let intel: RezConsumerIntelligence | null = null;
let initAttempted = false;

/**
 * Initialize REZ Consumer Intelligence
 * Falls back gracefully if the module is not available
 */
export async function initializeRezConsumerIntelligence(config?: {
  userId?: string;
}): Promise<RezConsumerIntelligence | null> {
  if (intel) return intel;
  if (initAttempted) return null;
  initAttempted = true;

  try {
    // Try to dynamically import the intelligence module
    const modulePath = '../../../../product-intelligence/rez-consumer-intelligence/src/index.js';
    const intelligenceModule = await import(/* webpackIgnore: true */ modulePath);
    intel = intelligenceModule.createRezConsumerIntelligence(config);
    await intel.initialize();
    console.log('✅ REZ Consumer Intelligence initialized');
    return intel;
  } catch (error) {
    // Module not available - this is expected in development
    console.log('ℹ️ REZ Consumer Intelligence not available (module path not found)');
    console.log('   Intelligence features will be disabled. This is expected in development.');
    return null;
  }
}

/**
 * Get intelligence instance
 */
export function getRezConsumerIntelligence(): RezConsumerIntelligence | null {
  return intel;
}

// ============================================
// ORDER HOOKS
// ============================================

/**
 * Emit when order is placed
 */
export async function onOrderPlaced(params: {
  orderId: string;
  userId: string;
  items: Array<{ productId: string; name: string; quantity: number; price: number }>;
  total: number;
  paymentMethod: string;
  deliveryType: string;
}): Promise<void> {
  if (!intel) return;

  await intel.emitSignal({
    type: 'user_action',
    source: 'rez-app',
    name: 'order_placed',
    payload: params,
    priority: 'high',
  });
}

/**
 * Emit when order is delivered
 */
export async function onOrderDelivered(params: {
  orderId: string;
  userId: string;
  deliveredAt: Date;
}): Promise<void> {
  if (!intel) return;

  await intel.emitSignal({
    type: 'user_action',
    source: 'rez-app',
    name: 'order_delivered',
    payload: params,
    priority: 'medium',
  });
}

/**
 * Emit when order is cancelled
 */
export async function onOrderCancelled(params: {
  orderId: string;
  userId: string;
  reason: string;
}): Promise<void> {
  if (!intel) return;

  await intel.emitSignal({
    type: 'user_action',
    source: 'rez-app',
    name: 'order_cancelled',
    payload: params,
    priority: 'medium',
  });
}

// ============================================
// CART HOOKS
// ============================================

/**
 * Emit when item is added to cart
 */
export async function onAddedToCart(params: {
  userId: string;
  productId: string;
  quantity: number;
  price: number;
}): Promise<void> {
  if (!intel) return;

  await intel.emitSignal({
    type: 'user_action',
    source: 'rez-app',
    name: 'added_to_cart',
    payload: params,
    priority: 'low',
  });
}

/**
 * Emit when cart is abandoned
 */
export async function onCartAbandoned(params: {
  userId: string;
  items: Array<{ productId: string; quantity: number; price: number }>;
  total: number;
}): Promise<void> {
  if (!intel) return;

  await intel.emitSignal({
    type: 'user_action',
    source: 'rez-app',
    name: 'cart_abandoned',
    payload: params,
    priority: 'medium',
  });
}

// ============================================
// WISHLIST HOOKS
// ============================================

/**
 * Emit when item is added to wishlist
 */
export async function onAddedToWishlist(params: {
  userId: string;
  productId: string;
}): Promise<void> {
  if (!intel) return;

  await intel.emitSignal({
    type: 'user_action',
    source: 'rez-app',
    name: 'added_to_wishlist',
    payload: params,
    priority: 'low',
  });
}

// ============================================
// PRODUCT HOOKS
// ============================================

/**
 * Emit when product is viewed
 */
export async function onProductViewed(params: {
  userId?: string;
  productId: string;
  source: 'search' | 'recommendation' | 'category' | 'external';
}): Promise<void> {
  if (!intel) return;

  await intel.emitSignal({
    type: 'user_action',
    source: 'rez-app',
    name: 'product_viewed',
    payload: params,
    priority: 'low',
  });
}

/**
 * Emit when product is searched
 */
export async function onProductSearched(params: {
  userId?: string;
  query: string;
  resultCount: number;
  filters?: Record<string, unknown>;
}): Promise<void> {
  if (!intel) return;

  await intel.emitSignal({
    type: 'user_action',
    source: 'rez-app',
    name: 'product_searched',
    payload: params,
    priority: 'low',
  });
}

// ============================================
// REVIEW HOOKS
// ============================================

/**
 * Emit when review is posted
 */
export async function onReviewPosted(params: {
  reviewId: string;
  userId: string;
  productId: string;
  rating: number;
  title: string;
}): Promise<void> {
  if (!intel) return;

  await intel.emitSignal({
    type: 'user_action',
    source: 'rez-app',
    name: 'review_posted',
    payload: params,
    priority: 'medium',
  });
}

// ============================================
// RECOMMENDATIONS
// ============================================

/**
 * Get personalized recommendations
 */
export async function getPersonalizedRecommendations(userId: string, limit: number = 10): Promise<unknown[]> {
  if (!intel) {
    console.log('Intel not initialized, skipping recommendations');
    return [];
  }

  try {
    const rec = await intel.recommendations.getPersonalizedRecommendations(userId, limit);
    return rec.products;
  } catch (error) {
    console.error('Failed to get recommendations:', error);
    return [];
  }
}

/**
 * Get trending products
 */
export async function getTrendingProducts(limit: number = 10): Promise<unknown[]> {
  if (!intel) {
    console.log('Intel not initialized, skipping trending products');
    return [];
  }

  try {
    const rec = await intel.recommendations.getTrendingNow(limit);
    return rec.products;
  } catch (error) {
    console.error('Failed to get trending:', error);
    return [];
  }
}

// ============================================
// USER INSIGHTS
// ============================================

/**
 * Get user insights
 */
export async function getUserInsights(userId: string): Promise<UserInsights | null> {
  if (!intel) {
    console.log('Intel not initialized, skipping user insights');
    return null;
  }

  try {
    return await intel.customers.getUserInsights(userId);
  } catch (error) {
    console.error('Failed to get user insights:', error);
    return null;
  }
}

// ============================================
// UTILITIES
// ============================================

export function getIntelligenceStats(): IntelligenceStats {
  if (!intel) return { status: 'not_initialized', totalSignals: 0 };
  return intel.getStats();
}

export async function shutdownRezConsumerIntelligence(): Promise<void> {
  if (intel) {
    await intel.shutdown();
    intel = null;
    console.log('🛑 REZ Consumer Intelligence shutdown');
  }
}
