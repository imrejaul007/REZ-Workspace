/**
 * INTENT GRAPH API SERVICE
 * Integration with REZ Intent Graph (REZ-Intelligence)
 *
 * Service: rez-intent-graph
 * Port: 3001
 * URL: https://rez-intent-graph.onrender.com
 *
 * Features:
 * - Intent signal capture
 * - User intent tracking
 * - AI-powered recommendations
 * - Commerce memory
 * - Personalization
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

// ============================================================================
// TYPES
// ============================================================================

export type IntentSignal =
  | 'search'
  | 'view'
  | 'wishlist'
  | 'add_to_cart'
  | 'purchase'
  | 'booking_confirmed'
  | 'cancelled'
  | 'refunded'
  | 'fulfilled'
  | 'share';

export interface IntentCapture {
  userId: string;
  signal: IntentSignal;
  entityType: EntityType;
  entityId: string;
  metadata?: Record<string, unknown>;
  context?: IntentContext;
  timestamp?: string;
}

export type EntityType =
  | 'product'
  | 'category'
  | 'store'
  | 'brand'
  | 'service'
  | 'content'
  | 'booking'
  | 'user'
  | 'search_query';

export interface IntentContext {
  source?: 'app' | 'web' | 'notification' | 'email' | 'deeplink';
  sessionId?: string;
  page?: string;
  referrer?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface UserIntentProfile {
  userId: string;
  preferences: UserPreferences;
  affinities: Affinity[];
  recentIntents: RecentIntent[];
  predictedIntents: PredictedIntent[];
  engagementScore: number;
  updatedAt: string;
}

export interface UserPreferences {
  categories: string[];
  brands: string[];
  priceRange: { min: number; max: number };
  attributes: Record<string, string[]>;
}

export interface Affinity {
  entityType: EntityType;
  entityId: string;
  entityName: string;
  score: number;
  signals: IntentSignal[];
  lastSignal: string;
}

export interface RecentIntent {
  entityType: EntityType;
  entityId: string;
  signal: IntentSignal;
  timestamp: string;
}

export interface PredictedIntent {
  entityType: EntityType;
  entityId: string;
  probability: number;
  timeframe: 'immediate' | 'short_term' | 'long_term';
  reason?: string;
}

export interface IntentRecommendation {
  id: string;
  entityType: EntityType;
  entityId: string;
  score: number;
  reason: string;
  intentSignal?: IntentSignal;
  variant?: string; // A/B test variant
}

export interface IntentSearchResult {
  results: IntentRecommendation[];
  query: string;
  filters?: Record<string, unknown>;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface IntentTrend {
  entityType: EntityType;
  entityId: string;
  trend: 'rising' | 'falling' | 'stable';
  changePercent: number;
  signals: number;
  period: string;
}

export interface CommerceMemory {
  userId: string;
  browsingHistory: BrowsingHistoryItem[];
  purchaseHistory: PurchaseHistoryItem[];
  preferences: CommercePreferences;
  lifetime: {
    totalOrders: number;
    totalSpent: number;
    avgOrderValue: number;
    favoriteCategories: string[];
    favoriteStores: string[];
  };
}

export interface BrowsingHistoryItem {
  entityType: EntityType;
  entityId: string;
  timestamp: string;
  duration?: number;
  source?: string;
}

export interface PurchaseHistoryItem {
  entityType: EntityType;
  entityId: string;
  timestamp: string;
  amount: number;
  quantity?: number;
}

export interface CommercePreferences {
  categories: CategoryPreference[];
  priceRange: { min: number; max: number };
  brands: string[];
  attributes: Record<string, string[]>;
  shippingAddresses: ShippingAddress[];
}

export interface CategoryPreference {
  categoryId: string;
  categoryName: string;
  score: number;
  purchaseFrequency: number;
}

export interface ShippingAddress {
  id: string;
  label: string;
  address: string;
  coordinates?: { lat: number; lng: number };
}

export interface PersonalizationConfig {
  userId: string;
  features: {
    recommendations: boolean;
    searchRanking: boolean;
    notifications: boolean;
    pricing: boolean;
  };
  limits: {
    maxRecommendations: number;
    searchBoostDays: number;
  };
}

// ============================================================================
// INTENT CAPTURE API
// ============================================================================

/**
 * Capture user intent signal
 */
export async function captureIntent(intent: IntentCapture): Promise<ApiResponse<{ success: boolean }>> {
  try {
    return await apiClient.post('/intent/capture', {
      ...intent,
      timestamp: intent.timestamp || new Date().toISOString(),
    });
  } catch (error) {
    logger.error('intentGraphApi.captureIntent', { intent, error });
    // Don't throw - intent capture should not break the app
    return { success: false, error: 'Failed to capture intent' };
  }
}

/**
 * Capture multiple intents at once (batch)
 */
export async function captureIntents(
  intents: IntentCapture[]
): Promise<ApiResponse<{ success: boolean }>> {
  try {
    return await apiClient.post('/intent/capture/batch', {
      intents: intents.map((i) => ({
        ...i,
        timestamp: i.timestamp || new Date().toISOString(),
      })),
    });
  } catch (error) {
    logger.error('intentGraphApi.captureIntents', { count: intents.length, error });
    return { success: false, error: 'Failed to capture intents' };
  }
}

/**
 * Search intent
 */
export async function searchIntent(
  query: string,
  params?: {
    page?: number;
    limit?: number;
    entityTypes?: EntityType[];
    filters?: Record<string, unknown>;
  }
): Promise<ApiResponse<IntentSearchResult>> {
  try {
    const queryParams = new URLSearchParams({ q: query });
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.entityTypes) queryParams.set('entityTypes', params.entityTypes.join(','));
    return await apiClient.get(`/intent/search?${queryParams.toString()}`);
  } catch (error) {
    logger.error('intentGraphApi.searchIntent', { query, params, error });
    throw error;
  }
}

// ============================================================================
// USER PROFILE API
// ============================================================================

/**
 * Get user intent profile
 */
export async function getUserIntentProfile(
  userId: string
): Promise<ApiResponse<UserIntentProfile>> {
  try {
    return await apiClient.get(`/intent/profile/${userId}`);
  } catch (error) {
    logger.error('intentGraphApi.getUserProfile', { userId, error });
    throw error;
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<ApiResponse<UserIntentProfile>> {
  try {
    return await apiClient.patch(`/intent/profile/${userId}/preferences`, preferences);
  } catch (error) {
    logger.error('intentGraphApi.updatePreferences', { userId, preferences, error });
    throw error;
  }
}

/**
 * Get user affinities
 */
export async function getUserAffinities(
  userId: string,
  params?: { entityType?: EntityType; limit?: number }
): Promise<ApiResponse<Affinity[]>> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.entityType) queryParams.set('entityType', params.entityType);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    const query = queryParams.toString();
    return await apiClient.get(`/intent/profile/${userId}/affinities${query ? `?${query}` : ''}`);
  } catch (error) {
    logger.error('intentGraphApi.getAffinities', { userId, params, error });
    throw error;
  }
}

/**
 * Get predicted intents
 */
export async function getPredictedIntents(
  userId: string,
  params?: { timeframe?: 'immediate' | 'short_term' | 'long_term'; limit?: number }
): Promise<ApiResponse<PredictedIntent[]>> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.timeframe) queryParams.set('timeframe', params.timeframe);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    const query = queryParams.toString();
    return await apiClient.get(`/intent/profile/${userId}/predictions${query ? `?${query}` : ''}`);
  } catch (error) {
    logger.error('intentGraphApi.getPredictions', { userId, params, error });
    throw error;
  }
}

// ============================================================================
// RECOMMENDATIONS API
// ============================================================================

/**
 * Get personalized recommendations
 */
export async function getRecommendations(
  userId: string,
  params?: {
    entityType?: EntityType;
    limit?: number;
    context?: IntentContext;
    excludeIds?: string[];
  }
): Promise<ApiResponse<IntentRecommendation[]>> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.entityType) queryParams.set('entityType', params.entityType);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.excludeIds) queryParams.set('excludeIds', params.excludeIds.join(','));
    const query = queryParams.toString();
    return await apiClient.get(`/intent/recommendations/${userId}${query ? `?${query}` : ''}`);
  } catch (error) {
    logger.error('intentGraphApi.getRecommendations', { userId, params, error });
    throw error;
  }
}

/**
 * Get recommendations for a specific context
 */
export async function getContextRecommendations(
  userId: string,
  context: {
    entityType: EntityType;
    entityId: string;
    signal: IntentSignal;
  },
  params?: { limit?: number }
): Promise<ApiResponse<IntentRecommendation[]>> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    const query = queryParams.toString();
    return await apiClient.post(
      `/intent/recommendations/${userId}/context${query ? `?${query}` : ''}`,
      context
    );
  } catch (error) {
    logger.error('intentGraphApi.getContextRecommendations', { userId, context, error });
    throw error;
  }
}

/**
 * Get "users also viewed/bought" recommendations
 */
export async function getCollaborativeRecommendations(
  entityType: EntityType,
  entityId: string,
  params?: { limit?: number }
): Promise<ApiResponse<IntentRecommendation[]>> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    const query = queryParams.toString();
    return await apiClient.get(`/intent/recommendations/similar/${entityType}/${entityId}${query ? `?${query}` : ''}`);
  } catch (error) {
    logger.error('intentGraphApi.getCollaborativeRecommendations', { entityType, entityId, error });
    throw error;
  }
}

/**
 * Get trending items
 */
export async function getTrendingItems(
  entityType: EntityType,
  params?: { limit?: number; period?: string }
): Promise<ApiResponse<IntentTrend[]>> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.period) queryParams.set('period', params.period);
    const query = queryParams.toString();
    return await apiClient.get(`/intent/trending/${entityType}${query ? `?${query}` : ''}`);
  } catch (error) {
    logger.error('intentGraphApi.getTrending', { entityType, error });
    throw error;
  }
}

/**
 * Get personalized search results
 */
export async function getPersonalizedSearch(
  userId: string,
  query: string,
  params?: {
    entityType?: EntityType;
    limit?: number;
    boostRecent?: boolean;
  }
): Promise<ApiResponse<IntentSearchResult>> {
  try {
    const queryParams = new URLSearchParams({ q: query });
    if (params?.entityType) queryParams.set('entityType', params.entityType);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.boostRecent !== undefined) queryParams.set('boostRecent', params.boostRecent.toString());
    return await apiClient.get(`/intent/search/personalized/${userId}?${queryParams.toString()}`);
  } catch (error) {
    logger.error('intentGraphApi.getPersonalizedSearch', { userId, query, error });
    throw error;
  }
}

// ============================================================================
// COMMERCE MEMORY API
// ============================================================================

/**
 * Get user commerce memory
 */
export async function getCommerceMemory(
  userId: string
): Promise<ApiResponse<CommerceMemory>> {
  try {
    return await apiClient.get(`/intent/memory/${userId}`);
  } catch (error) {
    logger.error('intentGraphApi.getCommerceMemory', { userId, error });
    throw error;
  }
}

/**
 * Get browsing history
 */
export async function getBrowsingHistory(
  userId: string,
  params?: { limit?: number; startDate?: string; endDate?: string }
): Promise<ApiResponse<BrowsingHistoryItem[]>> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);
    const query = queryParams.toString();
    return await apiClient.get(`/intent/memory/${userId}/browsing${query ? `?${query}` : ''}`);
  } catch (error) {
    logger.error('intentGraphApi.getBrowsingHistory', { userId, error });
    throw error;
  }
}

/**
 * Get purchase history
 */
export async function getPurchaseHistory(
  userId: string,
  params?: { limit?: number; startDate?: string; endDate?: string }
): Promise<ApiResponse<PurchaseHistoryItem[]>> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);
    const query = queryParams.toString();
    return await apiClient.get(`/intent/memory/${userId}/purchases${query ? `?${query}` : ''}`);
  } catch (error) {
    logger.error('intentGraphApi.getPurchaseHistory', { userId, error });
    throw error;
  }
}

// ============================================================================
// PERSONALIZATION API
// ============================================================================

/**
 * Get personalization config
 */
export async function getPersonalizationConfig(
  userId: string
): Promise<ApiResponse<PersonalizationConfig>> {
  try {
    return await apiClient.get(`/intent/personalization/${userId}/config`);
  } catch (error) {
    logger.error('intentGraphApi.getPersonalizationConfig', { userId, error });
    throw error;
  }
}

/**
 * Update personalization config
 */
export async function updatePersonalizationConfig(
  userId: string,
  config: Partial<PersonalizationConfig>
): Promise<ApiResponse<PersonalizationConfig>> {
  try {
    return await apiClient.patch(`/intent/personalization/${userId}/config`, config);
  } catch (error) {
    logger.error('intentGraphApi.updatePersonalizationConfig', { userId, config, error });
    throw error;
  }
}

/**
 * Opt out of personalization
 */
export async function optOutPersonalization(
  userId: string
): Promise<ApiResponse<{ success: boolean }>> {
  try {
    return await apiClient.post(`/intent/personalization/${userId}/opt-out`, {});
  } catch (error) {
    logger.error('intentGraphApi.optOutPersonalization', { userId, error });
    throw error;
  }
}

/**
 * Opt in to personalization
 */
export async function optInPersonalization(
  userId: string
): Promise<ApiResponse<{ success: boolean }>> {
  try {
    return await apiClient.post(`/intent/personalization/${userId}/opt-in`, {});
  } catch (error) {
    logger.error('intentGraphApi.optInPersonalization', { userId, error });
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Quick intent capture helper for common signals
 */
export function quickCapture(
  userId: string,
  signal: IntentSignal,
  entityType: EntityType,
  entityId: string,
  metadata?: Record<string, unknown>
): void {
  captureIntent({ userId, signal, entityType, entityId, metadata }).catch(() => {
    // Silent fail - intent capture should not break the app
  });
}

/**
 * Track product view
 */
export function trackProductView(userId: string, productId: string, storeId?: string): void {
  quickCapture(userId, 'view', 'product', productId, { storeId });
}

/**
 * Track add to cart
 */
export function trackAddToCart(userId: string, productId: string, quantity: number): void {
  quickCapture(userId, 'add_to_cart', 'product', productId, { quantity });
}

/**
 * Track purchase
 */
export function trackPurchase(userId: string, orderId: string, amount: number): void {
  quickCapture(userId, 'purchase', 'booking', orderId, { amount });
}

/**
 * Track search
 */
export function trackSearch(userId: string, query: string): void {
  quickCapture(userId, 'search', 'search_query', query, { query });
}

export default {
  // Intent Capture
  captureIntent,
  captureIntents,
  searchIntent,
  // User Profile
  getUserIntentProfile,
  updateUserPreferences,
  getUserAffinities,
  getPredictedIntents,
  // Recommendations
  getRecommendations,
  getContextRecommendations,
  getCollaborativeRecommendations,
  getTrendingItems,
  getPersonalizedSearch,
  // Commerce Memory
  getCommerceMemory,
  getBrowsingHistory,
  getPurchaseHistory,
  // Personalization
  getPersonalizationConfig,
  updatePersonalizationConfig,
  optOutPersonalization,
  optInPersonalization,
  // Helpers
  quickCapture,
  trackProductView,
  trackAddToCart,
  trackPurchase,
  trackSearch,
};
