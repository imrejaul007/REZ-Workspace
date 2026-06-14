// @ts-nocheck
/**
 * TASTE PROFILE API SERVICE
 * Integration with REZ-taste-profile (REZ-Intelligence)
 *
 * Service: REZ-taste-profile
 * Port: 4041
 * URL: https://rez-taste-profile.onrender.com
 *
 * Features:
 * - Consumer taste and preference intelligence
 * - Behavioral scores (adventurousness, brand loyalty, value consciousness)
 * - Time/location patterns
 * - Personalization context
 * - Batch order processing
 *
 * Integration Points:
 * - Homepage recommendations
 * - Product suggestions
 * - Search personalization
 * - Ad targeting
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

// ============================================================================
// TYPES
// ============================================================================

export type TasteCategory =
  | 'food'
  | 'retail'
  | 'hospitality'
  | 'entertainment'
  | 'travel'
  | 'health'
  | 'beauty'
  | 'fitness';

export interface BehavioralScore {
  adventurousness: number; // 0-100, how willing to try new things
  brandLoyalty: number; // 0-100, tendency to stick with brands
  valueConsciousness: number; // 0-100, sensitivity to deals/discounts
  impulseBuying: number; // 0-100, tendency for unplanned purchases
  qualityOverPrice: number; // 0-100, prefers quality over deals
}

export interface TimePattern {
  dayOfWeek: number; // 0-6, Sunday = 0
  hourOfDay: number; // 0-23
  frequency: number; // visits per week
  avgOrderValue: number;
}

export interface LocationPattern {
  areaType: 'residential' | 'commercial' | 'mixed' | 'travel';
  avgDistance: number; // km from home
  preferredZones: string[];
}

export interface CategoryAffinity {
  category: string;
  score: number; // 0-100
  avgOrderValue: number;
  purchaseFrequency: number; // orders per month
  lastPurchase: string; // ISO date
  tags: string[]; // e.g., ['organic', 'premium', 'budget']
}

export interface TasteProfile {
  userId: string;
  overallScore: number; // 0-100
  behavioralScores: BehavioralScore;
  topCategories: CategoryAffinity[];
  timePatterns: TimePattern[];
  locationPatterns: LocationPattern[];
  discoveredPreferences: string[]; // AI-discovered preferences
  seasonalPatterns: Record<string, number>; // month -> score
  engagementLevel: 'low' | 'medium' | 'high' | 'super';
  updatedAt: string;
}

export interface TasteContext {
  userId: string;
  currentContext: {
    location?: { latitude: number; longitude: number };
    time?: Date;
    recentSearches?: string[];
    viewedProducts?: string[];
    cartContents?: string[];
  };
  requestedCategories?: TasteCategory[];
}

export interface TasteRecommendation {
  entityId: string;
  entityType: 'product' | 'store' | 'brand' | 'category' | 'deal';
  score: number; // 0-100 relevance score
  reason: string; // Why this recommendation
  metadata?: Record<string, unknown>;
}

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const TASTE_SERVICE_URL = process.env.EXPO_PUBLIC_TASTE_PROFILE_URL || 'https://rez-taste-profile.onrender.com';
const TASTE_API_VERSION = 'v1';
const TASTE_BASE_URL = `${TASTE_SERVICE_URL}/api/${TASTE_API_VERSION}`;

// Cache configuration
const TASTE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let tasteCache: Map<string, { data: unknown; expiry: number }> = new Map();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getCacheKey(userId: string, context: string): string {
  return `${userId}:${context}`;
}

function getCached<T>(key: string): T | null {
  const cached = tasteCache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.data as T;
  }
  tasteCache.delete(key);
  return null;
}

function setCache(key: string, data: unknown, duration = TASTE_CACHE_DURATION): void {
  tasteCache.set(key, { data, expiry: Date.now() + duration });
}

function clearCache(): void {
  tasteCache.clear();
}

// ============================================================================
// API METHODS
// ============================================================================

/**
 * Get user's taste profile
 * Includes behavioral scores, category affinities, and patterns
 */
export async function getTasteProfile(userId: string): Promise<ApiResponse<TasteProfile>> {
  const cacheKey = getCacheKey(userId, 'profile');
  const cached = getCached<TasteProfile>(cacheKey);
  if (cached) {
    return { success: true, data: cached };
  }

  try {
    const response = await apiClient.get(`${TASTE_BASE_URL}/profile/${userId}`);
    if (response.success && response.data) {
      setCache(cacheKey, response.data);
    }
    return response;
  } catch (error) {
    logger.error('[TasteProfile] Failed to get profile:', error);
    return { success: false, error: 'Failed to load taste profile' };
  }
}

/**
 * Get personalization context for the user
 * Use this for real-time personalization decisions
 */
export async function getTasteContext(context: TasteContext): Promise<ApiResponse<{
  userProfile: TasteProfile;
  recommendations: TasteRecommendation[];
  nextBestAction?: string;
}>> {
  const cacheKey = getCacheKey(context.userId, `ctx:${JSON.stringify(context.currentContext).slice(0, 50)}`);
  const cached = getCached<ReturnType<typeof getTasteContext>>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await apiClient.post(`${TASTE_BASE_URL}/context`, context);
    if (response.success && response.data) {
      // Shorter cache for context (more dynamic)
      setCache(cacheKey, response.data, 2 * 60 * 1000);
    }
    return response;
  } catch (error) {
    logger.error('[TasteProfile] Failed to get context:', error);
    return { success: false, error: 'Failed to load personalization context' };
  }
}

/**
 * Get recommendations based on taste profile
 */
export async function getTasteRecommendations(
  userId: string,
  category?: TasteCategory,
  limit = 10
): Promise<ApiResponse<TasteRecommendation[]>> {
  try {
    const params = new URLSearchParams({ limit: String(limit) });
    if (category) params.append('category', category);

    const response = await apiClient.get(`${TASTE_BASE_URL}/recommendations/${userId}?${params}`);
    return response;
  } catch (error) {
    logger.error('[TasteProfile] Failed to get recommendations:', error);
    return { success: false, error: 'Failed to load recommendations' };
  }
}

/**
 * Update taste profile with new order data
 * Call this after successful orders
 */
export async function updateTasteWithOrder(
  userId: string,
  orderData: {
    orderId: string;
    items: Array<{
      productId: string;
      category: string;
      brand?: string;
      price: number;
      quantity: number;
    }>;
    totalValue: number;
    storeId?: string;
    location?: { latitude: number; longitude: number };
    timestamp?: string;
  }
): Promise<ApiResponse<{ updated: boolean; profileSnapshot?: TasteProfile }>> {
  try {
    const response = await apiClient.post(`${TASTE_BASE_URL}/taste/order`, {
      userId,
      ...orderData,
    });
    // Clear cache since profile updated
    if (response.success) {
      tasteCache.delete(getCacheKey(userId, 'profile'));
    }
    return response;
  } catch (error) {
    logger.error('[TasteProfile] Failed to update with order:', error);
    return { success: false, error: 'Failed to update taste profile' };
  }
}

/**
 * Update taste profile with browsing signal
 * Call during product views, searches, etc.
 */
export async function captureTasteSignal(
  userId: string,
  signal: {
    type: 'view' | 'search' | 'wishlist' | 'share' | 'compare';
    entityType: 'product' | 'store' | 'brand' | 'category';
    entityId: string;
    metadata?: Record<string, unknown>;
    duration?: number; // seconds spent
    timestamp?: string;
  }
): Promise<ApiResponse<{ captured: boolean }>> {
  try {
    // Fire and forget - don't block UI
    const response = await apiClient.post(`${TASTE_BASE_URL}/signal`, {
      userId,
      ...signal,
    }, { timeout: 3000 }); // 3 second timeout for signals
    return response;
  } catch (error) {
    // Silently fail for signals - not critical
    logger.debug('[TasteProfile] Signal capture failed:', error);
    return { success: true, data: { captured: false } };
  }
}

/**
 * Get category-specific affinity score
 */
export async function getCategoryAffinity(
  userId: string,
  category: string
): Promise<ApiResponse<CategoryAffinity>> {
  try {
    const response = await apiClient.get(`${TASTE_BASE_URL}/affinity/${userId}/${category}`);
    return response;
  } catch (error) {
    logger.error('[TasteProfile] Failed to get category affinity:', error);
    return { success: false, error: 'Failed to load category affinity' };
  }
}

/**
 * Get behavioral insights summary
 */
export async function getBehavioralInsights(
  userId: string
): Promise<ApiResponse<{
  summary: string;
  topStrengths: string[];
  opportunities: string[];
  comparableSegments: string[];
}>> {
  try {
    const response = await apiClient.get(`${TASTE_BASE_URL}/insights/${userId}`);
    return response;
  } catch (error) {
    logger.error('[TasteProfile] Failed to get behavioral insights:', error);
    return { success: false, error: 'Failed to load insights' };
  }
}

/**
 * Batch sync orders for multiple users (admin use)
 */
export async function batchSyncOrders(
  orders: Array<{
    userId: string;
    orderId: string;
    totalValue: number;
    categories: string[];
    timestamp: string;
  }>
): Promise<ApiResponse<{ processed: number; failed: number }>> {
  try {
    const response = await apiClient.post(`${TASTE_BASE_URL}/batch/sync`, { orders });
    return response;
  } catch (error) {
    logger.error('[TasteProfile] Batch sync failed:', error);
    return { success: false, error: 'Batch sync failed' };
  }
}

// ============================================================================
// HOOKS FOR COMMON USE CASES
// ============================================================================

/**
 * Hook-like function to get personalized home feed
 * Combines taste profile with recommendations
 */
export async function getPersonalizedHomeFeed(
  userId: string,
  location?: { latitude: number; longitude: number }
): Promise<ApiResponse<{
  tasteProfile: TasteProfile;
  recommendedProducts: TasteRecommendation[];
  trendingNearYou: TasteRecommendation[];
  dealsForYou: TasteRecommendation[];
}>> {
  try {
    // Parallel fetch for speed
    const [profileResponse, recommendationsResponse] = await Promise.all([
      getTasteProfile(userId),
      getTasteContext({
        userId,
        currentContext: {
          location,
          time: new Date(),
        },
        requestedCategories: ['food', 'retail', 'entertainment'],
      }),
    ]);

    if (!profileResponse.success || !recommendationsResponse.success) {
      return { success: false, error: 'Failed to load personalized feed' };
    }

    return {
      success: true,
      data: {
        tasteProfile: profileResponse.data,
        recommendedProducts: recommendationsResponse.data?.recommendations || [],
        trendingNearYou: recommendationsResponse.data?.recommendations?.slice(0, 5) || [],
        dealsForYou: recommendationsResponse.data?.recommendations?.slice(5, 10) || [],
      },
    };
  } catch (error) {
    logger.error('[TasteProfile] Failed to get home feed:', error);
    return { success: false, error: 'Failed to load personalized feed' };
  }
}

/**
 * Get deal sensitivity score for a user
 * Used for targeting deal-heavy users
 */
export async function getDealSensitivity(userId: string): Promise<number> {
  try {
    const response = await getTasteProfile(userId);
    if (response.success && response.data) {
      return response.data.behavioralScores.valueConsciousness;
    }
    return 50; // Default moderate sensitivity
  } catch {
    return 50;
  }
}

/**
 * Check if user is a premium/discount-seeking shopper
 */
export function isDiscountSeeker(profile: TasteProfile): boolean {
  return (
    profile.behavioralScores.valueConsciousness > 70 ||
    profile.behavioralScores.impulseBuying > 60
  );
}

/**
 * Check if user prefers quality over deals
 */
export function isQualitySeeker(profile: TasteProfile): boolean {
  return profile.behavioralScores.qualityOverPrice > 70;
}

/**
 * Get user's engagement level tier
 */
export function getEngagementTier(profile: TasteProfile): 'bronze' | 'silver' | 'gold' | 'platinum' {
  const score = profile.overallScore;
  if (score >= 90) return 'platinum';
  if (score >= 75) return 'gold';
  if (score >= 50) return 'silver';
  return 'bronze';
}

// ============================================================================
// EXPORTS
// ============================================================================

export const tasteProfileService = {
  getTasteProfile,
  getTasteContext,
  getTasteRecommendations,
  updateTasteWithOrder,
  captureTasteSignal,
  getCategoryAffinity,
  getBehavioralInsights,
  batchSyncOrders,
  getPersonalizedHomeFeed,
  getDealSensitivity,
  isDiscountSeeker,
  isQualitySeeker,
  getEngagementTier,
  clearCache,
};

export default tasteProfileService;
