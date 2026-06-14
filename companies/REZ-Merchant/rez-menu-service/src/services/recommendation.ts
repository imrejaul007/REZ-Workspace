import { menuStore } from '../models/Menu';
import { RecommendationRequest, Recommendation, MenuItem } from '../types';

interface ScoringFactors {
  popularity: number;
  dietaryMatch: number;
  timeRelevance: number;
  priceFit: number;
  preferenceMatch: number;
  varietyBonus: number;
}

interface ScoredItem {
  item: MenuItem;
  score: number;
  reasons: string[];
}

export class RecommendationService {
  private readonly timeOfDayWeights: Record<string, { breakfast: number; lunch: number; dinner: number; lateNight: number }> = {
    coffee: { breakfast: 1.0, lunch: 0.6, dinner: 0.3, lateNight: 0.7 },
    tea: { breakfast: 1.0, lunch: 0.7, dinner: 0.5, lateNight: 0.6 },
    breakfast: { breakfast: 1.0, lunch: 0.2, dinner: 0.1, lateNight: 0.1 },
    lunch: { breakfast: 0.2, lunch: 1.0, dinner: 0.4, lateNight: 0.2 },
    dinner: { breakfast: 0.1, lunch: 0.3, dinner: 1.0, lateNight: 0.4 },
    snack: { breakfast: 0.3, lunch: 0.6, dinner: 0.6, lateNight: 1.0 },
    dessert: { breakfast: 0.2, lunch: 0.4, dinner: 0.8, lateNight: 0.9 },
    beverage: { breakfast: 0.7, lunch: 0.8, dinner: 0.7, lateNight: 0.9 },
    default: { breakfast: 0.5, lunch: 0.7, dinner: 0.8, lateNight: 0.6 },
  };

  async getRecommendations(request: RecommendationRequest): Promise<Recommendation[]> {
    const menu = menuStore.getFullMenu(request.menuId);
    if (!menu) {
      throw new Error('Menu not found');
    }

    const availableItems = menu.items.filter(item => item.available);
    if (availableItems.length === 0) {
      return [];
    }

    const scoredItems = this.scoreItems(availableItems, request.context || {});
    const sortedItems = scoredItems.sort((a, b) => b.score - a.score);
    const topItems = sortedItems.slice(0, request.limit || 10);

    return topItems.map(scored => this.formatRecommendation(scored, menu));
  }

  private scoreItems(items: MenuItem[], context: RecommendationRequest['context']): ScoredItem[] {
    return items.map(item => {
      const factors = this.calculateScoringFactors(item, context);
      const totalScore = this.computeTotalScore(factors, context);
      const reasons = this.generateReasons(item, factors, context);

      return {
        item,
        score: totalScore,
        reasons,
      };
    });
  }

  private calculateScoringFactors(item: MenuItem, context: RecommendationRequest['context']): ScoringFactors {
    return {
      popularity: this.calculatePopularityScore(item),
      dietaryMatch: this.calculateDietaryMatchScore(item, context?.dietaryRestrictions || []),
      timeRelevance: this.calculateTimeRelevanceScore(item, context?.timeOfDay),
      priceFit: this.calculatePriceFitScore(item, context?.budget),
      preferenceMatch: this.calculatePreferenceMatchScore(item, context?.preferences || []),
      varietyBonus: 0,
    };
  }

  private calculatePopularityScore(item: MenuItem): number {
    // Simulated popularity based on orders and views
    // In production, this would come from analytics data
    const orderMultiplier = 0.3;
    const viewMultiplier = 0.1;

    // Simulated: items with variants/modifiers tend to be more popular
    const engagementBonus = (item.variants.length * 0.05) + (item.modifiers.length * 0.03);

    return Math.min(1, 0.2 + (item.variants.length * orderMultiplier) + engagementBonus);
  }

  private calculateDietaryMatchScore(item: MenuItem, restrictions: string[]): number {
    if (restrictions.length === 0) return 0.5; // Neutral score

    let matchCount = 0;
    let conflictCount = 0;

    for (const restriction of restrictions) {
      const normalizedRestriction = restriction.toLowerCase();

      // Check if item has matching dietary flag
      if (item.dietaryFlags.some(flag => flag.toLowerCase() === normalizedRestriction)) {
        matchCount++;
      }

      // Check for conflicts
      // E.g., if restriction is 'vegetarian', items with meat are conflicts
      const conflicts: Record<string, string[]> = {
        vegetarian: ['meat', 'chicken', 'beef', 'pork', 'fish', 'seafood'],
        vegan: ['meat', 'chicken', 'beef', 'pork', 'fish', 'seafood', 'dairy', 'egg', 'honey'],
        'gluten-free': ['gluten', 'wheat', 'barley', 'rye'],
        'dairy-free': ['dairy', 'milk', 'cheese', 'cream', 'butter'],
      };

      const conflictItems = conflicts[normalizedRestriction] || [];
      const hasConflict = conflictItems.some(conflict =>
        item.name.toLowerCase().includes(conflict) ||
        item.description?.toLowerCase().includes(conflict)
      );

      if (hasConflict) {
        conflictCount++;
      }
    }

    if (conflictCount > 0) return 0; // Hard exclusion
    if (matchCount > 0) return 0.9; // Bonus for matching

    return 0.5; // Neutral
  }

  private calculateTimeRelevanceScore(item: MenuItem, timeOfDay?: string): number {
    if (!timeOfDay) return 0.5; // Neutral if no time context

    const itemKeywords = this.extractItemKeywords(item);
    let maxWeight = 0;

    for (const keyword of itemKeywords) {
      const weight = this.timeOfDayWeights[keyword.toLowerCase()];
      if (weight) {
        const score = weight[timeOfDay as keyof typeof weight] || 0.5;
        maxWeight = Math.max(maxWeight, score);
      }
    }

    // If no specific match found, use default weights
    if (maxWeight === 0) {
      return this.timeOfDayWeights.default[timeOfDay as keyof typeof this.timeOfDayWeights.default] || 0.5;
    }

    return maxWeight;
  }

  private extractItemKeywords(item: MenuItem): string[] {
    const keywords: string[] = [];

    // Extract from name
    const nameLower = item.name.toLowerCase();
    if (nameLower.includes('coffee') || nameLower.includes('espresso') || nameLower.includes('latte')) {
      keywords.push('coffee', 'beverage');
    }
    if (nameLower.includes('tea')) {
      keywords.push('tea', 'beverage');
    }
    if (nameLower.includes('pancake') || nameLower.includes('waffle') || nameLower.includes('omelette') ||
        nameLower.includes('eggs') || nameLower.includes('breakfast')) {
      keywords.push('breakfast');
    }
    if (nameLower.includes('sandwich') || nameLower.includes('salad') || nameLower.includes('wrap') ||
        nameLower.includes('burger')) {
      keywords.push('lunch');
    }
    if (nameLower.includes('steak') || nameLower.includes('pasta') || nameLower.includes('curry') ||
        nameLower.includes('roast')) {
      keywords.push('dinner');
    }
    if (nameLower.includes('cake') || nameLower.includes('ice cream') || nameLower.includes('pie') ||
        nameLower.includes('cookie') || nameLower.includes('donut')) {
      keywords.push('dessert', 'snack');
    }
    if (nameLower.includes('smoothie') || nameLower.includes('shake') || nameLower.includes('soda')) {
      keywords.push('beverage', 'snack');
    }

    return keywords.length > 0 ? keywords : ['default'];
  }

  private calculatePriceFitScore(item: MenuItem, budget?: { min: number; max: number }): number {
    if (!budget) return 0.5; // Neutral if no budget context

    const { min, max } = budget;

    if (item.price < min) return 0.3; // Below budget is okay
    if (item.price > max) return 0; // Over budget is excluded
    if (item.price >= min && item.price <= max) {
      // Sweet spot is around 70-90% of max
      const fitRatio = item.price / max;
      if (fitRatio >= 0.7 && fitRatio <= 0.9) return 1.0;
      if (fitRatio >= 0.5 && fitRatio <= 0.7) return 0.7;
      return 0.5;
    }

    return 0.5;
  }

  private calculatePreferenceMatchScore(item: MenuItem, preferences: string[]): number {
    if (preferences.length === 0) return 0.5;

    const nameLower = item.name.toLowerCase();
    const descLower = item.description?.toLowerCase() || '';
    const combined = `${nameLower} ${descLower}`;

    let matchCount = 0;
    for (const pref of preferences) {
      if (combined.includes(pref.toLowerCase())) {
        matchCount++;
      }
    }

    return Math.min(1, 0.3 + (matchCount * 0.2));
  }

  private computeTotalScore(factors: ScoringFactors, context?: RecommendationRequest['context']): number {
    // Weighted average of all factors
    const weights = {
      popularity: 0.15,
      dietaryMatch: 0.30, // High weight - dietary restrictions are important
      timeRelevance: 0.20,
      priceFit: 0.20,
      preferenceMatch: 0.15,
      varietyBonus: 0.0,
    };

    let score =
      factors.popularity * weights.popularity +
      factors.dietaryMatch * weights.dietaryMatch +
      factors.timeRelevance * weights.timeRelevance +
      factors.priceFit * weights.priceFit +
      factors.preferenceMatch * weights.preferenceMatch +
      factors.varietyBonus * weights.varietyBonus;

    // If dietary match is 0 (conflict), exclude item entirely
    if (factors.dietaryMatch === 0) {
      return 0;
    }

    // If price is outside budget, heavily penalize
    if (context?.budget && factors.priceFit === 0) {
      return 0;
    }

    return Math.round(score * 100) / 100;
  }

  private generateReasons(item: MenuItem, factors: ScoringFactors, context?: RecommendationRequest['context']): string[] {
    const reasons: string[] = [];

    if (factors.popularity > 0.7) {
      reasons.push('Popular choice');
    }

    if (factors.dietaryMatch > 0.7) {
      const matchingFlags = item.dietaryFlags.filter(flag =>
        context?.dietaryRestrictions?.some(r => r.toLowerCase() === flag.toLowerCase())
      );
      if (matchingFlags.length > 0) {
        reasons.push(`Suitable for ${matchingFlags.join(', ')} diets`);
      }
    }

    if (factors.timeRelevance > 0.8 && context?.timeOfDay) {
      const timeDescriptions: Record<string, string> = {
        breakfast: 'Perfect for breakfast',
        lunch: 'Great lunch option',
        dinner: 'Ideal for dinner',
        lateNight: 'Late night favorite',
      };
      if (timeDescriptions[context.timeOfDay]) {
        reasons.push(timeDescriptions[context.timeOfDay]);
      }
    }

    if (factors.priceFit > 0.8 && context?.budget) {
      const value = ((item.price / context.budget.max) * 100).toFixed(0);
      reasons.push(`Great value at ${value}% of your budget`);
    }

    if (item.variants.length > 2) {
      reasons.push('Highly customizable');
    }

    if (item.modifiers.length > 0) {
      reasons.push(`${item.modifiers.length} add-on option${item.modifiers.length > 1 ? 's' : ''} available`);
    }

    if (item.calories && item.calories < 500) {
      reasons.push('Light option');
    }

    if (item.preparationTime && item.preparationTime < 10) {
      reasons.push('Quick preparation');
    }

    return reasons.length > 0 ? reasons : ['Recommended for you'];
  }

  private formatRecommendation(scored: ScoredItem, menu: { categories: { id: string; name: string }[] }): Recommendation {
    const category = menu.categories.find(c => c.id === scored.item.categoryId);

    return {
      itemId: scored.item.id,
      itemName: scored.item.name,
      score: scored.score,
      reasons: scored.reasons,
      categoryName: category?.name,
      price: scored.item.price,
      imageUrl: scored.item.imageUrl,
    };
  }

  // Complementary item recommendations
  async getComplementaryItems(itemId: string, limit: number = 3): Promise<Recommendation[]> {
    const item = menuStore.getItem(itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    const menu = Array.from(menuStore.getAllMenus()).find(m =>
      m.items.some(i => i.id === itemId)
    );
    if (!menu) {
      throw new Error('Menu not found');
    }

    const availableItems = menu.items.filter(
      i => i.available && i.id !== itemId
    );

    const recommendations: Recommendation[] = [];

    for (const candidate of availableItems) {
      const score = this.calculateComplementarityScore(item, candidate);
      if (score > 0.5) {
        const category = menu.categories.find(c => c.id === candidate.categoryId);
        recommendations.push({
          itemId: candidate.id,
          itemName: candidate.name,
          score,
          reasons: this.generateComplementarityReasons(item, candidate),
          categoryName: category?.name,
          price: candidate.price,
          imageUrl: candidate.imageUrl,
        });
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private calculateComplementarityScore(item1: MenuItem, item2: MenuItem): number {
    let score = 0.3; // Base score

    // Different categories often complement each other
    if (item1.categoryId !== item2.categoryId) {
      score += 0.2;
    }

    // Beverage + food is a classic combo
    const beverageKeywords = ['coffee', 'tea', 'juice', 'soda', 'water', 'smoothie', 'shake'];
    const foodKeywords = ['sandwich', 'burger', 'salad', 'pasta', 'rice', 'bread', 'cake', 'cookie'];

    const item1IsBeverage = beverageKeywords.some(k => item1.name.toLowerCase().includes(k));
    const item2IsBeverage = beverageKeywords.some(k => item2.name.toLowerCase().includes(k));
    const item1IsFood = foodKeywords.some(k => item1.name.toLowerCase().includes(k));
    const item2IsFood = foodKeywords.some(k => item2.name.toLowerCase().includes(k));

    if ((item1IsBeverage && item2IsFood) || (item1IsFood && item2IsBeverage)) {
      score += 0.3;
    }

    // Dietary compatibility
    const item1Flags = new Set(item1.dietaryFlags);
    const item2Flags = new Set(item2.dietaryFlags);

    if (item1Flags.size > 0) {
      const intersection = [...item1Flags].filter(f => item2Flags.has(f));
      score += (intersection.length / item1Flags.size) * 0.2;
    }

    return Math.min(1, score);
  }

  private generateComplementarityReasons(item1: MenuItem, item2: MenuItem): string[] {
    const reasons: string[] = [];

    if (item1.categoryId !== item2.categoryId) {
      reasons.push('Pairs well with different course types');
    }

    const beverageKeywords = ['coffee', 'tea', 'juice', 'soda', 'water', 'smoothie', 'shake'];
    const item1IsBeverage = beverageKeywords.some(k => item1.name.toLowerCase().includes(k));

    if (item1IsBeverage) {
      reasons.push('Perfect with your beverage');
    } else {
      reasons.push('Great accompaniment');
    }

    return reasons;
  }

  // Bundle recommendations
  async getBundleRecommendations(menuId: string, targetPrice: number, itemCount: number = 3): Promise<{
    items: Recommendation[];
    totalPrice: number;
    savings: number;
  }> {
    const menu = menuStore.getFullMenu(menuId);
    if (!menu) {
      throw new Error('Menu not found');
    }

    const availableItems = menu.items.filter(item => item.available);
    const results = this.findOptimalBundle(availableItems, targetPrice, itemCount);

    return {
      items: results.items.map(item => ({
        itemId: item.id,
        itemName: item.name,
        score: 1 - (item.price / targetPrice), // Value score
        reasons: ['Bundle item'],
        categoryName: menu.categories.find(c => c.id === item.categoryId)?.name,
        price: item.price,
        imageUrl: item.imageUrl,
      })),
      totalPrice: results.totalPrice,
      savings: Math.max(0, targetPrice - results.totalPrice),
    };
  }

  private findOptimalBundle(items: MenuItem[], targetPrice: number, count: number): {
    items: MenuItem[];
    totalPrice: number;
  } {
    if (items.length === 0 || count === 0) {
      return { items: [], totalPrice: 0 };
    }

    // Simple greedy approach: pick items closest to target/count ratio
    const sortedByPrice = [...items].sort((a, b) => a.price - b.price);
    const avgPrice = targetPrice / count;

    const selected: MenuItem[] = [];
    let remainingBudget = targetPrice;

    for (const item of sortedByPrice) {
      if (selected.length >= count) break;
      if (item.price <= remainingBudget) {
        selected.push(item);
        remainingBudget -= item.price;
      }
    }

    // If we haven't selected enough items, add the cheapest ones
    if (selected.length < count) {
      for (const item of sortedByPrice) {
        if (selected.length >= count) break;
        if (!selected.includes(item)) {
          selected.push(item);
        }
      }
    }

    return {
      items: selected,
      totalPrice: selected.reduce((sum, item) => sum + item.price, 0),
    };
  }
}

export const recommendationService = new RecommendationService();
