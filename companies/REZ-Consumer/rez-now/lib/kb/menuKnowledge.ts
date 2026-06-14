/**
 * Menu Knowledge Base for RAG
 *
 * Provides structured menu data for retrieval-augmented generation.
 * Features:
 * - Menu items with full metadata
 * - Dietary information
 * - Pairing suggestions
 * - Common questions
 * - FAQs
 */

import { MenuItem } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MenuKnowledgeItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  formattedPrice: string;
  ingredients: string[];
  dietary: {
    vegan: boolean;
    vegetarian: boolean;
    glutenFree: boolean;
    allergens: string[];
    isHalal?: boolean;
    isJain?: boolean;
  };
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  pairings: string[];
  commonQuestions: Array<{ q: string; a: string }>;
  spiceLevel?: number;
  prepTime?: number;
  isPopular?: boolean;
  isChefSpecial?: boolean;
  image?: string;
}

export interface KnowledgeBaseStats {
  totalItems: number;
  categories: string[];
  dietaryCounts: {
    vegan: number;
    vegetarian: number;
    glutenFree: number;
    halal: number;
  };
  avgPrice: number;
  lastUpdated: string;
}

// ── Knowledge Base Builder ─────────────────────────────────────────────────────

/**
 * Build knowledge base from menu items
 */
export function buildMenuKnowledgeBase(menuItems: MenuItem[]): MenuKnowledgeItem[] {
  if (!Array.isArray(menuItems)) {
    logger.warn('[KB] Invalid menu items received', { type: typeof menuItems });
    return [];
  }
  return menuItems
    .filter((item): item is MenuItem => item != null && typeof item === 'object')
    .map(item => buildKnowledgeItem(item));
}

/**
 * Build a single knowledge item from a menu item
 */
function buildKnowledgeItem(item: MenuItem): MenuKnowledgeItem {
  // Detect if price is in paisa (values > 10000 suggest paisa)
  const isPriceInPaisa = item.price > 10000;
  const priceInRupees = isPriceInPaisa ? item.price / 100 : item.price;

  return {
    id: item.id,
    name: item.name || 'Unknown Item',
    description: item.description || 'No description available',
    category: item.categoryId || 'Uncategorized',
    price: item.price,
    formattedPrice: `₹${priceInRupees.toFixed(2)}`,
    ingredients: item.ingredients || [],
    dietary: {
      vegan: item.dietary?.isVegan || false,
      vegetarian: item.dietary?.isVegetarian || false,
      glutenFree: item.dietary?.isGlutenFree || false,
      allergens: item.allergens || [],
      isHalal: item.dietary?.isHalal,
      isJain: item.dietary?.isJain,
    },
    nutrition: {
      calories: item.nutrition?.calories || 0,
      protein: item.nutrition?.protein || 0,
      carbs: item.nutrition?.carbs || 0,
      fat: item.nutrition?.fat || 0,
    },
    pairings: generatePairings(item),
    commonQuestions: generateCommonQuestions(item),
    spiceLevel: item.spicyLevel,
    prepTime: item.prepTime,
    isPopular: item.isPopular,
    isChefSpecial: item.isChefSpecial,
    image: item.image || item.imageHd || undefined,
  };
}

/**
 * Generate pairing suggestions for an item
 */
function generatePairings(item: MenuItem): string[] {
  const pairings: string[] = [];

  // Wine pairings based on category
  const winePairings: Record<string, string[]> = {
    'Biryani': ['Sauvignon Blanc', 'Riesling', 'Rogan Josh'],
    'Curry': ['Chardonnay', 'Gewürztraminer', 'Pinot Noir'],
    'Tandoori': ['Chardonnay', 'Riesling', 'Champagne'],
    'Seafood': ['Sauvignon Blanc', 'Pinot Grigio', 'Champagne'],
    'Vegetarian': ['Pinot Grigio', 'Sauvignon Blanc', 'Rosé'],
    'Dessert': ['Moscato', 'Port', 'Late Harvest Riesling'],
  };

  const category = item.categoryId || '';
  for (const [cat, wines] of Object.entries(winePairings)) {
    if (category.toLowerCase().includes(cat.toLowerCase())) {
      pairings.push(...wines);
      break;
    }
  }

  // Beverage suggestions
  if (item.spicyLevel && item.spicyLevel > 1) {
    pairings.push('Lassi (Sweet or Salted)');
    pairings.push('Buttermilk');
    pairings.push('Mango Lassi');
  }

  // Default pairings
  if (pairings.length === 0) {
    pairings.push('Masala Chai');
    pairings.push('Fresh Lime Soda');
    pairings.push('Buttermilk');
  }

  return [...new Set(pairings)].slice(0, 5);
}

/**
 * Generate common questions for an item
 */
function generateCommonQuestions(item: MenuItem): Array<{ q: string; a: string }> {
  const questions: Array<{ q: string; a: string }> = [];

  // Dietary questions
  if (item.dietary?.isVegan) {
    questions.push({
      q: `Is ${item.name} vegan?`,
      a: `Yes, ${item.name} is completely vegan. It contains no animal products.`,
    });
  } else if (item.dietary?.isVegetarian) {
    questions.push({
      q: `Is ${item.name} vegetarian?`,
      a: `Yes, ${item.name} is vegetarian.`,
    });
  }

  if (item.dietary?.isGlutenFree) {
    questions.push({
      q: `Is ${item.name} gluten-free?`,
      a: `Yes, ${item.name} is prepared without gluten-containing ingredients.`,
    });
  }

  if (item.dietary?.isHalal) {
    questions.push({
      q: `Is ${item.name} halal?`,
      a: `Yes, ${item.name} is prepared according to halal guidelines.`,
    });
  }

  // Allergen questions
  if (item.allergens && item.allergens.length > 0) {
    questions.push({
      q: `What allergens are in ${item.name}?`,
      a: `${item.name} contains: ${item.allergens.join(', ')}. Please inform our staff if you have unknown allergies.`,
    });
  }

  // Spice level
  if (item.spicyLevel && item.spicyLevel > 0) {
    const spiceLabels: Record<number, string> = {
      1: 'mild',
      2: 'medium',
      3: 'hot',
    };
    questions.push({
      q: `How spicy is ${item.name}?`,
      a: `${item.name} is ${spiceLabels[item.spicyLevel] || 'mildly'} spiced. ${item.spiceDescription || ''}`,
    });
  }

  // Ingredients
  if (item.ingredients && item.ingredients.length > 0) {
    questions.push({
      q: `What are the ingredients in ${item.name}?`,
      a: `Key ingredients include: ${item.ingredients.slice(0, 5).join(', ')}${item.ingredients.length > 5 ? ', and more' : ''}.`,
    });
  }

  // Nutrition
  if (item.nutrition?.calories) {
    questions.push({
      q: `How many calories in ${item.name}?`,
      a: `${item.name} has approximately ${item.nutrition.calories} calories. Nutrition: Protein ${item.nutrition.protein}g, Carbs ${item.nutrition.carbs}g, Fat ${item.nutrition.fat}g.`,
    });
  }

  // Portion size
  if (item.portionSizes && item.portionSizes.length > 0) {
    questions.push({
      q: `What portion sizes are available for ${item.name}?`,
      a: `${item.name} is available in: ${item.portionSizes.map(p => `${p.label}`).join(', ')}.`,
    });
  }

  return questions;
}

// ── Knowledge Base Stats ────────────────────────────────────────────────────────

/**
 * Calculate knowledge base statistics
 */
export function calculateKBStats(items: MenuKnowledgeItem[]): KnowledgeBaseStats {
  const categories = [...new Set(items.map(i => i.category))];
  const dietaryCounts = {
    vegan: items.filter(i => i.dietary.vegan).length,
    vegetarian: items.filter(i => i.dietary.vegetarian).length,
    glutenFree: items.filter(i => i.dietary.glutenFree).length,
    halal: items.filter(i => i.dietary.isHalal).length,
  };

  const totalPrice = items.reduce((sum, i) => sum + i.price, 0);
  const avgPrice = items.length > 0 ? Math.round(totalPrice / items.length) : 0;

  return {
    totalItems: items.length,
    categories,
    dietaryCounts,
    avgPrice,
    lastUpdated: new Date().toISOString(),
  };
}

// ── Search & Retrieval ──────────────────────────────────────────────────────────

/**
 * Simple text-based search over knowledge base
 */
export function searchKnowledgeBase(
  query: string,
  items: MenuKnowledgeItem[],
  filters?: {
    category?: string;
    dietary?: Partial<MenuKnowledgeItem['dietary']>;
    maxPrice?: number;
    minPrice?: number;
  }
): MenuKnowledgeItem[] {
  let results = items;
  const normalizedQuery = query.toLowerCase();

  // Apply filters
  if (filters?.category) {
    results = results.filter(i =>
      i.category.toLowerCase() === filters.category!.toLowerCase()
    );
  }

  if (filters?.dietary) {
    if (filters.dietary.vegan) {
      results = results.filter(i => i.dietary.vegan);
    }
    if (filters.dietary.vegetarian) {
      results = results.filter(i => i.dietary.vegetarian);
    }
    if (filters.dietary.glutenFree) {
      results = results.filter(i => i.dietary.glutenFree);
    }
  }

  if (filters?.minPrice !== undefined) {
    results = results.filter(i => i.price >= filters.minPrice!);
  }

  if (filters?.maxPrice !== undefined) {
    results = results.filter(i => i.price <= filters.maxPrice!);
  }

  // Text search
  if (normalizedQuery) {
    results = results.filter(item => {
      const searchableText = [
        item.name,
        item.description,
        item.category,
        ...item.ingredients,
      ].join(' ').toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }

  return results;
}

/**
 * Get items by dietary requirements
 */
export function getItemsByDietary(
  items: MenuKnowledgeItem[],
  requirements: string[]
): MenuKnowledgeItem[] {
  return items.filter(item => {
    for (const req of requirements) {
      const normalizedReq = req.toLowerCase();
      if (normalizedReq === 'vegan' && !item.dietary.vegan) return false;
      if (normalizedReq === 'vegetarian' && !item.dietary.vegetarian) return false;
      if (normalizedReq === 'gluten-free' && !item.dietary.glutenFree) return false;
      if (normalizedReq === 'halal' && !item.dietary.isHalal) return false;
      if (normalizedReq === 'jain' && !item.dietary.isJain) return false;
    }
    return true;
  });
}

/**
 * Get FAQ data for a category
 */
export function getCategoryFAQs(category: string): Array<{ q: string; a: string }> {
  const categoryFAQs: Record<string, Array<{ q: string; a: string }>> = {
    'Biryani': [
      {
        q: 'What type of rice is used in your biryani?',
        a: 'We use premium quality basmati rice imported from the foothills of the Himalayas.',
      },
      {
        q: 'Is your biryani spicy?',
        a: 'Our biryani has a medium spice level. You can request it mild or spicy when ordering.',
      },
    ],
    'Curry': [
      {
        q: 'Can I adjust the spice level?',
        a: 'Absolutely! Just let our staff know your preference and we will adjust accordingly.',
      },
      {
        q: 'Is the curry gravy vegan?',
        a: 'Please check individual items. Some curries contain dairy (cream, yogurt) while others are vegan.',
      },
    ],
    'Bread': [
      {
        q: 'Is your naan vegan?',
        a: 'Plain naan contains yogurt and is not vegan. We offer vegan options - please ask your server.',
      },
      {
        q: 'Is your bread gluten-free?',
        a: 'Our traditional breads contain wheat. We offer gluten-free options - please check with your server.',
      },
    ],
    'Desserts': [
      {
        q: 'Do you have sugar-free desserts?',
        a: "We offer some sugar-free options. Please check with your server for today's selection.",
      },
      {
        q: 'Are your desserts suitable for diabetics?',
        a: 'Please consult with our staff about specific dietary requirements.',
      },
    ],
  };

  return categoryFAQs[category] || [
    {
      q: `What makes your ${category} special?`,
      a: `Our ${category} is prepared using traditional recipes with fresh, locally sourced ingredients.`,
    },
  ];
}

// ── Vector Index (Placeholder) ──────────────────────────────────────────────────

/**
 * Build a simple index for the knowledge base
 * In production, this would use embeddings and a vector database
 */
export interface VectorIndex {
  items: MenuKnowledgeItem[];
  lastUpdated: string;
}

export function buildMenuIndex(items: MenuKnowledgeItem[]): VectorIndex {
  return {
    items,
    lastUpdated: new Date().toISOString(),
  };
}

// ── Caching ─────────────────────────────────────────────────────────────────────

const KB_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// SSR-safe cache: store per-request in dev, use global only in client
function getCacheStore(): { cachedKB: VectorIndex | null; cacheTimestamp: number } {
  if (typeof window !== 'undefined') {
    // Client-side: use module-level cache
    return globalCache;
  }
  // Server-side: use global to avoid memory leaks in dev HMR
  if (!global.__kbCache) {
    global.__kbCache = { cachedKB: null, cacheTimestamp: 0 };
  }
  return global.__kbCache;
}

const globalCache = { cachedKB: null as VectorIndex | null, cacheTimestamp: 0 };

// Extend global type for server-side cache
declare global {
  var __kbCache: { cachedKB: VectorIndex | null; cacheTimestamp: number } | undefined;
}

/**
 * Get knowledge base with caching
 */
export function getKnowledgeBase(
  menuItems: MenuItem[],
  forceRefresh: boolean = false
): VectorIndex {
  const { cachedKB, cacheTimestamp } = getCacheStore();
  const now = Date.now();

  if (!forceRefresh && cachedKB && (now - cacheTimestamp) < KB_CACHE_TTL) {
    logger.debug('[KB] Returning cached knowledge base');
    return cachedKB;
  }

  logger.info('[KB] Building new knowledge base', { itemCount: menuItems.length });

  const newCache = buildMenuIndex(buildMenuKnowledgeBase(menuItems));

  // Update cache
  const store = getCacheStore();
  store.cachedKB = newCache;
  store.cacheTimestamp = now;

  return newCache;
}

/**
 * Invalidate the knowledge base cache
 */
export function invalidateKBCache(): void {
  const store = getCacheStore();
  store.cachedKB = null;
  store.cacheTimestamp = 0;
  logger.info('[KB] Cache invalidated');
}

// ── Export ─────────────────────────────────────────────────────────────────────

export default {
  buildMenuKnowledgeBase,
  calculateKBStats,
  searchKnowledgeBase,
  getItemsByDietary,
  getCategoryFAQs,
  buildMenuIndex,
  getKnowledgeBase,
  invalidateKBCache,
};
