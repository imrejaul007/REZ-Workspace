import { mongoMenuStore } from './mongoMenuStore';
import {
  Menu,
  Category,
  MenuItem,
  Variant,
  Modifier,
  ItemAnalytics,
  CreateMenuRequest,
  UpdateMenuRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateItemRequest,
  UpdateItemRequest,
  ToggleAvailabilityRequest,
  AnalyticsQuery,
} from '../types';

export class MenuService {
  // =============================================================================
  // Menu Operations (MongoDB-backed)
  // =============================================================================
  async createMenu(data: CreateMenuRequest): Promise<Menu> {
    return mongoMenuStore.createMenu({
      restaurantId: data.restaurantId,
      name: data.name,
      description: data.description,
      active: true,
    });
  }

  async getMenu(id: string): Promise<Menu | undefined> {
    return mongoMenuStore.getFullMenu(id);
  }

  async getMenuByRestaurant(restaurantId: string): Promise<Menu | undefined> {
    return mongoMenuStore.getMenuByRestaurant(restaurantId);
  }

  async getAllMenus(restaurantId?: string): Promise<Menu[]> {
    return mongoMenuStore.getAllMenus(restaurantId);
  }

  async updateMenu(id: string, data: UpdateMenuRequest): Promise<Menu | undefined> {
    return mongoMenuStore.updateMenu(id, data);
  }

  async deleteMenu(id: string): Promise<boolean> {
    return mongoMenuStore.deleteMenu(id);
  }

  async publishMenu(id: string): Promise<Menu | undefined> {
    const menu = await mongoMenuStore.getMenu(id);
    if (!menu) return undefined;

    return mongoMenuStore.updateMenu(id, {
      active: true,
      publishedAt: new Date().toISOString(),
    });
  }

  async duplicateMenu(sourceMenuId: string, newName: string): Promise<Menu | undefined> {
    const source = await mongoMenuStore.getFullMenu(sourceMenuId);
    if (!source) return undefined;

    const newMenu = await mongoMenuStore.createMenu({
      restaurantId: source.restaurantId,
      name: newName,
      description: source.description,
      active: false,
    });

    // Duplicate categories and items
    for (const category of source.categories) {
      await mongoMenuStore.createCategory(newMenu.id, {
        name: category.name,
        description: category.description,
        imageUrl: category.imageUrl,
        sortOrder: category.sortOrder,
      });
    }

    // Note: In production, you'd want to handle this more carefully
    // to map old category IDs to new category IDs

    return mongoMenuStore.getFullMenu(newMenu.id);
  }

  // =============================================================================
  // Category Operations (MongoDB-backed)
  // =============================================================================
  async createCategory(data: CreateCategoryRequest): Promise<Category | undefined> {
    return mongoMenuStore.createCategory(data.menuId, {
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl,
      sortOrder: data.sortOrder || 0,
    });
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return mongoMenuStore.getCategory(id);
  }

  async getCategoriesByMenu(menuId: string): Promise<Category[]> {
    return mongoMenuStore.getCategoriesByMenu(menuId);
  }

  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<Category | undefined> {
    return mongoMenuStore.updateCategory(id, data);
  }

  async deleteCategory(menuId: string, categoryId: string): Promise<boolean> {
    return mongoMenuStore.deleteCategory(menuId, categoryId);
  }

  async reorderCategories(menuId: string, categoryIds: string[]): Promise<Category[]> {
    const updatedCategories: Category[] = [];

    for (let i = 0; i < categoryIds.length; i++) {
      const category = await mongoMenuStore.updateCategory(categoryIds[i], { sortOrder: i });
      if (category) {
        updatedCategories.push(category);
      }
    }

    return updatedCategories;
  }

  // =============================================================================
  // Item Operations (MongoDB-backed)
  // =============================================================================
  async createItem(data: CreateItemRequest): Promise<MenuItem | undefined> {
    return mongoMenuStore.createItem(data.menuId, {
      name: data.name,
      description: data.description,
      price: data.price,
      categoryId: data.categoryId,
      imageUrl: data.imageUrl,
      calories: data.calories,
      allergens: data.allergens || [],
      dietaryFlags: (data.dietaryFlags || []) as MenuItem['dietaryFlags'],
      variants: (data.variants || []).map((v, idx) => ({
        ...v,
        id: crypto.randomUUID(),
        name: v.name,
        priceModifier: v.priceModifier,
        available: v.available ?? true,
      })),
      modifiers: (data.modifiers || []).map(m => ({
        ...m,
        id: crypto.randomUUID(),
        name: m.name,
        options: m.options.map(o => ({
          id: crypto.randomUUID(),
          name: o.name,
          price: o.price,
          available: o.available ?? true,
        })),
        required: m.required ?? false,
        multiSelect: m.multiSelect ?? false,
      })),
      available: true,
      preparationTime: data.preparationTime,
      sortOrder: data.sortOrder || 0,
    });
  }

  async getItem(id: string): Promise<MenuItem | undefined> {
    return mongoMenuStore.getItem(id);
  }

  async getItemsByCategory(categoryId: string): Promise<MenuItem[]> {
    return mongoMenuStore.getItemsByCategory(categoryId);
  }

  async getItemsByMenu(menuId: string): Promise<MenuItem[]> {
    return mongoMenuStore.getItemsByMenu(menuId);
  }

  async updateItem(id: string, data: UpdateItemRequest): Promise<MenuItem | undefined> {
    return mongoMenuStore.updateItem(id, {
      ...data,
      dietaryFlags: data.dietaryFlags,
    });
  }

  async deleteItem(menuId: string, itemId: string): Promise<boolean> {
    return mongoMenuStore.deleteItem(menuId, itemId);
  }

  async searchItems(menuId: string, query: string): Promise<MenuItem[]> {
    return mongoMenuStore.searchItems(menuId, query);
  }

  // =============================================================================
  // Availability Operations (MongoDB-backed)
  // =============================================================================
  async toggleAvailability(data: ToggleAvailabilityRequest): Promise<boolean> {
    switch (data.type) {
      case 'menu':
        const menuUpdated = await mongoMenuStore.updateMenu(data.id, { active: data.available });
        return !!menuUpdated;
      case 'category':
        const categoryUpdated = await mongoMenuStore.toggleCategoryAvailability(data.id, data.available);
        return !!categoryUpdated;
      case 'item':
        const itemUpdated = await mongoMenuStore.toggleItemAvailability(data.id, data.available);
        return !!itemUpdated;
      default:
        return false;
    }
  }

  async bulkToggleAvailability(ids: string[], available: boolean, type: 'category' | 'item'): Promise<number> {
    return mongoMenuStore.bulkUpdateAvailability(ids, available, type);
  }

  // =============================================================================
  // Variant Operations (MongoDB-backed)
  // =============================================================================
  async addVariant(itemId: string, variant: Omit<Variant, 'id'>): Promise<Variant | undefined> {
    return mongoMenuStore.addVariant(itemId, variant);
  }

  async updateVariant(itemId: string, variantId: string, data: Partial<Variant>): Promise<Variant | undefined> {
    return mongoMenuStore.updateVariant(itemId, variantId, data);
  }

  async deleteVariant(itemId: string, variantId: string): Promise<boolean> {
    return mongoMenuStore.deleteVariant(itemId, variantId);
  }

  // =============================================================================
  // Modifier Operations (MongoDB-backed)
  // =============================================================================
  async addModifier(itemId: string, modifier: Omit<Modifier, 'id'>): Promise<Modifier | undefined> {
    return mongoMenuStore.addModifier(itemId, modifier);
  }

  async updateModifier(itemId: string, modifierId: string, data: Partial<Modifier>): Promise<Modifier | undefined> {
    return mongoMenuStore.updateModifier(itemId, modifierId, data);
  }

  async deleteModifier(itemId: string, modifierId: string): Promise<boolean> {
    return mongoMenuStore.deleteModifier(itemId, modifierId);
  }

  // =============================================================================
  // Analytics Operations (MongoDB-backed)
  // =============================================================================
  async recordItemView(itemId: string): Promise<void> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    await mongoMenuStore.recordItemView(itemId, startOfDay, endOfDay);
  }

  async recordItemOrder(itemId: string, price: number): Promise<void> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    await mongoMenuStore.recordItemOrder(itemId, price, startOfDay, endOfDay);
  }

  async getAnalytics(query: AnalyticsQuery): Promise<ItemAnalytics[]> {
    return mongoMenuStore.getAnalytics(query.menuId, query.periodStart, query.periodEnd);
  }

  async getTopItems(menuId: string, limit: number = 10): Promise<ItemAnalytics[]> {
    const menu = await mongoMenuStore.getFullMenu(menuId);
    if (!menu) return [];

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    const analytics = await mongoMenuStore.getAnalytics(menuId, startOfMonth, endOfMonth);

    return analytics
      .sort((a, b) => b.orders - a.orders)
      .slice(0, limit);
  }

  async getLowPerformingItems(menuId: string, limit: number = 10): Promise<ItemAnalytics[]> {
    const analytics = await this.getTopItems(menuId, 100);
    return analytics
      .filter(a => a.orders > 0)
      .sort((a, b) => a.conversionRate - b.conversionRate)
      .slice(0, limit);
  }

  // =============================================================================
  // Menu Statistics
  // =============================================================================
  async getMenuStatistics(menuId: string): Promise<{
    totalItems: number;
    availableItems: number;
    totalCategories: number;
    averageItemPrice: number;
    priceRange: { min: number; max: number };
    dietaryBreakdown: Record<string, number>;
  }> {
    const menu = await mongoMenuStore.getFullMenu(menuId);
    if (!menu) {
      return {
        totalItems: 0,
        availableItems: 0,
        totalCategories: 0,
        averageItemPrice: 0,
        priceRange: { min: 0, max: 0 },
        dietaryBreakdown: {},
      };
    }

    const items = menu.items;
    const prices = items.map(i => i.price);

    const dietaryBreakdown: Record<string, number> = {};
    for (const item of items) {
      for (const flag of item.dietaryFlags) {
        dietaryBreakdown[flag] = (dietaryBreakdown[flag] || 0) + 1;
      }
    }

    return {
      totalItems: items.length,
      availableItems: items.filter(i => i.available).length,
      totalCategories: menu.categories.length,
      averageItemPrice: prices.length > 0
        ? prices.reduce((a, b) => a + b, 0) / prices.length
        : 0,
      priceRange: {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 0,
      },
      dietaryBreakdown,
    };
  }
}

export const menuService = new MenuService();
