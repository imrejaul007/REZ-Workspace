/**
 * Menu Recommendation Service
 * Personalized menu item recommendations based on user preferences, context, and behavior
 */

import { Product } from '../models/Product';
import { dietaryPreferencesService, IDietaryPreferences } from './dietaryPreferencesService';
import { tasteProfileService } from './tasteProfileService';
import { weatherService } from './weatherService';

export interface MenuRecommendationRequest {
  storeId: string;
  userId?: string;
  cartItems?: string[];
  dietaryFilters?: string[];
  weatherCondition?: string;
  timeOfDay: 'breakfast' | 'lunch' | 'dinner' | 'late_night';
  latitude?: number;
  longitude?: number;
  limit?: number;
}

export interface MenuItemRecommendation {
  item: Record<string, unknown>;
  score: number;
  reason: string;
  category: string;
}

export interface MenuRecommendationResponse {
  recommendations: MenuItemRecommendation[];
  weatherContext?: {
    condition: string;
    temperature: number;
    recommendation: string;
  };
  timeContext: string;
  personalizedAt: string;
}

export class MenuRecommendationService {
  /**
   * Get personalized menu recommendations
   */
  async getRecommendations(req: MenuRecommendationRequest): Promise<MenuRecommendationResponse> {
    const { storeId, userId, cartItems, dietaryFilters, timeOfDay, latitude, longitude, limit = 10 } = req;

    // Get user preferences if logged in
    let dietaryPrefs: IDietaryPreferences | null = null;
    let tasteProfile = null;

    if (userId) {
      [dietaryPrefs, tasteProfile] = await Promise.all([
        dietaryPreferencesService.getByUserId(userId),
        tasteProfileService.getByUserId(userId),
      ]);
    }

    // Get weather context if location provided
    let weatherContext = undefined;
    if (latitude !== undefined && longitude !== undefined) {
      try {
        const weather = await weatherService.getWeather(latitude, longitude);
        weatherContext = {
          condition: weather.condition,
          temperature: weather.temperature,
          recommendation: weatherService.getWeatherRecommendations(weather).reason,
        };
      } catch {
        // Weather fetch failed, continue without weather context
      }
    }

    // Build product query
    const productFilter: Record<string, unknown> = {
      isActive: true,
      isAvailable: true,
    };

    if (storeId) {
      productFilter.storeId = storeId;
    }

    const products = await Product.find(productFilter)
      .sort({ viewCount: -1, createdAt: -1 })
      .limit(limit * 3) // Get more to filter
      .lean();

    // Score and filter products
    const scoredProducts = products.map((product) => {
      let score = 0;
      const reasons: string[] = [];

      // Base popularity score
      const popularityScore = Math.min((product.viewCount || 0) / 100, 1);
      score += popularityScore * 0.2;

      // Check dietary compatibility
      const productAny = product as unknown;
      const dietaryMatch = dietaryPreferencesService.matchesDietaryFilters(dietaryPrefs, {
        dietary: productAny.dietary,
        allergens: productAny.allergens,
        name: product.name,
        ingredients: productAny.ingredients,
      });

      if (!dietaryMatch.matches) {
        score *= 0.1; // Heavily penalize incompatible items
        reasons.push(dietaryMatch.reason || 'Dietary filter mismatch');
      } else if (dietaryPrefs) {
        score += 0.3; // Boost for matching preferences
        reasons.push('Matches your dietary preferences');
      }

      // Check cart items (complementary items)
      if (cartItems && cartItems.length > 0 && userId) {
        const cartSet = new Set(cartItems.map((id) => id.toLowerCase()));
        const isComplementary = this.checkComplementarity(product, cartItems);
        if (isComplementary) {
          score += 0.25;
          reasons.push('Pairs well with items in your cart');
        }
      }

      // Spice tolerance matching
      const productAny2 = product as unknown;
      if (tasteProfile && productAny2.spicyLevel !== undefined) {
        const spiceTolerance = tasteProfile.spiceTolerance || 3;
        const itemSpice = productAny2.spicyLevel;
        if (Math.abs(itemSpice - spiceTolerance) <= 1) {
          score += 0.15;
          reasons.push('Matches your spice preference');
        }
      }

      // Time of day relevance
      const timeRelevance = this.getTimeRelevance(product, timeOfDay);
      score += timeRelevance * 0.15;
      if (timeRelevance > 0.5) {
        reasons.push(`Great for ${timeOfDay}`);
      }

      // Featured/seasonal boost
      if (productAny.isFeatured || productAny.isPopular || productAny.isChefSpecial) {
        score += 0.1;
        reasons.push('Chef\'s special or popular choice');
      }

      // Weather-based boost
      if (weatherContext) {
        const weatherBoost = this.getWeatherBoost(product, weatherContext.condition);
        score += weatherBoost * 0.1;
        if (weatherBoost > 0.5) {
          reasons.push(`Perfect for ${weatherContext.condition} weather`);
        }
      }

      // Apply additional dietary filters from request
      if (dietaryFilters && dietaryFilters.length > 0) {
        for (const filter of dietaryFilters) {
          if (!this.matchesFilter(product, filter)) {
            score *= 0.3;
            reasons.push(`Excluded by filter: ${filter}`);
          }
        }
      }

      return {
        item: product,
        score: Math.min(score, 1), // Cap at 1
        reason: reasons.length > 0 ? reasons[0] : 'Recommended for you',
        category: (product.category as string) || 'General',
      };
    });

    // Sort by score and take top results
    const recommendations = scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((rec) => ({
        item: rec.item,
        score: Math.round(rec.score * 100) / 100,
        reason: rec.reason,
        category: rec.category,
      }));

    return {
      recommendations,
      weatherContext,
      timeContext: this.getTimeContext(timeOfDay),
      personalizedAt: new Date().toISOString(),
    };
  }

  /**
   * Get similar items to a given product
   */
  async getSimilarItems(itemId: string, limit = 5): Promise<MenuItemRecommendation[]> {
    const product = await Product.findById(itemId).lean();
    if (!product) return [];

    const similarProducts = await Product.find({
      _id: { $ne: product._id },
      isActive: true,
      isAvailable: true,
      $or: [
        { category: product.category },
        { tags: { $in: product.tags || [] } },
      ],
    })
      .sort({ viewCount: -1 })
      .limit(limit)
      .lean();

    return similarProducts.map((p) => ({
      item: p,
      score: 0.8,
      reason: `Similar to ${product.name}`,
      category: (p.category as string) || 'General',
    }));
  }

  /**
   * Get trending items for a store
   */
  async getTrendingItems(storeId: string, limit = 10): Promise<MenuItemRecommendation[]> {
    const trendingProducts = await Product.find({
      storeId,
      isActive: true,
      isAvailable: true,
    })
      .sort({ viewCount: -1 })
      .limit(limit)
      .lean();

    return trendingProducts.map((p, index) => ({
      item: p,
      score: 1 - index * 0.05, // Decreasing score based on rank
      reason: index < 3 ? 'Top trending item' : 'Trending now',
      category: (p.category as string) || 'General',
    }));
  }

  /**
   * Check if two products are complementary
   */
  private checkComplementarity(product: Record<string, unknown>, cartItems: string[]): boolean {
    const cartLower = cartItems.map((id) => id.toLowerCase());

    // Pairs that go well together
    const pairs: Record<string, string[]> = {
      pizza: ['soft drink', 'garlic bread', 'dessert'],
      biryani: ['raita', 'salan', 'mirchi ka salan', 'dal'],
      burger: ['fries', 'coke', 'shake'],
      pasta: ['garlic bread', 'salad', 'wine'],
      steak: ['wine', 'salad', 'mashed potato'],
      salad: ['croutons', 'dressing', 'protein'],
      soup: ['bread', 'crackers'],
      coffee: ['pastry', 'cookie', 'cake'],
    };

    const productName = (product.name as string || '').toLowerCase();
    for (const [main, complements] of Object.entries(pairs)) {
      if (productName.includes(main)) {
        // Check if cart has any complement
        for (const complement of complements) {
          for (const cartItem of cartLower) {
            if (cartItem.includes(complement)) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  /**
   * Get relevance score for time of day
   */
  private getTimeRelevance(product: Record<string, unknown>, timeOfDay: string): number {
    const category = ((product.category as string) || '').toLowerCase();
    const name = ((product.name as string) || '').toLowerCase();
    const tags = ((product.tags as string[]) || []).map((t) => t.toLowerCase());

    const isBreakable = () =>
      category.includes('breakfast') ||
      name.includes('breakfast') ||
      tags.includes('breakfast') ||
      name.includes('pancake') ||
      name.includes('omelette') ||
      name.includes('toast') ||
      name.includes('paratha') ||
      name.includes('idli') ||
      name.includes('dosa') ||
      name.includes('upma') ||
      name.includes('poha');

    const isLunchable = () =>
      category.includes('lunch') ||
      category.includes('main course') ||
      name.includes('thali') ||
      name.includes('meal') ||
      name.includes('biryani') ||
      name.includes('curry') ||
      name.includes('rice');

    const isDinnerable = () =>
      category.includes('dinner') ||
      category.includes('dinner') ||
      name.includes('dinner') ||
      name.includes('dinner special');

    const isLateNightable = () =>
      name.includes('late night') ||
      tags.includes('late night') ||
      name.includes('midnight') ||
      name.includes('snack') ||
      name.includes('maggi') ||
      name.includes('noodles') ||
      name.includes('chips');

    switch (timeOfDay) {
      case 'breakfast':
        return isBreakable() ? 0.9 : isLunchable() ? 0.3 : 0.1;
      case 'lunch':
        return isLunchable() ? 0.9 : isDinnerable() ? 0.5 : isBreakable() ? 0.2 : 0.4;
      case 'dinner':
        return isDinnerable() ? 0.9 : isLunchable() ? 0.5 : isLateNightable() ? 0.3 : 0.4;
      case 'late_night':
        return isLateNightable() ? 0.9 : isDinnerable() ? 0.4 : 0.2;
      default:
        return 0.5;
    }
  }

  /**
   * Get weather-based boost for product
   */
  private getWeatherBoost(product: Record<string, unknown>, weatherCondition: string): number {
    const name = ((product.name as string) || '').toLowerCase();
    const category = ((product.category as string) || '').toLowerCase();
    const tags = ((product.tags as string[]) || []).map((t) => t.toLowerCase());

    switch (weatherCondition) {
      case 'hot':
        if (
          name.includes('cold') ||
          name.includes('ice') ||
          name.includes('cool') ||
          name.includes('chilled') ||
          name.includes('frozen') ||
          category.includes('beverage') ||
          category.includes('ice cream')
        ) {
          return 0.9;
        }
        return 0.2;

      case 'cold':
      case 'snowy':
        if (
          name.includes('hot') ||
          name.includes('warm') ||
          name.includes('soup') ||
          name.includes('tea') ||
          name.includes('coffee') ||
          name.includes('chai') ||
          name.includes('curry') ||
          name.includes('biryani')
        ) {
          return 0.9;
        }
        return 0.2;

      case 'rainy':
        if (
          name.includes('hot') ||
          name.includes('pakora') ||
          name.includes('samosa') ||
          name.includes('chai') ||
          name.includes('soup')
        ) {
          return 0.9;
        }
        return 0.4;

      default:
        return 0.5;
    }
  }

  /**
   * Check if product matches a filter
   */
  private matchesFilter(product: Record<string, unknown>, filter: string): boolean {
    const lowerFilter = filter.toLowerCase();

    switch (lowerFilter) {
      case 'vegan':
        return (product.dietary as Record<string, boolean>)?.isVegan === true;
      case 'vegetarian':
        return (product.dietary as Record<string, boolean>)?.isVegetarian === true;
      case 'gluten-free':
      case 'glutenfree':
        return (product.dietary as Record<string, boolean>)?.isGlutenFree === true;
      case 'halal':
        return (product.dietary as Record<string, boolean>)?.isHalal === true;
      case 'kosher':
        return (product.dietary as Record<string, boolean>)?.isKosher === true;
      case 'jain':
        return (product.dietary as Record<string, boolean>)?.isJain === true;
      default:
        return true;
    }
  }

  /**
   * Get time context description
   */
  private getTimeContext(timeOfDay: string): string {
    switch (timeOfDay) {
      case 'breakfast':
        return 'Start your day right with these breakfast options';
      case 'lunch':
        return 'Midday meals to power through your day';
      case 'dinner':
        return 'Evening dinners for a satisfying meal';
      case 'late_night':
        return 'Late night cravings sorted';
      default:
        return 'Curated just for you';
    }
  }
}

export const menuRecommendationService = new MenuRecommendationService();
