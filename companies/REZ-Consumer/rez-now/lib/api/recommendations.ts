/**
 * Menu Recommendations API
 * Client-side API for menu recommendations
 */

import { authClient, publicClient } from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MenuRecommendationItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  formattedPrice?: string;
  image?: string;
  images?: string[];
  category?: string;
  tags?: string[];
  isAvailable?: boolean;
  dietary?: {
    isVegan?: boolean;
    isVegetarian?: boolean;
    isGlutenFree?: boolean;
    isHalal?: boolean;
    isKosher?: boolean;
    isJain?: boolean;
  };
  allergens?: string[];
  spicyLevel?: number;
  rating?: number;
  reviewCount?: number;
  isPopular?: boolean;
  isChefSpecial?: boolean;
}

export interface MenuRecommendation {
  item: MenuRecommendationItem;
  score: number;
  reason: string;
  category: string;
}

export interface MenuRecommendationResponse {
  recommendations: MenuRecommendation[];
  weatherContext?: {
    condition: string;
    temperature: number;
    recommendation: string;
  };
  timeContext: string;
  personalizedAt: string;
}

export interface SimilarItemResponse {
  items: MenuRecommendation[];
}

export interface TrendingItemResponse {
  items: MenuRecommendation[];
}

// ── API Functions ───────────────────────────────────────────────────────────────

/**
 * Get personalized menu recommendations
 * @param storeId - The store ID
 * @param options - Recommendation options
 */
export async function getMenuRecommendations(
  storeId: string,
  options: {
    userId?: string;
    cartItems?: string[];
    dietaryFilters?: string[];
    timeOfDay: 'breakfast' | 'lunch' | 'dinner' | 'late_night';
    latitude?: number;
    longitude?: number;
    limit?: number;
  }
): Promise<MenuRecommendationResponse> {
  const { data } = await (options.userId ? authClient : publicClient).post('/api/catalog/recommendations/menu', {
    storeId,
    ...options,
  });

  if (!data.success) {
    throw new Error(data.message || 'Failed to get recommendations');
  }

  return data.data;
}

/**
 * Get similar items to a given item
 * @param itemId - The item ID
 * @param limit - Maximum number of similar items
 */
export async function getSimilarItems(
  itemId: string,
  limit = 5
): Promise<SimilarItemResponse> {
  const { data } = await publicClient.get('/api/catalog/recommendations/similar/' + itemId, {
    params: { limit },
  });

  if (!data.success) {
    throw new Error(data.message || 'Failed to get similar items');
  }

  return data.data;
}

/**
 * Get trending items for a store
 * @param storeId - The store ID
 * @param limit - Maximum number of trending items
 */
export async function getTrendingItems(
  storeId: string,
  limit = 10
): Promise<TrendingItemResponse> {
  const { data } = await publicClient.get('/api/catalog/recommendations/trending/' + storeId, {
    params: { limit },
  });

  if (!data.success) {
    throw new Error(data.message || 'Failed to get trending items');
  }

  return data.data;
}

// ── Utility Functions ──────────────────────────────────────────────────────────

/**
 * Determine the time of day category based on current hour
 */
export function getTimeOfDay(): 'breakfast' | 'lunch' | 'dinner' | 'late_night' {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 22) return 'dinner';
  return 'late_night';
}

/**
 * Format recommendation reason for display
 */
export function formatRecommendationReason(reason: string): string {
  const displayReasons: Record<string, string> = {
    'Matches your dietary preferences': 'Diet-friendly',
    'Pairs well with items in your cart': 'Goes great with your order',
    'Matches your spice preference': 'Your spice level',
    'Great for breakfast': 'Breakfast pick',
    'Great for lunch': 'Lunch special',
    'Great for dinner': 'Dinner favorite',
    'Great for late_night': 'Late night treat',
    'Perfect for hot weather': 'Cool down',
    'Perfect for cold weather': 'Warm up',
    'Perfect for rainy weather': 'Rainy day special',
    'Top trending item': 'Trending',
    'Trending now': 'Popular now',
    "Chef's special or popular choice": 'Chef\'s special',
  };

  return displayReasons[reason] || reason;
}
