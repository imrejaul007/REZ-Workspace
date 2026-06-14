/**
 * ReZ Restaurant OS - Recipe Costing Module
 * Menu item cost calculation and margin analysis
 */

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  wastePercent?: number;
}

export interface RecipeCost {
  itemId: string;
  itemName: string;
  ingredients: Ingredient[];
  totalCost: number;
  sellingPrice: number;
  grossMargin: number;
  marginPercent: number;
  foodCostPercent: number;
}

export interface MenuMargin {
  itemId: string;
  itemName: string;
  cost: number;
  price: number;
  margin: number;
  marginPercent: number;
  category: string;
  popularity: number;
}

export class RecipeCosting {
  /**
   * Calculate full recipe cost
   */
  async calculateItemCost(itemId: string): Promise<RecipeCost> {
    const recipe = await this.getRecipe(itemId);

    let totalCost = 0;
    const ingredients: Ingredient[] = [];

    for (const ing of recipe.ingredients) {
      const cost = ing.quantity * ing.costPerUnit;
      const wasteCost = (ing.wastePercent || 0) * cost / 100;
      totalCost += cost + wasteCost;
      ingredients.push({ ...ing, costPerUnit: cost });
    }

    return {
      itemId,
      itemName: recipe.name,
      ingredients,
      totalCost,
      sellingPrice: recipe.price,
      grossMargin: recipe.price - totalCost,
      marginPercent: ((recipe.price - totalCost) / recipe.price) * 100,
      foodCostPercent: (totalCost / recipe.price) * 100
    };
  }

  /**
   * Get menu margins for entire menu
   */
  async getMenuMargins(storeId: string): Promise<MenuMargin[]> {
    const menu = await this.getMenuItems(storeId);
    const margins: MenuMargin[] = [];

    for (const item of menu) {
      const cost = await this.calculateItemCost(item.id);
      margins.push({
        itemId: item.id,
        itemName: item.name,
        cost: cost.totalCost,
        price: item.price,
        margin: item.price - cost.totalCost,
        marginPercent: ((item.price - cost.totalCost) / item.price) * 100,
        category: item.category,
        popularity: item.popularity
      });
    }

    return margins.sort((a, b) => b.marginPercent - a.marginPercent);
  }

  /**
   * Suggest price for target margin
   */
  async suggestPrice(itemId: string, targetMargin: number): Promise<number> {
    const cost = await this.calculateItemCost(itemId);
    const suggestedPrice = cost.totalCost / (1 - targetMargin / 100);
    return Math.round(suggestedPrice);
  }

  /**
   * Get top performers
   */
  async getTopPerformers(storeId: string, limit: number = 10): Promise<MenuMargin[]> {
    const margins = await this.getMenuMargins(storeId);
    return margins
      .filter(m => m.marginPercent > 60 && m.popularity > 50)
      .slice(0, limit);
  }

  /**
   * Get underperformers
   */
  async getUnderperformers(storeId: string, limit: number = 10): Promise<MenuMargin[]> {
    const margins = await this.getMenuMargins(storeId);
    return margins
      .filter(m => m.marginPercent < 30)
      .slice(0, limit);
  }

  /**
   * Get category analysis
   */
  async getCategoryAnalysis(storeId: string): Promise<Record<string, {
    avgMargin: number;
    itemCount: number;
    totalRevenue: number;
  }>> {
    const margins = await this.getMenuMargins(storeId);
    const categories: Record<string, MenuMargin[]> = {};

    for (const m of margins) {
      if (!categories[m.category]) categories[m.category] = [];
      categories[m.category].push(m);
    }

    const analysis: Record<string, { avgMargin: number; itemCount: number; totalRevenue: number }> = {};

    for (const [cat, items] of Object.entries(categories)) {
      analysis[cat] = {
        avgMargin: items.reduce((sum, i) => sum + i.marginPercent, 0) / items.length,
        itemCount: items.length,
        totalRevenue: items.reduce((sum, i) => sum + (i.price * i.popularity), 0)
      };
    }

    return analysis;
  }

  private async getRecipe(itemId: string): Promise<{ name: string; price: number; ingredients: Ingredient[] }> {
    // In production: query database
    return {
      name: 'Burger',
      price: 199,
      ingredients: [
        { name: 'Bun', quantity: 1, unit: 'pcs', costPerUnit: 15 },
        { name: 'Patty', quantity: 1, unit: 'pcs', costPerUnit: 45, wastePercent: 5 },
        { name: 'Lettuce', quantity: 20, unit: 'g', costPerUnit: 0.5, wastePercent: 20 },
        { name: 'Cheese', quantity: 15, unit: 'g', costPerUnit: 1.2 }
      ]
    };
  }

  private async getMenuItems(storeId: string): Promise<unknown[]> {
    // In production: query database
    return [];
  }
}

export const recipeCosting = new RecipeCosting();
