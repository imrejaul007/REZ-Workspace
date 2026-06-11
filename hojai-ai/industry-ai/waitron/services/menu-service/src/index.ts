/**
 * Menu Service - Menu Management Backend
 * Part of WAITRON - Restaurant AI Operating System
 */

import { v4 as uuidv4 } from 'uuid';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  prepTime: number;
  isVeg: boolean;
  isAvailable: boolean;
  tags: string[];
  image?: string;
  calories?: number;
  allergens?: string[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
}

export class MenuService {
  private menu: Map<string, MenuItem> = new Map();
  private categories: Map<string, Category> = new Map();

  constructor(initialMenu?: MenuItem[]) {
    if (initialMenu) {
      initialMenu.forEach(item => this.menu.set(item.id, item));
    }
  }

  // Menu Item Operations
  async getAll(filters?: {
    category?: string;
    isVeg?: boolean;
    isAvailable?: boolean;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<MenuItem[]> {
    let items = Array.from(this.menu.values());

    if (filters) {
      if (filters.category) {
        items = items.filter(i => i.category === filters.category);
      }
      if (filters.isVeg !== undefined) {
        items = items.filter(i => i.isVeg === filters.isVeg);
      }
      if (filters.isAvailable !== undefined) {
        items = items.filter(i => i.isAvailable === filters.isAvailable);
      }
      if (filters.minPrice) {
        items = items.filter(i => i.price >= filters.minPrice!);
      }
      if (filters.maxPrice) {
        items = items.filter(i => i.price <= filters.maxPrice!);
      }
    }

    return items;
  }

  async getById(id: string): Promise<MenuItem | undefined> {
    return this.menu.get(id);
  }

  async create(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    const newItem: MenuItem = { ...item, id: uuidv4() };
    this.menu.set(newItem.id, newItem);
    return newItem;
  }

  async update(id: string, updates: Partial<MenuItem>): Promise<MenuItem | undefined> {
    const item = this.menu.get(id);
    if (!item) return undefined;

    const updated = { ...item, ...updates, id };
    this.menu.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.menu.delete(id);
  }

  async updateAvailability(id: string, isAvailable: boolean): Promise<MenuItem | undefined> {
    return this.update(id, { isAvailable });
  }

  // Category Operations
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values())
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const newCategory: Category = { ...category, id: uuidv4() };
    this.categories.set(newCategory.id, newCategory);
    return newCategory;
  }

  // Analytics
  async getPopularItems(limit: number = 10): Promise<MenuItem[]> {
    // Return items with 'popular' or 'bestseller' tags
    return Array.from(this.menu.values())
      .filter(item => item.tags.includes('popular') || item.tags.includes('bestseller'))
      .slice(0, limit);
  }

  async getStats(): Promise<{
    totalItems: number;
    availableItems: number;
    avgPrice: number;
    byCategory: Record<string, number>;
  }> {
    const items = Array.from(this.menu.values());

    return {
      totalItems: items.length,
      availableItems: items.filter(i => i.isAvailable).length,
      avgPrice: items.length > 0
        ? Math.round(items.reduce((sum, i) => sum + i.price, 0) / items.length)
        : 0,
      byCategory: items.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

export default MenuService;
