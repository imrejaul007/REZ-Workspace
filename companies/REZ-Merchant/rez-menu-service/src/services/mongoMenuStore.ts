import { v4 as uuidv4 } from 'uuid';
import mongoose, { Types } from 'mongoose';
import {
  MenuModel,
  CategoryModel,
  MenuItemModel,
  ItemAnalyticsModel,
  IMenu,
  ICategory,
  IMenuItem,
} from '../models/mongoDB';
import { Menu, Category, MenuItem, Variant, Modifier, ItemAnalytics } from '../types';

// =============================================================================
// MongoDB Menu Store - Replaces in-memory storage with persistent database
// =============================================================================
export class MongoMenuStore {
  // =============================================================================
  // Menu Operations
  // =============================================================================
  async createMenu(data: {
    restaurantId: string;
    name: string;
    description?: string;
    active?: boolean;
  }): Promise<Menu> {
    const menu = new MenuModel({
      restaurantId: data.restaurantId,
      name: data.name,
      description: data.description,
      active: data.active ?? true,
      version: 1,
    });

    await menu.save();

    return this.mapMenuToType(menu);
  }

  async getMenu(id: string): Promise<Menu | undefined> {
    const menu = await MenuModel.findById(id).lean();
    if (!menu) return undefined;

    return this.mapMenuDocToType(menu);
  }

  async getMenuByRestaurant(restaurantId: string): Promise<Menu | undefined> {
    const menu = await MenuModel.findOne({
      restaurantId,
      active: true,
    }).lean();

    if (!menu) return undefined;

    return this.mapMenuDocToType(menu);
  }

  async getAllMenus(restaurantId?: string): Promise<Menu[]> {
    const query = restaurantId ? { restaurantId } : {};
    const menus = await MenuModel.find(query).sort({ createdAt: -1 }).lean();

    return Promise.all(menus.map((m) => this.mapMenuDocToType(m)));
  }

  async updateMenu(
    id: string,
    data: Partial<Menu>
  ): Promise<Menu | undefined> {
    const menu = await MenuModel.findByIdAndUpdate(
      id,
      {
        $set: {
          ...data,
          version: (await this.getMenu(id))?.version ?? 0 + 1,
        },
      },
      { new: true }
    ).lean();

    if (!menu) return undefined;

    return this.mapMenuDocToType(menu);
  }

  async deleteMenu(id: string): Promise<boolean> {
    const result = await MenuModel.findByIdAndDelete(id);
    if (result) {
      // Delete associated categories and items
      await CategoryModel.deleteMany({ menuId: id });
      await MenuItemModel.deleteMany({ menuId: id });
      return true;
    }
    return false;
  }

  // =============================================================================
  // Category Operations
  // =============================================================================
  async createCategory(
    menuId: string,
    data: {
      name: string;
      description?: string;
      imageUrl?: string;
      sortOrder?: number;
    }
  ): Promise<Category | undefined> {
    const menu = await MenuModel.findById(menuId);
    if (!menu) return undefined;

    const category = new CategoryModel({
      menuId,
      restaurantId: menu.restaurantId,
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl,
      sortOrder: data.sortOrder ?? 0,
      available: true,
    });

    await category.save();

    return this.mapCategoryToType(category);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const category = await CategoryModel.findById(id).lean();
    if (!category) return undefined;

    return this.mapCategoryDocToType(category);
  }

  async getCategoriesByMenu(menuId: string): Promise<Category[]> {
    const categories = await CategoryModel.find({ menuId })
      .sort({ sortOrder: 1 })
      .lean();

    return categories.map((c) => this.mapCategoryDocToType(c));
  }

  async updateCategory(
    id: string,
    data: Partial<Category>
  ): Promise<Category | undefined> {
    const category = await CategoryModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    ).lean();

    if (!category) return undefined;

    return this.mapCategoryDocToType(category);
  }

  async deleteCategory(menuId: string, categoryId: string): Promise<boolean> {
    const result = await CategoryModel.findByIdAndDelete(categoryId);
    if (result) {
      // Delete associated items
      await MenuItemModel.deleteMany({ categoryId });
      return true;
    }
    return false;
  }

  async toggleCategoryAvailability(
    categoryId: string,
    available: boolean
  ): Promise<Category | undefined> {
    return this.updateCategory(categoryId, { available });
  }

  // =============================================================================
  // Item Operations
  // =============================================================================
  async createItem(
    menuId: string,
    data: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<MenuItem | undefined> {
    const menu = await MenuModel.findById(menuId);
    if (!menu) return undefined;

    const category = await CategoryModel.findById(data.categoryId);
    if (!category) return undefined;

    const item = new MenuItemModel({
      menuId,
      categoryId: data.categoryId,
      restaurantId: menu.restaurantId,
      name: data.name,
      description: data.description,
      price: data.price,
      imageUrl: data.imageUrl,
      calories: data.calories,
      allergens: data.allergens,
      dietaryFlags: data.dietaryFlags,
      variants: data.variants,
      modifiers: data.modifiers,
      available: data.available,
      preparationTime: data.preparationTime,
      sortOrder: data.sortOrder,
    });

    await item.save();

    return this.mapItemToType(item);
  }

  async getItem(id: string): Promise<MenuItem | undefined> {
    const item = await MenuItemModel.findById(id).lean();
    if (!item) return undefined;

    return this.mapItemDocToType(item);
  }

  async getItemsByCategory(categoryId: string): Promise<MenuItem[]> {
    const items = await MenuItemModel.find({ categoryId })
      .sort({ sortOrder: 1 })
      .lean();

    return items.map((i) => this.mapItemDocToType(i));
  }

  async getItemsByMenu(menuId: string): Promise<MenuItem[]> {
    const items = await MenuItemModel.find({ menuId })
      .sort({ sortOrder: 1 })
      .lean();

    return items.map((i) => this.mapItemDocToType(i));
  }

  async updateItem(
    id: string,
    data: Partial<MenuItem>
  ): Promise<MenuItem | undefined> {
    const item = await MenuItemModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    ).lean();

    if (!item) return undefined;

    return this.mapItemDocToType(item);
  }

  async deleteItem(menuId: string, itemId: string): Promise<boolean> {
    const result = await MenuItemModel.findByIdAndDelete(itemId);
    return !!result;
  }

  async toggleItemAvailability(
    itemId: string,
    available: boolean
  ): Promise<MenuItem | undefined> {
    return this.updateItem(itemId, { available });
  }

  // =============================================================================
  // Variant Operations
  // =============================================================================
  async addVariant(
    itemId: string,
    variant: Omit<Variant, 'id'>
  ): Promise<Variant | undefined> {
    const newVariant: Variant = {
      id: uuidv4(),
      ...variant,
    };

    const item = await MenuItemModel.findByIdAndUpdate(
      itemId,
      { $push: { variants: newVariant } },
      { new: true }
    ).lean();

    if (!item) return undefined;

    return newVariant;
  }

  async updateVariant(
    itemId: string,
    variantId: string,
    data: Partial<Variant>
  ): Promise<Variant | undefined> {
    const item = await MenuItemModel.findOneAndUpdate(
      { _id: itemId, 'variants.id': variantId },
      {
        $set: {
          'variants.$.name': data.name,
          'variants.$.priceModifier': data.priceModifier,
          'variants.$.available': data.available,
        },
      },
      { new: true }
    ).lean();

    if (!item) return undefined;

    return item.variants.find((v) => v.id === variantId);
  }

  async deleteVariant(
    itemId: string,
    variantId: string
  ): Promise<boolean> {
    const result = await MenuItemModel.findByIdAndUpdate(
      itemId,
      { $pull: { variants: { id: variantId } } },
      { new: true }
    );

    return !!result;
  }

  // =============================================================================
  // Modifier Operations
  // =============================================================================
  async addModifier(
    itemId: string,
    modifier: Omit<Modifier, 'id'>
  ): Promise<Modifier | undefined> {
    const newModifier: Modifier = {
      id: uuidv4(),
      ...modifier,
    };

    const item = await MenuItemModel.findByIdAndUpdate(
      itemId,
      { $push: { modifiers: newModifier } },
      { new: true }
    ).lean();

    if (!item) return undefined;

    return newModifier;
  }

  async updateModifier(
    itemId: string,
    modifierId: string,
    data: Partial<Modifier>
  ): Promise<Modifier | undefined> {
    // For nested updates, we need to update specific fields
    const updateFields: Record<string, unknown> = {};

    if (data.name !== undefined) {
      updateFields['modifiers.$.name'] = data.name;
    }
    if (data.required !== undefined) {
      updateFields['modifiers.$.required'] = data.required;
    }
    if (data.multiSelect !== undefined) {
      updateFields['modifiers.$.multiSelect'] = data.multiSelect;
    }

    const item = await MenuItemModel.findOneAndUpdate(
      { _id: itemId, 'modifiers.id': modifierId },
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!item) return undefined;

    return item.modifiers.find((m) => m.id === modifierId);
  }

  async deleteModifier(
    itemId: string,
    modifierId: string
  ): Promise<boolean> {
    const result = await MenuItemModel.findByIdAndUpdate(
      itemId,
      { $pull: { modifiers: { id: modifierId } } },
      { new: true }
    );

    return !!result;
  }

  // =============================================================================
  // Analytics Operations
  // =============================================================================
  async recordItemView(
    itemId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<void> {
    const item = await MenuItemModel.findById(itemId).lean();
    if (!item) return;

    await ItemAnalyticsModel.findOneAndUpdate(
      {
        itemId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
      },
      {
        $inc: { views: 1 },
        $setOnInsert: {
          restaurantId: item.restaurantId,
          orders: 0,
          revenue: 0,
          reviewCount: 0,
        },
      },
      { upsert: true, new: true }
    );
  }

  async recordItemOrder(
    itemId: string,
    revenue: number,
    periodStart: string,
    periodEnd: string
  ): Promise<void> {
    const item = await MenuItemModel.findById(itemId).lean();
    if (!item) return;

    await ItemAnalyticsModel.findOneAndUpdate(
      {
        itemId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
      },
      {
        $inc: { orders: 1, revenue },
        $setOnInsert: {
          restaurantId: item.restaurantId,
          views: 0,
          reviewCount: 0,
        },
      },
      { upsert: true, new: true }
    );
  }

  async getAnalytics(
    menuId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<ItemAnalytics[]> {
    const items = await MenuItemModel.find({ menuId }).lean();
    const itemIds = items.map((i) => i._id);

    const analytics = await ItemAnalyticsModel.find({
      itemId: { $in: itemIds },
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
    }).lean();

    return analytics.map((a) => ({
      itemId: a.itemId.toString(),
      itemName:
        items.find((i) => i._id.toString() === a.itemId.toString())?.name ||
        'Unknown',
      categoryId:
        items.find((i) => i._id.toString() === a.itemId.toString())
          ?.categoryId?.toString() || '',
      views: a.views,
      orders: a.orders,
      conversionRate: a.views > 0 ? a.orders / a.views : 0,
      revenue: a.revenue,
      reviewCount: a.reviewCount,
      periodStart: a.periodStart.toISOString(),
      periodEnd: a.periodEnd.toISOString(),
    }));
  }

  // =============================================================================
  // Bulk Operations
  // =============================================================================
  async bulkUpdateAvailability(
    ids: string[],
    available: boolean,
    type: 'category' | 'item'
  ): Promise<number> {
    if (type === 'category') {
      const result = await CategoryModel.updateMany(
        { _id: { $in: ids } },
        { $set: { available } }
      );
      return result.modifiedCount;
    } else {
      const result = await MenuItemModel.updateMany(
        { _id: { $in: ids } },
        { $set: { available } }
      );
      return result.modifiedCount;
    }
  }

  // =============================================================================
  // Search
  // =============================================================================
  async searchItems(menuId: string, query: string): Promise<MenuItem[]> {
    const items = await MenuItemModel.find({
      menuId,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { allergens: { $regex: query, $options: 'i' } },
      ],
    }).lean();

    return items.map((i) => this.mapItemDocToType(i));
  }

  // =============================================================================
  // Full Menu
  // =============================================================================
  async getFullMenu(menuId: string): Promise<Menu | undefined> {
    const menu = await MenuModel.findById(menuId).lean();
    if (!menu) return undefined;

    const categories = await this.getCategoriesByMenu(menuId);
    const items = await this.getItemsByMenu(menuId);

    return {
      id: menu._id.toString(),
      restaurantId: menu.restaurantId,
      name: menu.name,
      description: menu.description,
      active: menu.active,
      publishedAt: menu.publishedAt?.toISOString(),
      version: menu.version,
      createdAt: menu.createdAt.toISOString(),
      updatedAt: menu.updatedAt.toISOString(),
      categories,
      items,
    };
  }

  // =============================================================================
  // Mapping Functions
  // =============================================================================
  private mapMenuToType(menu: IMenu): Menu {
    return {
      id: menu._id.toString(),
      restaurantId: menu.restaurantId,
      name: menu.name,
      description: menu.description,
      active: menu.active,
      publishedAt: menu.publishedAt?.toISOString(),
      version: menu.version,
      createdAt: menu.createdAt.toISOString(),
      updatedAt: menu.updatedAt.toISOString(),
      categories: [],
      items: [],
    };
  }

  private mapMenuDocToType(menu: any): Menu {
    return {
      id: (menu._id as Types.ObjectId).toString(),
      restaurantId: menu.restaurantId as string,
      name: menu.name as string,
      description: menu.description as string | undefined,
      active: menu.active as boolean,
      publishedAt: menu.publishedAt
        ? (menu.publishedAt as Date).toISOString()
        : undefined,
      version: menu.version as number,
      createdAt: (menu.createdAt as Date).toISOString(),
      updatedAt: (menu.updatedAt as Date).toISOString(),
      categories: [],
      items: [],
    };
  }

  private mapCategoryToType(category: ICategory): Category {
    return {
      id: category._id.toString(),
      name: category.name,
      description: category.description,
      imageUrl: category.imageUrl,
      sortOrder: category.sortOrder,
      available: category.available,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }

  private mapCategoryDocToType(category: any): Category {
    return {
      id: (category._id as Types.ObjectId).toString(),
      name: category.name as string,
      description: category.description as string | undefined,
      imageUrl: category.imageUrl as string | undefined,
      sortOrder: category.sortOrder as number,
      available: category.available as boolean,
      createdAt: (category.createdAt as Date).toISOString(),
      updatedAt: (category.updatedAt as Date).toISOString(),
    };
  }

  private mapItemToType(item: IMenuItem): MenuItem {
    return {
      id: item._id.toString(),
      categoryId: item.categoryId.toString(),
      name: item.name,
      description: item.description,
      price: item.price,
      imageUrl: item.imageUrl,
      calories: item.calories,
      allergens: item.allergens || [],
      dietaryFlags: (item.dietaryFlags || []) as MenuItem['dietaryFlags'],
      variants: item.variants || [],
      modifiers: item.modifiers || [],
      available: item.available,
      preparationTime: item.preparationTime,
      sortOrder: item.sortOrder,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private mapItemDocToType(item: any): MenuItem {
    return {
      id: (item._id as Types.ObjectId).toString(),
      categoryId: (item.categoryId as mongoose.Types.ObjectId).toString(),
      name: item.name as string,
      description: item.description as string | undefined,
      price: item.price as number,
      imageUrl: item.imageUrl as string | undefined,
      calories: item.calories as number | undefined,
      allergens: (item.allergens as string[]) || [],
      dietaryFlags: (item.dietaryFlags as any) || [],
      variants: (item.variants as Variant[]) || [],
      modifiers: (item.modifiers as Modifier[]) || [],
      available: item.available as boolean,
      preparationTime: item.preparationTime as number | undefined,
      sortOrder: item.sortOrder as number,
      createdAt: (item.createdAt as Date).toISOString(),
      updatedAt: (item.updatedAt as Date).toISOString(),
    };
  }
}

// Singleton instance
export const mongoMenuStore = new MongoMenuStore();
