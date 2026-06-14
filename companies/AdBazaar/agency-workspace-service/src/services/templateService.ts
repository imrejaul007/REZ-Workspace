import { CampaignTemplate, ICampaignTemplate } from '../models';
import { logger } from '../utils/logger';
import {
  campaignTemplateCreateSchema,
  campaignTemplateUpdateSchema,
  CampaignTemplateCreate,
  CampaignTemplateUpdate
} from '../utils/helpers';

export class TemplateService {
  /**
   * Create campaign template
   */
  async createTemplate(agencyId: string, data: CampaignTemplateCreate, createdBy: string): Promise<ICampaignTemplate> {
    try {
      const validatedData = campaignTemplateCreateSchema.parse(data);

      const template = new CampaignTemplate({
        ...validatedData,
        agencyId,
        createdBy,
        usageCount: 0
      });

      await template.save();

      logger.info(`Campaign template created: ${template._id}`, {
        agencyId,
        templateId: template._id,
        name: template.name,
        type: template.type
      });

      return template;
    } catch (error) {
      logger.error('Failed to create template', { agencyId, error });
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(templateId: string): Promise<ICampaignTemplate | null> {
    try {
      return await CampaignTemplate.findById(templateId);
    } catch (error) {
      logger.error('Failed to get template', { templateId, error });
      throw error;
    }
  }

  /**
   * List templates for agency
   */
  async listTemplates(agencyId: string, options: {
    page?: number;
    limit?: number;
    type?: string;
    category?: string;
    tags?: string[];
    includePublic?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ templates: ICampaignTemplate[]; total: number; page: number; limit: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        category,
        tags,
        includePublic = false,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const query: any = {
        $or: [
          { agencyId },
          { isPublic: true }
        ]
      };

      if (!includePublic) {
        query.agencyId = agencyId;
      }

      if (type) query.type = type;
      if (category) query.category = category;
      if (tags && tags.length > 0) {
        query.tags = { $in: tags };
      }

      const sort: any = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [templates, total] = await Promise.all([
        CampaignTemplate.find(query)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        CampaignTemplate.countDocuments(query)
      ]);

      return { templates: templates as ICampaignTemplate[], total, page, limit };
    } catch (error) {
      logger.error('Failed to list templates', { agencyId, error });
      throw error;
    }
  }

  /**
   * Update template
   */
  async updateTemplate(templateId: string, data: CampaignTemplateUpdate): Promise<ICampaignTemplate | null> {
    try {
      const validatedData = campaignTemplateUpdateSchema.parse(data);

      const template = await CampaignTemplate.findByIdAndUpdate(
        templateId,
        { $set: validatedData },
        { new: true, runValidators: true }
      );

      if (template) {
        logger.info(`Template updated: ${templateId}`);
      }

      return template;
    } catch (error) {
      logger.error('Failed to update template', { templateId, error });
      throw error;
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      const result = await CampaignTemplate.findByIdAndDelete(templateId);

      if (result) {
        logger.info(`Template deleted: ${templateId}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Failed to delete template', { templateId, error });
      throw error;
    }
  }

  /**
   * Use template (increment usage count)
   */
  async useTemplate(templateId: string): Promise<ICampaignTemplate | null> {
    try {
      const template = await CampaignTemplate.findByIdAndUpdate(
        templateId,
        {
          $inc: { usageCount: 1 },
          $set: { lastUsed: new Date() }
        },
        { new: true }
      );

      if (template) {
        logger.info(`Template used: ${templateId}`, { templateId });
      }

      return template;
    } catch (error) {
      logger.error('Failed to use template', { templateId, error });
      throw error;
    }
  }

  /**
   * Get popular templates
   */
  async getPopularTemplates(agencyId: string, limit: number = 10): Promise<ICampaignTemplate[]> {
    try {
      return await CampaignTemplate.find({ agencyId })
        .sort({ usageCount: -1 })
        .limit(limit)
        .lean() as ICampaignTemplate[];
    } catch (error) {
      logger.error('Failed to get popular templates', { agencyId, error });
      throw error;
    }
  }

  /**
   * Duplicate template
   */
  async duplicateTemplate(templateId: string, newName: string): Promise<ICampaignTemplate | null> {
    try {
      const original = await CampaignTemplate.findById(templateId);

      if (!original) {
        return null;
      }

      const duplicate = new CampaignTemplate({
        ...original.toObject(),
        _id: undefined,
        name: newName,
        usageCount: 0,
        lastUsed: undefined,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await duplicate.save();

      logger.info(`Template duplicated: ${templateId} -> ${duplicate._id}`);

      return duplicate;
    } catch (error) {
      logger.error('Failed to duplicate template', { templateId, error });
      throw error;
    }
  }

  /**
   * Make template public
   */
  async makePublic(templateId: string, isPublic: boolean = true): Promise<ICampaignTemplate | null> {
    try {
      const template = await CampaignTemplate.findByIdAndUpdate(
        templateId,
        { $set: { isPublic } },
        { new: true }
      );

      if (template) {
        logger.info(`Template ${isPublic ? 'made public' : 'made private'}: ${templateId}`);
      }

      return template;
    } catch (error) {
      logger.error('Failed to update template visibility', { templateId, error });
      throw error;
    }
  }

  /**
   * Search templates
   */
  async searchTemplates(query: string, agencyId: string): Promise<ICampaignTemplate[]> {
    try {
      const searchRegex = new RegExp(query, 'i');

      return await CampaignTemplate.find({
        agencyId,
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { tags: { $in: [searchRegex] } }
        ]
      })
        .sort({ usageCount: -1 })
        .limit(20)
        .lean() as ICampaignTemplate[];
    } catch (error) {
      logger.error('Failed to search templates', { agencyId, query, error });
      throw error;
    }
  }
}

export const templateService = new TemplateService();