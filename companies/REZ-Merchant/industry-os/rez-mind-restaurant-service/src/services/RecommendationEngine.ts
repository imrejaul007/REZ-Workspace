import { v4 as uuidv4 } from 'uuid';

export interface Customer {
  id: string;
  name: string;
  preferences: CustomerPreferences;
  orderHistory: Order[];
  dietaryRestrictions: string[];
  averageOrderValue: number;
  visitFrequency: number;
  lastVisit: Date;
}

export interface CustomerPreferences {
  cuisineTypes: string[];
  spiceLevel: 'mild' | 'medium' | 'hot' | 'extraHot';
  portionPreference: 'small' | 'regular' | 'large';
  priceRange: { min: number; max: number };
  favoriteItems: string[];
}

export interface Order {
  id: string;
  items: OrderedItem[];
  totalAmount: number;
  date: Date;
  rating?: number;
}

export interface OrderedItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  modifiers?: string[];
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  basePrice: number;
  calories?: number;
  preparationTime: number;
  spiceLevel?: 'mild' | 'medium' | 'hot' | 'extraHot';
  cuisineType: string;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  tags: string[];
  comboPairs?: string[];
}

export interface Recommendation {
  id: string;
  type: 'personal' | 'popular' | 'combo' | 'upsell' | 'weather' | 'seasonal';
  item: MenuItem;
  score: number;
  reason: string;
  confidence: number;
}

export interface ComboSuggestion {
  id: string;
  name: string;
  items: MenuItem[];
  totalPrice: number;
  discountedPrice: number;
  savings: number;
  popularityScore: number;
}

export interface UpsellSuggestion {
  item: MenuItem;
  suggestedAddOn: MenuItem;
  comboPrice: number;
  savings: number;
  message: string;
  confidence: number;
}

export interface WeatherRecommendation {
  recommendations: Recommendation[];
  weatherCondition: string;
  temperature: number;
  reasoning: string;
}

export class RecommendationEngine {
  private menuItems: Map<string, MenuItem>;
  private popularityScores: Map<string, number>;
  private weatherConditions: Map<string, string[]>;

  constructor() {
    this.menuItems = new Map();
    this.popularityScores = new Map();
    this.weatherConditions = new Map([
      ['rainy', ['soup', 'hot tea', 'biryani', 'curry', 'fried rice']],
      ['sunny', ['ice cream', 'cold drinks', 'salad', 'grilled', 'fresh juice']],
      ['cold', ['hot chocolate', 'soup', 'biryani', 'tandoor', 'hot coffee']],
      ['hot', ['lassi', 'cold drinks', 'chaat', 'cold salads', 'ice cream']],
    ]);
  }

  /**
   * Load menu items into the engine
   */
  loadMenu(items: MenuItem[]): void {
    this.menuItems.clear();
    for (const item of items) {
      this.menuItems.set(item.id, item);
    }
  }

  /**
   * Update popularity scores based on order data
   */
  updatePopularityScores(orders: Order[]): void {
    const itemCounts = new Map<string, number>();
    const itemRevenue = new Map<string, number>();

    for (const order of orders) {
      for (const orderedItem of order.items) {
        itemCounts.set(
          orderedItem.menuItemId,
          (itemCounts.get(orderedItem.menuItemId) || 0) + orderedItem.quantity
        );
        itemRevenue.set(
          orderedItem.menuItemId,
          (itemRevenue.get(orderedItem.menuItemId) || 0) + orderedItem.price * orderedItem.quantity
        );
      }
    }

    // Calculate normalized scores
    const totalOrders = orders.length;
    for (const [itemId, count] of itemCounts) {
      const popularity = (count / totalOrders) * 0.6 + ((itemRevenue.get(itemId) || 0) / totalOrders / 100) * 0.4;
      this.popularityScores.set(itemId, Math.min(popularity * 100, 100));
    }
  }

  /**
   * Generate personalized recommendations for a customer
   */
  getPersonalizedRecommendations(
    customer: Customer,
    limit: number = 5
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const seen = new Set<string>();

    // Add favorites with high priority
    for (const itemId of customer.preferences.favoriteItems) {
      const item = this.menuItems.get(itemId);
      if (item) {
        recommendations.push({
          id: uuidv4(),
          type: 'personal',
          item,
          score: 95,
          reason: 'One of your favorites',
          confidence: 0.95,
        });
        seen.add(itemId);
      }
    }

    // Recommend based on cuisine preferences
    for (const item of this.menuItems.values()) {
      if (seen.has(item.id)) continue;

      const cuisineMatch = customer.preferences.cuisineTypes.includes(item.cuisineType);
      if (!cuisineMatch) continue;

      const priceInRange =
        item.basePrice >= customer.preferences.priceRange.min &&
        item.basePrice <= customer.preferences.priceRange.max;

      if (!priceInRange) continue;

      const score = this.calculateMatchScore(item, customer);
      if (score > 60) {
        recommendations.push({
          id: uuidv4(),
          type: 'personal',
          item,
          score,
          reason: `Matches your ${item.cuisineType} preference`,
          confidence: score / 100,
        });
        seen.add(item.id);
      }
    }

    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Calculate match score between menu item and customer preferences
   */
  private calculateMatchScore(item: MenuItem, customer: Customer): number {
    let score = 50;

    // Cuisine match
    if (customer.preferences.cuisineTypes.includes(item.cuisineType)) {
      score += 20;
    }

    // Spice level match
    if (customer.preferences.spiceLevel === item.spiceLevel) {
      score += 15;
    }

    // Dietary restrictions compliance
    if (customer.dietaryRestrictions.includes('vegetarian') && item.isVegetarian) {
      score += 10;
    }
    if (customer.dietaryRestrictions.includes('vegan') && item.isVegan) {
      score += 10;
    }
    if (customer.dietaryRestrictions.includes('gluten-free') && item.isGlutenFree) {
      score += 10;
    }

    // Popularity bonus
    const popularity = this.popularityScores.get(item.id) || 50;
    score += popularity * 0.2;

    return Math.min(score, 100);
  }

  /**
   * Generate popular combo suggestions
   */
  getComboSuggestions(limit: number = 5): ComboSuggestion[] {
    const combos: ComboSuggestion[] = [];
    const items = Array.from(this.menuItems.values());

    // Find items that commonly pair together
    const pairCounts = new Map<string, number>();

    for (const item of items) {
      if (item.comboPairs) {
        for (const pairId of item.comboPairs) {
          const sortedIds = [item.id, pairId].sort();
          const pairKey = sortedIds.join('-');
          pairCounts.set(pairKey, (pairCounts.get(pairKey) || 0) + 1);
        }
      }
    }

    // Create combo suggestions for popular pairs
    const processedCombos = new Set<string>();

    for (const [pairKey, count] of pairCounts) {
      const [id1, id2] = pairKey.split('-');
      if (processedCombos.has(pairKey)) continue;

      const item1 = this.menuItems.get(id1);
      const item2 = this.menuItems.get(id2);

      if (!item1 || !item2) continue;

      const totalPrice = item1.basePrice + item2.basePrice;
      const comboPrice = Math.round(totalPrice * 0.85 * 100) / 100; // 15% discount
      const savings = Math.round((totalPrice - comboPrice) * 100) / 100;

      const popularity = Math.min(
        ((this.popularityScores.get(id1) || 50) + (this.popularityScores.get(id2) || 50)) / 2,
        100
      );

      combos.push({
        id: uuidv4(),
        name: `${item1.name} + ${item2.name}`,
        items: [item1, item2],
        totalPrice,
        discountedPrice: comboPrice,
        savings,
        popularityScore: popularity,
      });

      processedCombos.add(pairKey);
    }

    // Add auto-generated combos for items in same category
    for (const item1 of items) {
      for (const item2 of items) {
        if (item1.id === item2.id) continue;
        if (item1.category !== item2.category) continue;

        const pairKey = [item1.id, item2.id].sort().join('-');
        if (processedCombos.has(pairKey)) continue;

        const totalPrice = item1.basePrice + item2.basePrice;
        const comboPrice = Math.round(totalPrice * 0.9 * 100) / 100;

        if (totalPrice - comboPrice >= 10) {
          combos.push({
            id: uuidv4(),
            name: `${item1.name} + ${item2.name}`,
            items: [item1, item2],
            totalPrice,
            discountedPrice: comboPrice,
            savings: Math.round((totalPrice - comboPrice) * 100) / 100,
            popularityScore: 60,
          });
          processedCombos.add(pairKey);
        }
      }
    }

    return combos
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, limit);
  }

  /**
   * Generate upsell suggestions based on current order
   */
  getUpsellSuggestions(currentOrder: OrderedItem[]): UpsellSuggestion[] {
    const suggestions: UpsellSuggestion[] = [];
    const orderItemIds = new Set(currentOrder.map((o) => o.menuItemId));

    for (const orderedItem of currentOrder) {
      const menuItem = this.menuItems.get(orderedItem.menuItemId);
      if (!menuItem) continue;

      // Find complementary items
      for (const item of this.menuItems.values()) {
        if (orderItemIds.has(item.id)) continue;

        const isComplement = this.isComplementary(menuItem, item);
        if (!isComplement) continue;

        const comboPrice = Math.round((menuItem.basePrice + item.basePrice) * 0.95 * 100) / 100;
        const savings = Math.round((menuItem.basePrice + item.basePrice - comboPrice) * 100) / 100;

        const messages = [
          `Add ${item.name} for just Rs. ${item.basePrice} more`,
          `Complete your meal with ${item.name}`,
          `Many customers also enjoy ${item.name}`,
          `Would you like to add ${item.name}?`,
        ];

        suggestions.push({
          item: menuItem,
          suggestedAddOn: item,
          comboPrice,
          savings,
          message: messages[Math.floor(Math.random() * messages.length)],
          confidence: 0.8,
        });
      }
    }

    return suggestions.slice(0, 5);
  }

  /**
   * Check if two items are complementary
   */
  private isComplementary(item1: MenuItem, item2: MenuItem): boolean {
    // Main + Side
    if (item1.category === 'mains' && item2.category === 'sides') return true;
    if (item2.category === 'mains' && item1.category === 'sides') return true;

    // Main + Beverage
    if (item1.category === 'mains' && item2.category === 'beverages') return true;
    if (item2.category === 'mains' && item1.category === 'beverages') return true;

    // Meal + Dessert
    if (item1.tags.includes('meal') && item2.category === 'desserts') return true;
    if (item2.tags.includes('meal') && item1.category === 'desserts') return true;

    // Appetizer + Main course
    if (item1.category === 'appetizers' && item2.category === 'mains') return true;
    if (item2.category === 'appetizers' && item1.category === 'mains') return true;

    return false;
  }

  /**
   * Get weather-based recommendations
   */
  getWeatherBasedRecommendations(
    weatherCondition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy',
    temperature: number
  ): WeatherRecommendation {
    const recommendations: Recommendation[] = [];
    let relevantTags: string[] = [];

    // Map weather to relevant food tags
    if (weatherCondition === 'rainy' || weatherCondition === 'stormy') {
      relevantTags = ['soup', 'hot', 'comfort', 'fried', 'spicy'];
    } else if (weatherCondition === 'sunny') {
      relevantTags = ['cold', 'refreshing', 'light', 'salad', 'frozen'];
    } else if (temperature > 30) {
      relevantTags = ['cold', 'refreshing', 'light'];
    } else if (temperature < 15) {
      relevantTags = ['hot', 'warm', 'comfort', 'soup'];
    } else {
      relevantTags = ['popular', 'bestseller'];
    }

    // Find matching items
    for (const item of this.menuItems.values()) {
      const matchesWeather =
        item.tags.some((tag) => relevantTags.includes(tag.toLowerCase())) ||
        item.category === 'beverages';

      if (matchesWeather) {
        const popularity = this.popularityScores.get(item.id) || 50;
        recommendations.push({
          id: uuidv4(),
          type: 'weather',
          item,
          score: popularity,
          reason: this.getWeatherReason(weatherCondition, temperature, item),
          confidence: 0.75,
        });
      }
    }

    const reasoning = this.getWeatherReasoning(weatherCondition, temperature);

    return {
      recommendations: recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 5),
      weatherCondition,
      temperature,
      reasoning,
    };
  }

  private getWeatherReason(
    weather: string,
    temp: number,
    item: MenuItem
  ): string {
    if (weather === 'rainy' || weather === 'stormy') {
      return 'Perfect for a rainy day';
    }
    if (temp > 30) {
      return 'Cool down with this refreshing choice';
    }
    if (temp < 15) {
      return 'Warm up with this comfort food';
    }
    return 'Great choice for today';
  }

  private getWeatherReasoning(weather: string, temp: number): string {
    if (weather === 'rainy' || weather === 'stormy') {
      return 'Comfort food and hot beverages are trending due to rainy weather';
    }
    if (weather === 'sunny' && temp > 30) {
      return 'Hot weather - cold drinks and refreshing items are in high demand';
    }
    if (temp < 15) {
      return 'Cold weather boosting demand for hot soups and warm dishes';
    }
    return 'Moderate weather - all categories performing normally';
  }

  /**
   * Get trending items based on recent orders
   */
  getTrendingItems(hours: number = 24, limit: number = 10): Recommendation[] {
    const trending: Recommendation[] = [];

    for (const item of this.menuItems.values()) {
      const popularity = this.popularityScores.get(item.id) || 0;
      if (popularity > 70) {
        trending.push({
          id: uuidv4(),
          type: 'popular',
          item,
          score: popularity,
          reason: 'Trending now',
          confidence: popularity / 100,
        });
      }
    }

    return trending.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}

export const recommendationEngine = new RecommendationEngine();
