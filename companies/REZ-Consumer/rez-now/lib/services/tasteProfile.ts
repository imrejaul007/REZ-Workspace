/**
 * Taste Profile Service
 *
 * Tracks user preferences for food recommendations:
 * - Spice tolerance levels
 * - Dietary preferences (vegetarian, vegan, gluten-free, etc.)
 * - Portion size preferences
 * - Cuisine preferences
 * - Drink pairings
 */

import { MenuItem } from '@/lib/types';

// Local storage keys
const TASTE_PROFILE_KEY = 'rez_taste_profile';
const TASTE_EVENTS_KEY = 'rez_taste_events';

// Taste profile interface
export interface TasteProfile {
  // Spice tolerance (1-5 scale)
  spiceTolerance: number; // 1=mild, 5=extra hot

  // Dietary preferences
  dietary: {
    vegetarian: boolean;
    vegan: boolean;
    glutenFree: boolean;
    halal: boolean;
    jain: boolean;
    nutFree: boolean;
    dairyFree: boolean;
  };

  // Portion preferences
  portionPreference: 'small' | 'regular' | 'large';

  // Cuisine preferences (weighted scores)
  cuisinePreferences: Record<string, number>;

  // Drink preferences
  drinkPreferences: {
    tea: number;
    coffee: number;
    coldDrinks: number;
    shakes: number;
    juices: number;
    mocktails: number;
    alcoholic: number;
  };

  // Order patterns
  patterns: {
    avgOrderValue: number;
    avgItemsPerOrder: number;
    prefersComfortFood: boolean;
    triesNewItems: boolean;
    lastUpdated: string;
  };

  // Tracked attributes
  favoriteItems: string[];
  avoidedItems: string[];
  allergens: string[];

  // Stats
  totalOrders: number;
  lastOrderDate: string | null;
}

// Initialize empty taste profile
export function createEmptyTasteProfile(): TasteProfile {
  return {
    spiceTolerance: 3,
    dietary: {
      vegetarian: false,
      vegan: false,
      glutenFree: false,
      halal: false,
      jain: false,
      nutFree: false,
      dairyFree: false,
    },
    portionPreference: 'regular',
    cuisinePreferences: {},
    drinkPreferences: {
      tea: 0,
      coffee: 0,
      coldDrinks: 0,
      shakes: 0,
      juices: 0,
      mocktails: 0,
      alcoholic: 0,
    },
    patterns: {
      avgOrderValue: 0,
      avgItemsPerOrder: 2,
      prefersComfortFood: false,
      triesNewItems: true,
      lastUpdated: new Date().toISOString(),
    },
    favoriteItems: [],
    avoidedItems: [],
    allergens: [],
    totalOrders: 0,
    lastOrderDate: null,
  };
}

// Load taste profile from localStorage
export function loadTasteProfile(): TasteProfile {
  if (typeof window === 'undefined') {
    return createEmptyTasteProfile();
  }

  try {
    const stored = localStorage.getItem(TASTE_PROFILE_KEY);
    if (stored) {
      const profile = JSON.parse(stored) as TasteProfile;
      return profile;
    }
  } catch (e) {
    logger.error('Failed to load taste profile:', e);
  }

  return createEmptyTasteProfile();
}

// Save taste profile to localStorage
export function saveTasteProfile(profile: TasteProfile): void {
  if (typeof window === 'undefined') return;

  try {
    profile.patterns.lastUpdated = new Date().toISOString();
    localStorage.setItem(TASTE_PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    logger.error('Failed to save taste profile:', e);
  }
}

// Update taste profile based on order
export function updateTasteProfileFromOrder(items: MenuItem[]): TasteProfile {
  const profile = loadTasteProfile();

  items.forEach((item) => {
    // Track spice level preference
    if (item.spicyLevel > 0) {
      // If consistently ordering spicy food, increase tolerance
      profile.spiceTolerance = Math.min(5, profile.spiceTolerance + 0.1);
    }

    // Track favorite items
    if (!profile.favoriteItems.includes(item.id)) {
      profile.favoriteItems.push(item.id);
    }

    // Track dietary info
    if (item.dietary?.isVegetarian) {
      profile.dietary.vegetarian = true;
    }
    if (item.dietary?.isVegan) {
      profile.dietary.vegan = true;
    }
    if (item.dietary?.isGlutenFree) {
      profile.dietary.glutenFree = true;
    }
    if (item.dietary?.isJain) {
      profile.dietary.jain = true;
    }
    if (item.dietary?.isHalal) {
      profile.dietary.halal = true;
    }

    // Track allergens
    if (item.allergens) {
      item.allergens.forEach((allergen) => {
        if (!profile.allergens.includes(allergen)) {
          profile.allergens.push(allergen);
        }
      });
    }

    // Track portion sizes
    if (item.portionSizes && item.portionSizes.length > 0) {
      // Analyze portion size preference from customizations
      // This would be updated based on user selection history
    }
  });

  // Update order stats
  profile.totalOrders += 1;
  profile.lastOrderDate = new Date().toISOString();

  saveTasteProfile(profile);
  return profile;
}

// Record an order event for learning
interface TasteEvent {
  type: 'order' | 'view' | 'skip' | 'rate';
  itemId: string;
  itemName: string;
  spiceLevel: number;
  isVeg: boolean;
  price: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export function recordTasteEvent(event: Omit<TasteEvent, 'timestamp'>): void {
  if (typeof window === 'undefined') return;

  try {
    const events = getTasteEvents();
    const fullEvent: TasteEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };
    events.push(fullEvent);

    // Keep only last 100 events
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }

    localStorage.setItem(TASTE_EVENTS_KEY, JSON.stringify(events));
  } catch (e) {
    logger.error('Failed to record taste event:', e);
  }
}

export function getTasteEvents(): TasteEvent[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(TASTE_EVENTS_KEY);
    if (stored) {
      return JSON.parse(stored) as TasteEvent[];
    }
  } catch {
    // Ignore parse errors
  }

  return [];
}

// Get spice preference display text
export function getSpicePreferenceLabel(tolerance: number): string {
  if (tolerance <= 1) return 'Mild - No spice';
  if (tolerance <= 2) return 'Low - Light spice';
  if (tolerance <= 3) return 'Medium - Balanced spice';
  if (tolerance <= 4) return 'High - Extra spicy';
  return 'Very High - Extra hot lovers';
}

// Calculate item recommendation score based on taste profile
export function calculateItemScore(item: MenuItem, profile: TasteProfile): number {
  let score = 0;
  const reasons: string[] = [];

  // Check dietary compatibility
  if (profile.dietary.vegetarian && item.dietary?.isVegetarian) {
    score += 20;
    reasons.push('Matches vegetarian preference');
  }
  if (profile.dietary.vegan && item.dietary?.isVegan) {
    score += 20;
    reasons.push('Matches vegan preference');
  }
  if (profile.dietary.glutenFree && item.dietary?.isGlutenFree) {
    score += 15;
    reasons.push('Gluten-free option');
  }
  if (profile.dietary.jain && item.dietary?.isJain) {
    score += 25;
    reasons.push('Jain option');
  }
  if (profile.dietary.halal && item.dietary?.isHalal) {
    score += 25;
    reasons.push('Halal option');
  }

  // Check spice compatibility
  const spiceDiff = Math.abs(item.spicyLevel - Math.round(profile.spiceTolerance));
  if (spiceDiff === 0) {
    score += 15;
    reasons.push('Perfect spice level');
  } else if (spiceDiff === 1) {
    score += 5;
  }

  // Check favorite items
  if (profile.favoriteItems.includes(item.id)) {
    score += 30;
    reasons.push('One of your favorites');
  }

  // Check avoided items
  if (profile.avoidedItems.includes(item.id)) {
    score -= 50;
  }

  // Check allergens
  if (item.allergens) {
    const hasAllergen = item.allergens.some((a) => profile.allergens.includes(a));
    if (hasAllergen) {
      score -= 100;
    }
  }

  // Boost for trying new items
  if (!profile.favoriteItems.includes(item.id) && profile.patterns.triesNewItems) {
    score += 5;
    reasons.push('New to explore');
  }

  return score;
}

// Suggest items based on taste profile
export function suggestItemsFromProfile(
  items: MenuItem[],
  profile: TasteProfile,
  limit = 5,
): MenuItem[] {
  return items
    .map((item) => ({
      item,
      score: calculateItemScore(item, profile),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => item);
}

// Clear taste profile data
export function clearTasteProfile(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TASTE_PROFILE_KEY);
  localStorage.removeItem(TASTE_EVENTS_KEY);
}

// Sync taste profile with server
export async function syncTasteProfileToServer(profile: TasteProfile): Promise<void> {
  try {
    const { authClient } = await import('@/lib/api/client');
    await authClient.post('/api/user/taste-profile', {
      spiceTolerance: profile.spiceTolerance,
      dietary: profile.dietary,
      portionPreference: profile.portionPreference,
      allergens: profile.allergens,
    });
  } catch (e) {
    logger.error('Failed to sync taste profile:', e);
  }
}
