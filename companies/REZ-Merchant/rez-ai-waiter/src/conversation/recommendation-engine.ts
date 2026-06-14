/**
 * Menu Recommendation Engine
 */

import { config } from '../config.js';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  dietaryTags: string[];
  popularity: number; // 0-100
  prepTime: number; // minutes
  imageUrl?: string;
  customizations?: string[];
}

export interface Recommendation {
  item: MenuItem;
  score: number;
  reason: string;
}

export class RecommendationEngine {
  /**
   * Get personalized recommendations
   */
  getRecommendations(context: {
    preferences: string[];
    dietaryRestrictions: string[];
    orderItems: string[];
    budget?: { min: number; max: number };
    occasion?: string;
  }): Recommendation[] {
    const { preferences, dietaryRestrictions, orderItems, budget, occasion } = context;

    // Get sample menu (in production, would fetch from catalog)
    const menu = this.getSampleMenu();

    // Filter by dietary restrictions
    let candidates = menu.filter(item =>
      dietaryRestrictions.every(restriction =>
        item.dietaryTags.includes(restriction)
      )
    );

    // Score and rank
    const scored = candidates.map(item => {
      let score = item.popularity;

      // Boost popular items
      score += item.popularity * 0.3;

      // Boost complementary items
      const complementary = this.getComplementaryItems(orderItems);
      if (complementary.includes(item.id)) {
        score += 20;
      }

      // Boost occasion items
      if (occasion && item.category === 'specials') {
        score += 15;
      }

      // Budget filter
      if (budget) {
        if (item.price < budget.min || item.price > budget.max) {
          score *= 0.5;
        }
      }

      return {
        item,
        score,
        reason: this.generateReason(item, context),
      };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  /**
   * Get complementary items
   */
  private getComplementaryItems(orderItems: string[]): string[] {
    const complementaryMap: Record<string, string[]> = {
      'biryani': ['raita', 'salad', 'mirchi_kClaude'],
      'pizza': ['garlic_bread', 'coke', 'garlic_sauce'],
      'burger': ['fries', 'coke', 'ice_cream'],
      'pasta': ['garlic_bread', 'salad', 'tiramisu'],
      'starter': ['main_course', 'beverage', 'dessert'],
    };

    const complementary: string[] = [];
    for (const item of orderItems) {
      const matches = complementaryMap[item] || [];
      complementary.push(...matches);
    }

    return complementary;
  }

  /**
   * Generate recommendation reason
   */
  private generateReason(item: MenuItem, context: {
    preferences: string[];
    occasion?: string;
  }): string {
    if (item.popularity > 80) {
      return 'Most ordered dish today';
    }

    if (item.dietaryTags.length > 0) {
      return `Suitable for ${item.dietaryTags.join(', ')}`;
    }

    if (context.occasion === 'celebration' && item.category === 'desserts') {
      return 'Perfect for celebrations';
    }

    if (context.preferences.includes('spicy') && item.name.toLowerCase().includes('spicy')) {
      return 'As per your spice preference';
    }

    return 'Chef\'s recommendation';
  }

  /**
   * Get sample menu
   */
  private getSampleMenu(): MenuItem[] {
    return [
      {
        id: 'margherita_pizza',
        name: 'Margherita Pizza',
        description: 'Classic pizza with tomato, mozzarella, and basil',
        price: 299,
        category: 'main_course',
        dietaryTags: ['vegetarian'],
        popularity: 85,
        prepTime: 20,
      },
      {
        id: 'chicken_biryani',
        name: 'Chicken Biryani',
        description: 'Aromatic rice with tender chicken',
        price: 349,
        category: 'main_course',
        dietaryTags: ['halal'],
        popularity: 90,
        prepTime: 25,
      },
      {
        id: 'paneer_tikka',
        name: 'Paneer Tikka',
        description: 'Grilled cottage cheese with spices',
        price: 249,
        category: 'starters',
        dietaryTags: ['vegetarian', 'jain'],
        popularity: 75,
        prepTime: 15,
      },
      {
        id: 'garlic_bread',
        name: 'Garlic Bread',
        description: 'Crispy bread with garlic butter',
        price: 149,
        category: 'starters',
        dietaryTags: ['vegetarian'],
        popularity: 70,
        prepTime: 10,
      },
      {
        id: 'gulab_jamun',
        name: 'Gulab Jamun',
        description: 'Sweet milk dumplings in syrup',
        price: 99,
        category: 'desserts',
        dietaryTags: ['vegetarian', 'jain'],
        popularity: 80,
        prepTime: 5,
      },
      {
        id: 'masala_tea',
        name: 'Masala Chai',
        description: 'Traditional spiced tea',
        price: 49,
        category: 'beverages',
        dietaryTags: ['vegetarian', 'vegan', 'jain'],
        popularity: 95,
        prepTime: 5,
      },
      {
        id: 'butter_chicken',
        name: 'Butter Chicken',
        description: 'Creamy tomato curry with tender chicken',
        price: 329,
        category: 'main_course',
        dietaryTags: ['halal'],
        popularity: 88,
        prepTime: 25,
      },
      {
        id: 'special_combo',
        name: 'Festival Special Combo',
        description: 'Biryani + Starter + Dessert + Drink',
        price: 599,
        category: 'combos',
        dietaryTags: [],
        popularity: 92,
        prepTime: 30,
      },
    ];
  }

  /**
   * Search menu items
   */
  search(query: string): MenuItem[] {
    const menu = this.getSampleMenu();
    const lowerQuery = query.toLowerCase();

    return menu.filter(item =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery) ||
      item.category.toLowerCase().includes(lowerQuery)
    );
  }
}