import { QuickReplyTemplate } from '../models';
import { QuickReplyTemplateDocument } from '../models';
import { Platform, PaginatedResult } from '../types';
import { createModuleLogger } from 'utils/logger.js';

const logger = createModuleLogger('TemplateService');

export class TemplateService {
  /**
   * Create a new quick reply template
   */
  async createTemplate(data: {
    name: string;
    platform: Platform | 'all';
    category: string;
    content: string;
    emoji?: string;
    variables?: string[];
  }): Promise<QuickReplyTemplateDocument> {
    try {
      const template = new QuickReplyTemplate({
        ...data,
        usageCount: 0,
      });

      await template.save();
      logger.info('Template created', { id: template._id, name: data.name });
      return template;
    } catch (error) {
      logger.error('Failed to create template', { error, data });
      throw error;
    }
  }

  /**
   * Get all templates with filters
   */
  async getTemplates(options: {
    platform?: Platform | 'all';
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<QuickReplyTemplateDocument>> {
    try {
      const query: Record<string, unknown> = {};

      if (options.platform && options.platform !== 'all') {
        query.platform = { $in: [options.platform, 'all'] };
      }
      if (options.category) {
        query.category = options.category;
      }
      if (options.search) {
        query.$or = [
          { name: { $regex: options.search, $options: 'i' } },
          { content: { $regex: options.search, $options: 'i' } },
        ];
      }

      const page = options.page || 1;
      const limit = options.limit || 50;
      const skip = (page - 1) * limit;

      const [templates, total] = await Promise.all([
        QuickReplyTemplate.find(query)
          .sort({ usageCount: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        QuickReplyTemplate.countDocuments(query),
      ]);

      return {
        data: templates as QuickReplyTemplateDocument[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Failed to get templates', { error, options });
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(templateId: string): Promise<QuickReplyTemplateDocument | null> {
    return QuickReplyTemplate.findById(templateId);
  }

  /**
   * Update template
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<{
      name: string;
      platform: Platform | 'all';
      category: string;
      content: string;
      emoji: string;
      variables: string[];
    }>
  ): Promise<QuickReplyTemplateDocument | null> {
    try {
      const template = await QuickReplyTemplate.findByIdAndUpdate(
        templateId,
        { $set: updates },
        { new: true }
      );

      if (template) {
        logger.info('Template updated', { id: templateId });
      }
      return template;
    } catch (error) {
      logger.error('Failed to update template', { error, templateId });
      throw error;
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      const result = await QuickReplyTemplate.findByIdAndDelete(templateId);
      if (result) {
        logger.info('Template deleted', { id: templateId });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Failed to delete template', { error, templateId });
      throw error;
    }
  }

  /**
   * Increment template usage count
   */
  async incrementUsage(templateId: string): Promise<void> {
    try {
      await QuickReplyTemplate.findByIdAndUpdate(templateId, {
        $inc: { usageCount: 1 },
      });
    } catch (error) {
      logger.error('Failed to increment template usage', { error, templateId });
    }
  }

  /**
   * Get template categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const categories = await QuickReplyTemplate.distinct('category');
      return categories.sort();
    } catch (error) {
      logger.error('Failed to get template categories', { error });
      throw error;
    }
  }

  /**
   * Get templates by platform
   */
  async getTemplatesByPlatform(platform: Platform): Promise<QuickReplyTemplateDocument[]> {
    try {
      return QuickReplyTemplate.find({
        $or: [
          { platform: platform },
          { platform: 'all' },
        ],
      })
        .sort({ category: 1, usageCount: -1 })
        .lean() as unknown as QuickReplyTemplateDocument[];
    } catch (error) {
      logger.error('Failed to get templates by platform', { error, platform });
      throw error;
    }
  }

  /**
   * Replace variables in template content
   */
  replaceVariables(content: string, variables: Record<string, string>): string {
    let result = content;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  }

  /**
   * Get suggested templates based on keywords
   */
  async getSuggestedTemplates(
    platform: Platform,
    keywords: string[]
  ): Promise<QuickReplyTemplateDocument[]> {
    try {
      const templates = await QuickReplyTemplate.find({
        $or: [
          { platform: platform },
          { platform: 'all' },
        ],
      }).lean() as unknown as QuickReplyTemplateDocument[];

      // Score templates based on keyword matches
      const scored = templates.map(template => {
        const contentLower = template.content.toLowerCase();
        const nameLower = template.name.toLowerCase();
        let score = template.usageCount; // Base score on usage

        for (const keyword of keywords) {
          const keywordLower = keyword.toLowerCase();
          if (contentLower.includes(keywordLower)) score += 10;
          if (nameLower.includes(keywordLower)) score += 5;
        }

        return { template, score };
      });

      // Sort by score and return top 5
      return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(s => s.template);
    } catch (error) {
      logger.error('Failed to get suggested templates', { error, platform, keywords });
      throw error;
    }
  }
}