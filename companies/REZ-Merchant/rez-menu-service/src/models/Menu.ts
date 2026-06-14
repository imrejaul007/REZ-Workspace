import { v4 as uuidv4 } from 'uuid';
import {
  Menu,
  Category,
  MenuItem,
  Variant,
  Modifier,
  ItemAnalytics,
  MenuSchema,
  CategorySchema,
  MenuItemSchema,
} from '../types';

// In-memory storage (replace with database in production)
class MenuStore {
  private menus: Map<string, Menu> = new Map();
  private categories: Map<string, Category> = new Map();
  private items: Map<string, MenuItem> = new Map();
  private analytics: Map<string, ItemAnalytics> = new Map();

  // Menu Operations
  createMenu(data: Omit<Menu, 'id' | 'categories' | 'items' | 'version' | 'createdAt' | 'updatedAt'>): Menu {
    const now = new Date().toISOString();
    const menu: Menu = {
      id: uuidv4(),
      ...data,
      categories: [],
      items: [],
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    MenuSchema.parse(menu);
    this.menus.set(menu.id, menu);
    return menu;
  }

  getMenu(id: string): Menu | undefined {
    return this.menus.get(id);
  }

  getMenuByRestaurant(restaurantId: string): Menu | undefined {
    for (const menu of this.menus.values()) {
      if (menu.restaurantId === restaurantId && menu.active) {
        return menu;
      }
    }
    return undefined;
  }

  getAllMenus(restaurantId?: string): Menu[] {
    const menus = Array.from(this.menus.values());
    if (restaurantId) {
      return menus.filter(m => m.restaurantId === restaurantId);
    }
    return menus;
  }

  updateMenu(id: string, data: Partial<Menu>): Menu | undefined {
    const menu = this.menus.get(id);
    if (!menu) return undefined;

    const updatedMenu: Menu = {
      ...menu,
      ...data,
      id: menu.id,
      version: menu.version + 1,
      updatedAt: new Date().toISOString(),
    };
    MenuSchema.parse(updatedMenu);
    this.menus.set(id, updatedMenu);
    return updatedMenu;
  }

  deleteMenu(id: string): boolean {
    return this.menus.delete(id);
  }

  // Category Operations
  createCategory(menuId: string, data: Omit<Category, 'id' | 'available' | 'createdAt' | 'updatedAt'>): Category | undefined {
    const menu = this.menus.get(menuId);
    if (!menu) return undefined;

    const now = new Date().toISOString();
    const category: Category = {
      id: uuidv4(),
      ...data,
      available: true,
      createdAt: now,
      updatedAt: now,
    };
    CategorySchema.parse(category);

    this.categories.set(category.id, category);
    menu.categories.push(category);
    menu.updatedAt = now;
    return category;
  }

  getCategory(id: string): Category | undefined {
    return this.categories.get(id);
  }

  getCategoriesByMenu(menuId: string): Category[] {
    const menu = this.menus.get(menuId);
    return menu?.categories || [];
  }

  updateCategory(id: string, data: Partial<Category>): Category | undefined {
    const category = this.categories.get(id);
    if (!category) return undefined;

    const updatedCategory: Category = {
      ...category,
      ...data,
      id: category.id,
      updatedAt: new Date().toISOString(),
    };
    CategorySchema.parse(updatedCategory);
    this.categories.set(id, updatedCategory);

    // Update in menu
    for (const menu of this.menus.values()) {
      const idx = menu.categories.findIndex(c => c.id === id);
      if (idx !== -1) {
        menu.categories[idx] = updatedCategory;
        break;
      }
    }

    return updatedCategory;
  }

  deleteCategory(menuId: string, categoryId: string): boolean {
    const menu = this.menus.get(menuId);
    if (!menu) return false;

    const idx = menu.categories.findIndex(c => c.id === categoryId);
    if (idx === -1) return false;

    menu.categories.splice(idx, 1);
    this.categories.delete(categoryId);

    // Remove items in category
    for (const item of this.items.values()) {
      if (item.categoryId === categoryId) {
        this.items.delete(item.id);
      }
    }

    return true;
  }

  toggleCategoryAvailability(categoryId: string, available: boolean): Category | undefined {
    return this.updateCategory(categoryId, { available });
  }

  // Item Operations
  createItem(menuId: string, data: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>): MenuItem | undefined {
    const menu = this.menus.get(menuId);
    if (!menu) return undefined;

    const category = menu.categories.find(c => c.id === data.categoryId);
    if (!category) return undefined;

    const now = new Date().toISOString();
    const item: MenuItem = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    MenuItemSchema.parse(item);

    this.items.set(item.id, item);
    menu.items.push(item);
    menu.updatedAt = now;
    return item;
  }

  getItem(id: string): MenuItem | undefined {
    return this.items.get(id);
  }

  getItemsByCategory(categoryId: string): MenuItem[] {
    return Array.from(this.items.values()).filter(item => item.categoryId === categoryId);
  }

  getItemsByMenu(menuId: string): MenuItem[] {
    const menu = this.menus.get(menuId);
    return menu?.items || [];
  }

  updateItem(id: string, data: Partial<MenuItem>): MenuItem | undefined {
    const item = this.items.get(id);
    if (!item) return undefined;

    const updatedItem: MenuItem = {
      ...item,
      ...data,
      id: item.id,
      categoryId: data.categoryId || item.categoryId,
      updatedAt: new Date().toISOString(),
    };
    MenuItemSchema.parse(updatedItem);
    this.items.set(id, updatedItem);

    // Update in menu
    for (const menu of this.menus.values()) {
      const idx = menu.items.findIndex(i => i.id === id);
      if (idx !== -1) {
        menu.items[idx] = updatedItem;
        break;
      }
    }

    return updatedItem;
  }

  deleteItem(menuId: string, itemId: string): boolean {
    const menu = this.menus.get(menuId);
    if (!menu) return false;

    const idx = menu.items.findIndex(i => i.id === itemId);
    if (idx === -1) return false;

    menu.items.splice(idx, 1);
    this.items.delete(itemId);
    return true;
  }

  toggleItemAvailability(itemId: string, available: boolean): MenuItem | undefined {
    return this.updateItem(itemId, { available });
  }

  // Variant Operations
  addVariant(itemId: string, variant: Omit<Variant, 'id'>): Variant | undefined {
    const item = this.items.get(itemId);
    if (!item) return undefined;

    const newVariant: Variant = {
      id: uuidv4(),
      ...variant,
    };
    item.variants.push(newVariant);
    item.updatedAt = new Date().toISOString();
    return newVariant;
  }

  updateVariant(itemId: string, variantId: string, data: Partial<Variant>): Variant | undefined {
    const item = this.items.get(itemId);
    if (!item) return undefined;

    const idx = item.variants.findIndex(v => v.id === variantId);
    if (idx === -1) return undefined;

    item.variants[idx] = { ...item.variants[idx], ...data };
    item.updatedAt = new Date().toISOString();
    return item.variants[idx];
  }

  deleteVariant(itemId: string, variantId: string): boolean {
    const item = this.items.get(itemId);
    if (!item) return false;

    const idx = item.variants.findIndex(v => v.id === variantId);
    if (idx === -1) return false;

    item.variants.splice(idx, 1);
    item.updatedAt = new Date().toISOString();
    return true;
  }

  // Modifier Operations
  addModifier(itemId: string, modifier: Omit<Modifier, 'id'>): Modifier | undefined {
    const item = this.items.get(itemId);
    if (!item) return undefined;

    const newModifier: Modifier = {
      id: uuidv4(),
      ...modifier,
    };
    item.modifiers.push(newModifier);
    item.updatedAt = new Date().toISOString();
    return newModifier;
  }

  updateModifier(itemId: string, modifierId: string, data: Partial<Modifier>): Modifier | undefined {
    const item = this.items.get(itemId);
    if (!item) return undefined;

    const idx = item.modifiers.findIndex(m => m.id === modifierId);
    if (idx === -1) return undefined;

    item.modifiers[idx] = { ...item.modifiers[idx], ...data };
    item.updatedAt = new Date().toISOString();
    return item.modifiers[idx];
  }

  deleteModifier(itemId: string, modifierId: string): boolean {
    const item = this.items.get(itemId);
    if (!item) return false;

    const idx = item.modifiers.findIndex(m => m.id === modifierId);
    if (idx === -1) return false;

    item.modifiers.splice(idx, 1);
    item.updatedAt = new Date().toISOString();
    return true;
  }

  // Analytics Operations
  recordItemView(itemId: string, periodStart: string, periodEnd: string): void {
    const key = `${itemId}:${periodStart}:${periodEnd}`;
    let analytics = this.analytics.get(key);

    const item = this.items.get(itemId);

    if (!analytics) {
      analytics = {
        itemId,
        itemName: item?.name || 'Unknown',
        categoryId: item?.categoryId || '',
        views: 0,
        orders: 0,
        conversionRate: 0,
        revenue: 0,
        reviewCount: 0,
        periodStart,
        periodEnd,
      };
      this.analytics.set(key, analytics);
    }

    analytics.views++;
    if (analytics.views > 0) {
      analytics.conversionRate = analytics.orders / analytics.views;
    }
  }

  recordItemOrder(itemId: string, revenue: number, periodStart: string, periodEnd: string): void {
    const key = `${itemId}:${periodStart}:${periodEnd}`;
    let analytics = this.analytics.get(key);

    const item = this.items.get(itemId);

    if (!analytics) {
      analytics = {
        itemId,
        itemName: item?.name || 'Unknown',
        categoryId: item?.categoryId || '',
        views: 0,
        orders: 0,
        conversionRate: 0,
        revenue: 0,
        reviewCount: 0,
        periodStart,
        periodEnd,
      };
      this.analytics.set(key, analytics);
    }

    analytics.orders++;
    analytics.revenue += revenue;
    if (analytics.views > 0) {
      analytics.conversionRate = analytics.orders / analytics.views;
    }
  }

  getAnalytics(menuId: string, periodStart: string, periodEnd: string): ItemAnalytics[] {
    const menu = this.menus.get(menuId);
    if (!menu) return [];

    const result: ItemAnalytics[] = [];
    for (const item of menu.items) {
      const key = `${item.id}:${periodStart}:${periodEnd}`;
      const itemAnalytics = this.analytics.get(key);
      if (itemAnalytics) {
        result.push(itemAnalytics);
      }
    }
    return result;
  }

  // Bulk Operations
  bulkUpdateAvailability(ids: string[], available: boolean, type: 'category' | 'item'): number {
    let updated = 0;
    for (const id of ids) {
      if (type === 'category') {
        const result = this.updateCategory(id, { available });
        if (result) updated++;
      } else {
        const result = this.updateItem(id, { available });
        if (result) updated++;
      }
    }
    return updated;
  }

  // Search
  searchItems(menuId: string, query: string): MenuItem[] {
    const menu = this.menus.get(menuId);
    if (!menu) return [];

    const lowerQuery = query.toLowerCase();
    return menu.items.filter(item =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.description?.toLowerCase().includes(lowerQuery) ||
      item.allergens.some(a => a.toLowerCase().includes(lowerQuery))
    );
  }

  // Get full menu with all nested data
  getFullMenu(menuId: string): Menu | undefined {
    const menu = this.menus.get(menuId);
    if (!menu) return undefined;

    return {
      ...menu,
      items: menu.items.map(item => ({
        ...item,
        variants: item.variants,
        modifiers: item.modifiers,
      })),
    };
  }
}

// Singleton instance
export const menuStore = new MenuStore();
