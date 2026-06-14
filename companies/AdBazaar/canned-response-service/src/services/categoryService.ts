/**
 * Category Service - Business logic for response categories
 */

import { v4 as uuidv4 } from 'uuid';
import { Category, ICategory } from '../models/Category';
import logger from '../utils/logger';

export interface CreateCategoryInput {
  name: string;
  description?: string;
  icon?: string;
  order?: number;
}

export class CategoryService {
  /**
   * Create a new category
   */
  async createCategory(input: CreateCategoryInput): Promise<ICategory> {
    const slug = this.generateSlug(input.name);

    const categoryData: Partial<ICategory> = {
      categoryId: `CAT-${uuidv4().slice(0, 8).toUpperCase()}`,
      name: input.name,
      slug,
      description: input.description || '',
      icon: input.icon,
      order: input.order || 0,
      isActive: true,
      responseCount: 0,
    };

    const category = new Category(categoryData);
    await category.save();

    logger.info('Category created', { categoryId: category.categoryId, name: input.name });
    return category;
  }

  /**
   * Get category by ID
   */
  async getCategoryById(categoryId: string): Promise<ICategory | null> {
    return Category.findOne({ categoryId }).exec();
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<ICategory | null> {
    return Category.findOne({ slug }).exec();
  }

  /**
   * Get all categories
   */
  async getCategories(includeInactive = false): Promise<ICategory[]> {
    const query: Record<string, unknown> = {};
    if (!includeInactive) query.isActive = true;
    return Category.find(query).sort({ order: 1, name: 1 }).exec();
  }

  /**
   * Update category
   */
  async updateCategory(categoryId: string, updates: Partial<ICategory>): Promise<ICategory | null> {
    const updated = await Category.findOneAndUpdate(
      { categoryId },
      { $set: updates },
      { new: true }
    ).exec();

    if (updated) {
      logger.info('Category updated', { categoryId, updates: Object.keys(updates) });
    }
    return updated;
  }

  /**
   * Delete category
   */
  async deleteCategory(categoryId: string): Promise<boolean> {
    const deleted = await Category.findOneAndDelete({ categoryId }).exec();
    if (deleted) {
      logger.info('Category deleted', { categoryId });
      return true;
    }
    return false;
  }

  /**
   * Toggle category active status
   */
  async toggleCategory(categoryId: string): Promise<ICategory | null> {
    const category = await Category.findOne({ categoryId }).exec();
    if (!category) return null;

    category.isActive = !category.isActive;
    await category.save();

    logger.info('Category toggled', { categoryId, isActive: category.isActive });
    return category;
  }

  /**
   * Reorder categories
   */
  async reorderCategories(orders: Array<{ categoryId: string; order: number }>): Promise<void> {
    const bulkOps = orders.map(item => ({
      updateOne: {
        filter: { categoryId: item.categoryId },
        update: { $set: { order: item.order } },
      },
    }));

    await Category.bulkWrite(bulkOps);
    logger.info('Categories reordered', { count: orders.length });
  }

  /**
   * Generate URL-friendly slug
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);
  }
}

export const categoryService = new CategoryService();
export default categoryService;