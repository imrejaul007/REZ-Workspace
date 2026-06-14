/**
 * Menu Service
 *
 * Business logic for menu management
 */

import { Menu, IMenu, IMenuItem, IMenuCategory } from '../models/Menu';
import { logger } from '../config/logger';

const log = (msg: string, meta?) => logger.info(`[menu] ${msg}`, meta);

export interface CreateMenuInput {
  restaurantId: string;
  branchId?: string;
  name: string;
  description?: string;
  categories?: IMenuCategory[];
}

export interface UpdateMenuInput {
  name?: string;
  description?: string;
  isActive?: boolean;
  effectiveFrom?: Date;
  effectiveUntil?: Date;
}

export interface MenuItemInput {
  name: string;
  description?: string;
  price: number;
  priceUnit?: 'INR' | 'USD';
  images?: string[];
  tags?: string[];
  allergens?: string[];
  spices?: 1 | 2 | 3 | 4 | 5;
  isAvailable?: boolean;
  isFeatured?: boolean;
  preparationTime?: number;
  calories?: number;
  customization?: {
    required: boolean;
    options: Array<{ name: string; priceModifier: number }>;
  };
}

export interface CategoryInput {
  name: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

/**
 * FIX (security): Generate secure ID using crypto
 */
function generateSecureId(prefix: string, length: number = 4): string {
  try {
    const { randomUUID } = require('crypto');
    const uuid = randomUUID().replace(/-/g, '').substring(0, length).toUpperCase();
    return `${prefix}${Date.now().toString(36)}${uuid}`;
  } catch {
    return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).substr(2, length).toUpperCase()}`;
  }
}

function generateMenuId(): string {
  return generateSecureId('MN', 4);
}

function generateCategoryId(): string {
  return 'CAT' + Date.now().toString(36);
}

function generateItemId(): string {
  return generateSecureId('ITM', 4);
}

class MenuService {
  /**
   * Create a new menu
   */
  async createMenu(input: CreateMenuInput): Promise<IMenu> {
    const menuId = generateMenuId();

    const menu = new Menu({
      menuId,
      ...input,
      categories: input.categories || [],
      isActive: true,
      version: 1,
    });

    await menu.save();
    log('Menu created', { menuId, restaurantId: input.restaurantId });

    return menu;
  }

  /**
   * Get menu by ID
   */
  async getMenu(menuId: string): Promise<IMenu | null> {
    return Menu.findOne({ menuId });
  }

  /**
   * Get menu for restaurant
   */
  async getMenuByRestaurant(
    restaurantId: string,
    branchId?: string
  ): Promise<IMenu | null> {
    const query: unknown = { restaurantId, isActive: true };

    if (branchId) {
      query.$or = [
        { branchId },
        { branchId: { $exists: false } },
      ];
    }

    return Menu.findOne(query).sort({ version: -1 });
  }

  /**
   * Update menu
   */
  async updateMenu(menuId: string, input: UpdateMenuInput): Promise<IMenu | null> {
    const menu = await Menu.findOneAndUpdate(
      { menuId },
      { $set: input },
      { new: true }
    );

    if (menu) {
      log('Menu updated', { menuId });
    }

    return menu;
  }

  /**
   * Delete menu (soft delete)
   */
  async deleteMenu(menuId: string): Promise<boolean> {
    const result = await Menu.findOneAndUpdate(
      { menuId },
      { $set: { isActive: false } }
    );

    if (result) {
      log('Menu deleted', { menuId });
      return true;
    }

    return false;
  }

  /**
   * Add category to menu
   */
  async addCategory(menuId: string, category: CategoryInput): Promise<IMenu | null> {
    const menu = await Menu.findOne({ menuId });
    if (!menu) return null;

    const categoryId = generateCategoryId();
    const newCategory: IMenuCategory = {
      categoryId,
      name: category.name,
      description: category.description,
      displayOrder: category.displayOrder ?? menu.categories.length,
      isActive: category.isActive ?? true,
      items: [],
    };

    menu.categories.push(newCategory);
    menu.version += 1;
    await menu.save();

    log('Category added', { menuId, categoryId });
    return menu;
  }

  /**
   * Update category
   */
  async updateCategory(
    menuId: string,
    categoryId: string,
    updates: Partial<CategoryInput>
  ): Promise<IMenu | null> {
    const menu = await Menu.findOne({ menuId });
    if (!menu) return null;

    const categoryIndex = menu.categories.findIndex(c => c.categoryId === categoryId);
    if (categoryIndex === -1) return null;

    menu.categories[categoryIndex] = {
      ...menu.categories[categoryIndex],
      ...updates,
    };

    menu.version += 1;
    await menu.save();

    log('Category updated', { menuId, categoryId });
    return menu;
  }

  /**
   * Remove category
   */
  async removeCategory(menuId: string, categoryId: string): Promise<IMenu | null> {
    const menu = await Menu.findOneAndUpdate(
      { menuId },
      {
        $pull: { categories: { categoryId } },
        $inc: { version: 1 },
      },
      { new: true }
    );

    if (menu) {
      log('Category removed', { menuId, categoryId });
    }

    return menu;
  }

  /**
   * Add item to category
   */
  async addItem(
    menuId: string,
    categoryId: string,
    item: MenuItemInput
  ): Promise<IMenu | null> {
    const menu = await Menu.findOne({ menuId });
    if (!menu) return null;

    const categoryIndex = menu.categories.findIndex(c => c.categoryId === categoryId);
    if (categoryIndex === -1) return null;

    const itemId = generateItemId();
    const newItem: IMenuItem = {
      itemId,
      name: item.name,
      description: item.description,
      price: item.price,
      priceUnit: item.priceUnit || 'INR',
      images: item.images || [],
      tags: item.tags || [],
      allergens: item.allergens || [],
      spices: item.spices,
      isAvailable: item.isAvailable ?? true,
      isFeatured: item.isFeatured ?? false,
      preparationTime: item.preparationTime,
      calories: item.calories,
      customization: item.customization,
    };

    menu.categories[categoryIndex].items.push(newItem);
    menu.version += 1;
    await menu.save();

    log('Item added', { menuId, categoryId, itemId });
    return menu;
  }

  /**
   * Update item
   */
  async updateItem(
    menuId: string,
    categoryId: string,
    itemId: string,
    updates: Partial<MenuItemInput>
  ): Promise<IMenu | null> {
    const menu = await Menu.findOne({ menuId });
    if (!menu) return null;

    const categoryIndex = menu.categories.findIndex(c => c.categoryId === categoryId);
    if (categoryIndex === -1) return null;

    const itemIndex = menu.categories[categoryIndex].items.findIndex(i => i.itemId === itemId);
    if (itemIndex === -1) return null;

    menu.categories[categoryIndex].items[itemIndex] = {
      ...menu.categories[categoryIndex].items[itemIndex],
      ...updates,
    };

    menu.version += 1;
    await menu.save();

    log('Item updated', { menuId, categoryId, itemId });
    return menu;
  }

  /**
   * Remove item
   */
  async removeItem(
    menuId: string,
    categoryId: string,
    itemId: string
  ): Promise<IMenu | null> {
    const menu = await Menu.findOne({ menuId });
    if (!menu) return null;

    const categoryIndex = menu.categories.findIndex(c => c.categoryId === categoryId);
    if (categoryIndex === -1) return null;

    menu.categories[categoryIndex].items = menu.categories[categoryIndex].items.filter(
      i => i.itemId !== itemId
    );

    menu.version += 1;
    await menu.save();

    log('Item removed', { menuId, categoryId, itemId });
    return menu;
  }

  /**
   * Toggle item availability
   */
  async toggleItemAvailability(
    menuId: string,
    categoryId: string,
    itemId: string
  ): Promise<IMenu | null> {
    const menu = await Menu.findOne({ menuId });
    if (!menu) return null;

    const categoryIndex = menu.categories.findIndex(c => c.categoryId === categoryId);
    if (categoryIndex === -1) return null;

    const itemIndex = menu.categories[categoryIndex].items.findIndex(i => i.itemId === itemId);
    if (itemIndex === -1) return null;

    menu.categories[categoryIndex].items[itemIndex].isAvailable =
      !menu.categories[categoryIndex].items[itemIndex].isAvailable;

    menu.version += 1;
    await menu.save();

    log('Item availability toggled', {
      menuId,
      categoryId,
      itemId,
      isAvailable: menu.categories[categoryIndex].items[itemIndex].isAvailable,
    });

    return menu;
  }

  /**
   * Get available items from menu
   */
  async getAvailableItems(
    menuId: string
  ): Promise<Array<{ categoryId: string; categoryName: string; items: IMenuItem[] }>> {
    const menu = await Menu.findOne({ menuId, isActive: true });
    if (!menu) return [];

    return menu.categories
      .filter(c => c.isActive)
      .map(c => ({
        categoryId: c.categoryId,
        categoryName: c.name,
        items: c.items.filter(i => i.isAvailable),
      }));
  }
}

export const menuService = new MenuService();
