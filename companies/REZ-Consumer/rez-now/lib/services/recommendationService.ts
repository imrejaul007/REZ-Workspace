/**
 * Recommendation Service
 *
 * Provides dish recommendations based on:
 * - Order history
 * - Co-occurrence patterns (items frequently ordered together)
 * - Personal taste profile
 * - Popular items
 * - Seasonal items
 */

import { MenuItem } from '@/lib/types';
import {
  loadTasteProfile,
  calculateItemScore,
  recordTasteEvent,
  TasteProfile,
} from './tasteProfile';

// Types
export interface RecommendationResult {
  item: MenuItem;
  reason: 'popular' | 'similar' | 'frequently_bought' | 'complementary' | 'seasonal' | 'personal';
  score: number;
}

export interface CoOccurrenceData {
  itemPairs: Map<string, string[]>;
  itemCounts: Map<string, number>;
}

// Local storage keys
const CO_OCCURRENCE_KEY = 'rez_co_occurrence';

// Load co-occurrence data from local storage
export function loadCoOccurrenceData(): CoOccurrenceData {
  if (typeof window === 'undefined') {
    return { itemPairs: new Map(), itemCounts: new Map() };
  }

  try {
    const stored = localStorage.getItem(CO_OCCURRENCE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return {
        itemPairs: new Map(data.itemPairs),
        itemCounts: new Map(data.itemCounts),
      };
    }
  } catch (e) {
    logger.error('Failed to load co-occurrence data:', e);
  }

  return { itemPairs: new Map(), itemCounts: new Map() };
}

// Save co-occurrence data
export function saveCoOccurrenceData(data: CoOccurrenceData): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(
      CO_OCCURRENCE_KEY,
      JSON.stringify({
        itemPairs: Array.from(data.itemPairs.entries()),
        itemCounts: Array.from(data.itemCounts.entries()),
      }),
    );
  } catch (e) {
    logger.error('Failed to save co-occurrence data:', e);
  }
}

// Record co-occurrence from an order
export function recordOrderCoOccurrence(items: MenuItem[]): void {
  const data = loadCoOccurrenceData();
  const itemIds = items.map((i) => i.id);

  // Update item counts
  itemIds.forEach((id) => {
    data.itemCounts.set(id, (data.itemCounts.get(id) || 0) + 1);
  });

  // Update co-occurrence pairs
  for (let i = 0; i < itemIds.length; i++) {
    for (let j = 0; j < itemIds.length; j++) {
      if (i !== j) {
        const existing = data.itemPairs.get(itemIds[i]) || [];
        if (!existing.includes(itemIds[j])) {
          existing.push(itemIds[j]);
          data.itemPairs.set(itemIds[i], existing);
        }
      }
    }
  }

  saveCoOccurrenceData(data);
}

// Get frequently bought together items
export function getFrequentlyBoughtTogether(
  currentItemIds: string[],
  allItems: MenuItem[],
  limit = 5,
): RecommendationResult[] {
  const data = loadCoOccurrenceData();
  const scores = new Map<string, number>();

  // Score items based on co-occurrence
  currentItemIds.forEach((currentId) => {
    const coItems = data.itemPairs.get(currentId) || [];
    coItems.forEach((coItemId) => {
      if (!currentItemIds.includes(coItemId)) {
        scores.set(coItemId, (scores.get(coItemId) || 0) + 1);
      }
    });
  });

  // Map to items with scores
  const results: RecommendationResult[] = [];
  scores.forEach((score, itemId) => {
    const item = allItems.find((i) => i.id === itemId);
    if (item) {
      results.push({
        item,
        reason: 'frequently_bought',
        score,
      });
    }
  });

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

// Get complementary items (drinks, desserts, sides)
export function getComplementaryItems(
  storeSlug: string,
  cartItemIds: string[],
): MenuItem[] {
  // This would normally fetch from API with category filtering
  // For now, return empty array - to be implemented with backend
  return [];
}

// Fetch recommendations from API or fallback to local
export async function getDishRecommendations(
  storeSlug: string,
  currentItemIds: string[],
): Promise<RecommendationResult[]> {
  const results: RecommendationResult[] = [];

  try {
    // Try to fetch from API
    const { authClient } = await import('@/lib/api/client');
    const { data } = await authClient.get(`/api/recommendations/${storeSlug}`, {
      params: {
        items: currentItemIds.join(','),
        limit: 10,
      },
    });

    if (data.success) {
      return data.data.map((rec: { item: MenuItem; reason: RecommendationResult['reason']; score: number }) => ({
        item: rec.item,
        reason: rec.reason,
        score: rec.score,
      }));
    }
  } catch {
    // Fallback to local recommendations
  }

  // Local fallback: use taste profile
  const profile = loadTasteProfile();
  const { getPopularItems } = await import('./recommendationService');

  const popularItems = await getPopularItems(storeSlug);
  const coOccurrenceItems = getFrequentlyBoughtTogether(currentItemIds, popularItems);

  // Add personal recommendations based on taste profile
  popularItems.forEach((item) => {
    if (!currentItemIds.includes(item.id)) {
      const score = calculateItemScore(item, profile);
      if (score > 0) {
        results.push({
          item,
          reason: 'personal',
          score,
        });
      }
    }
  });

  // Add co-occurrence recommendations
  results.push(...coOccurrenceItems);

  // Add seasonal items
  popularItems
    .filter((item) => item.isSeasonal)
    .forEach((item) => {
      if (!currentItemIds.includes(item.id)) {
        results.push({
          item,
          reason: 'seasonal',
          score: 5,
        });
      }
    });

  // Deduplicate and sort
  const seen = new Set<string>();
  return results
    .filter((rec) => {
      if (seen.has(rec.item.id)) return false;
      seen.add(rec.item.id);
      return true;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

// Get popular items from local history or API
export async function getPopularItems(storeSlug: string, limit = 20): Promise<MenuItem[]> {
  try {
    const { authClient } = await import('@/lib/api/client');
    const { data } = await authClient.get(`/api/menu/${storeSlug}/items`, {
      params: { limit },
    });

    if (data.success) {
      return data.data;
    }
  } catch {
    // Return empty on error
  }

  return [];
}

// Get similar items based on attributes
export function getSimilarItems(
  item: MenuItem,
  allItems: MenuItem[],
  limit = 5,
): MenuItem[] {
  const similarities = allItems
    .filter((other) => other.id !== item.id)
    .map((other) => {
      let score = 0;

      // Same category (if available)
      // Same spice level
      if (other.spicyLevel === item.spicyLevel) score += 3;

      // Same dietary type
      if (other.isVeg === item.isVeg) score += 2;

      // Similar price range (within 20%)
      const priceDiff = Math.abs(other.price - item.price) / item.price;
      if (priceDiff < 0.2) score += 2;

      return { item: other, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return similarities.map(({ item }) => item);
}

// Track item interaction for recommendations
export function trackItemInteraction(
  type: 'view' | 'add_to_cart' | 'order' | 'skip',
  item: MenuItem,
): void {
  recordTasteEvent({
    type,
    itemId: item.id,
    itemName: item.name,
    spiceLevel: item.spicyLevel,
    isVeg: item.isVeg,
    price: item.price,
  });

  // Also sync to server
  syncInteractionToServer(type, item.id).catch(logger.error);
}

async function syncInteractionToServer(
  type: string,
  itemId: string,
): Promise<void> {
  try {
    const { authClient } = await import('@/lib/api/client');
    await authClient.post('/api/recommendations/track', {
      type,
      itemId,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Ignore sync errors
  }
}

// Get personalized recommendations based on time of day
export function getTimeBasedRecommendations(
  items: MenuItem[],
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night',
): MenuItem[] {
  // Filter items based on time of day
  const categories = {
    morning: ['beverages', 'breakfast', 'snacks'],
    afternoon: ['starters', 'main_course', 'beverages'],
    evening: ['snacks', 'beverages', 'tea'],
    night: ['dinner', 'main_course', 'desserts'],
  };

  const relevantCategories = categories[timeOfDay] || categories.afternoon;

  // For now, just return popular items during each time
  return items
    .filter((item) => item.isPopular || item.isChefSpecial)
    .slice(0, 6);
}

// Get mood-based recommendations
export function getMoodRecommendations(
  items: MenuItem[],
  mood: 'comfort' | 'healthy' | 'celebration' | 'quick',
): MenuItem[] {
  switch (mood) {
    case 'comfort':
      return items
        .filter((item) => item.isChefSpecial || item.isPopular)
        .filter((item) => !item.dietary?.isVegan)
        .slice(0, 6);

    case 'healthy':
      return items
        .filter(
          (item) =>
            item.dietary?.isGlutenFree ||
            item.dietary?.isVegan ||
            item.dietary?.isVegetarian,
        )
        .slice(0, 6);

    case 'celebration':
      return items
        .filter((item) => item.isChefSpecial || item.isPopular)
        .sort((a, b) => b.price - a.price)
        .slice(0, 6);

    case 'quick':
      return items
        .filter((item) => (item.prepTime || 15) <= 15)
        .slice(0, 6);

    default:
      return items.slice(0, 6);
  }
}
