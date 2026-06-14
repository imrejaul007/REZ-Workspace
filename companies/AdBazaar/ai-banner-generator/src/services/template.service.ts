/**
 * Banner Template Service
 * Manages banner templates and layouts
 */

import { v4 as uuidv4 } from 'uuid';
import { BannerTemplateModel } from '../models';
import { redisService } from './redis.service';
import { TemplateLayout, BannerTemplate } from '../types';
import logger from '../utils/logger';

class BannerTemplateService {
  /**
   * Create a new template
   */
  async createTemplate(
    createdBy: string,
    data: {
      name: string;
      category: string;
      dimensions: { width: number; height: number };
      layout: TemplateLayout;
      isPublic?: boolean;
    }
  ): Promise<BannerTemplate> {
    const templateId = `tpl-${uuidv4().slice(0, 12)}`;

    const template = new BannerTemplateModel({
      templateId,
      name: data.name,
      category: data.category,
      dimensions: data.dimensions,
      layout: data.layout,
      usageCount: 0,
      performance: {
        avgCTR: 0,
        avgConversion: 0,
      },
      createdBy,
      isPublic: data.isPublic ?? false,
    });

    await template.save();

    // Cache the template
    await redisService.cacheTemplate(templateId, {
      templateId,
      name: data.name,
      category: data.category,
      dimensions: data.dimensions,
    });

    // Invalidate list cache
    await redisService.invalidateAllTemplateCache();

    logger.info('Template created', { templateId, name: data.name });

    return this.toBannerTemplate(template);
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<BannerTemplate | null> {
    // Check cache first
    const cached = await redisService.getCachedTemplate(templateId);
    if (cached) {
      return cached as BannerTemplate;
    }

    const template = await BannerTemplateModel.findOne({ templateId });
    if (!template) {
      return null;
    }

    const result = this.toBannerTemplate(template);

    // Cache the template
    await redisService.cacheTemplate(templateId, result);

    return result;
  }

  /**
   * List templates with filtering and pagination
   */
  async listTemplates(options: {
    category?: string;
    createdBy?: string;
    isPublic?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: BannerTemplate[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;

    // Build query
    const query: Record<string, unknown> = {};

    if (options.category) {
      query.category = options.category;
      // Check cache for category lists
      const cached = await redisService.getCachedTemplateList(options.category);
      if (cached) {
        return cached as { data: BannerTemplate[]; total: number };
      }
    }

    if (options.createdBy) {
      query.createdBy = options.createdBy;
    }

    if (options.isPublic !== undefined) {
      query.isPublic = options.isPublic;
    } else {
      // Default to public templates only
      query.isPublic = true;
    }

    const [templates, total] = await Promise.all([
      BannerTemplateModel.find(query)
        .sort({ usageCount: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      BannerTemplateModel.countDocuments(query),
    ]);

    const result = {
      data: templates.map((t) => this.toBannerTemplate(t)),
      total,
    };

    // Cache category lists
    if (options.category) {
      await redisService.cacheTemplateList(options.category, result);
    }

    return result;
  }

  /**
   * Update template
   */
  async updateTemplate(
    templateId: string,
    userId: string,
    updates: Partial<{
      name: string;
      category: string;
      dimensions: { width: number; height: number };
      layout: TemplateLayout;
      isPublic: boolean;
    }>
  ): Promise<BannerTemplate | null> {
    const template = await BannerTemplateModel.findOne({ templateId });

    if (!template) {
      return null;
    }

    // Only creator can update
    if (template.createdBy !== userId) {
      throw new Error('Unauthorized to update this template');
    }

    // Apply updates
    if (updates.name) template.name = updates.name;
    if (updates.category) template.category = updates.category;
    if (updates.dimensions) template.dimensions = updates.dimensions;
    if (updates.layout) template.layout = updates.layout;
    if (updates.isPublic !== undefined) template.isPublic = updates.isPublic;

    await template.save();

    // Invalidate caches
    await redisService.invalidateTemplateCache(templateId);
    await redisService.invalidateAllTemplateCache();

    logger.info('Template updated', { templateId });

    return this.toBannerTemplate(template);
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string, userId: string): Promise<boolean> {
    const template = await BannerTemplateModel.findOne({ templateId });

    if (!template) {
      return false;
    }

    // Only creator can delete
    if (template.createdBy !== userId) {
      throw new Error('Unauthorized to delete this template');
    }

    await BannerTemplateModel.deleteOne({ templateId });

    // Invalidate caches
    await redisService.invalidateTemplateCache(templateId);
    await redisService.invalidateAllTemplateCache();

    logger.info('Template deleted', { templateId });

    return true;
  }

  /**
   * Increment usage count
   */
  async incrementUsage(templateId: string): Promise<void> {
    await BannerTemplateModel.findOneAndUpdate(
      { templateId },
      { $inc: { usageCount: 1 } }
    );
  }

  /**
   * Update performance metrics
   */
  async updatePerformance(
    templateId: string,
    metrics: { ctr?: number; conversion?: number }
  ): Promise<void> {
    const template = await BannerTemplateModel.findOne({ templateId });
    if (!template) return;

    if (metrics.ctr !== undefined) {
      // Running average
      template.performance.avgCTR = template.usageCount > 0
        ? (template.performance.avgCTR * (template.usageCount - 1) + metrics.ctr) / template.usageCount
        : metrics.ctr;
    }

    if (metrics.conversion !== undefined) {
      template.performance.avgConversion = template.usageCount > 0
        ? (template.performance.avgConversion * (template.usageCount - 1) + metrics.conversion) / template.usageCount
        : metrics.conversion;
    }

    await template.save();
  }

  /**
   * Get categories
   */
  async getCategories(): Promise<string[]> {
    const categories = await BannerTemplateModel.distinct('category', { isPublic: true });
    return categories;
  }

  /**
   * Get popular templates
   */
  async getPopularTemplates(limit = 10): Promise<BannerTemplate[]> {
    const templates = await BannerTemplateModel.find({ isPublic: true })
      .sort({ usageCount: -1, 'performance.avgCTR': -1 })
      .limit(limit);

    return templates.map((t) => this.toBannerTemplate(t));
  }

  /**
   * Search templates by name
   */
  async searchTemplates(query: string, limit = 20): Promise<BannerTemplate[]> {
    const templates = await BannerTemplateModel.find({
      name: { $regex: query, $options: 'i' },
      isPublic: true,
    })
      .sort({ usageCount: -1 })
      .limit(limit);

    return templates.map((t) => this.toBannerTemplate(t));
  }

  /**
   * Convert Mongoose document to BannerTemplate
   */
  private toBannerTemplate(doc: {
    templateId: string;
    name: string;
    category: string;
    dimensions: { width: number; height: number };
    layout: TemplateLayout;
    usageCount: number;
    performance: { avgCTR: number; avgConversion: number };
    createdBy: string;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): BannerTemplate {
    return {
      templateId: doc.templateId,
      name: doc.name,
      category: doc.category,
      dimensions: doc.dimensions,
      layout: doc.layout,
      usageCount: doc.usageCount,
      performance: doc.performance,
      createdBy: doc.createdBy,
      isPublic: doc.isPublic,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}

export const bannerTemplateService = new BannerTemplateService();
export default bannerTemplateService;