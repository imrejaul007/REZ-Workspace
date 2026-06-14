import { v4 as uuidv4 } from 'uuid';
import { RepurposingTemplate } from '../models/index.js';
import { logger } from 'utils/logger.js';
import { NotFoundError } from '../utils/errors.js';
import { templatesCreatedTotal } from '../middleware/metrics.js';

export interface CreateTemplateRequest {
  name: string;
  sourcePlatform: string;
  targetPlatform: string;
  rules: {
    maxLength: number;
    includeHashtags: boolean;
    adaptEmoji: boolean;
    addCTA: boolean;
    aspectRatio: string;
  };
  createdBy: string;
}

export interface UpdateTemplateRequest {
  name?: string;
  rules?: {
    maxLength?: number;
    includeHashtags?: boolean;
    adaptEmoji?: boolean;
    addCTA?: boolean;
    aspectRatio?: string;
  };
  isActive?: boolean;
}

export class TemplateService {
  /**
   * Create a new template
   */
  async create(request: CreateTemplateRequest): Promise<RepurposingTemplate> {
    logger.info('Creating template', { name: request.name });

    const template = new RepurposingTemplate({
      id: uuidv4(),
      name: request.name,
      sourcePlatform: request.sourcePlatform,
      targetPlatform: request.targetPlatform,
      rules: {
        maxLength: request.rules.maxLength,
        includeHashtags: request.rules.includeHashtags,
        adaptEmoji: request.rules.adaptEmoji,
        addCTA: request.rules.addCTA,
        aspectRatio: request.rules.aspectRatio,
      },
      createdBy: request.createdBy,
      isActive: true,
    });

    await template.save();

    // Update metrics
    templatesCreatedTotal.inc({
      source_platform: request.sourcePlatform,
      target_platform: request.targetPlatform,
    });

    logger.info('Template created successfully', { id: template.id });
    return template;
  }

  /**
   * Get template by ID
   */
  async getById(id: string): Promise<RepurposingTemplate> {
    const template = await RepurposingTemplate.findOne({ id });
    if (!template) {
      throw new NotFoundError('Template');
    }
    return template;
  }

  /**
   * List templates with filters
   */
  async list(options: {
    sourcePlatform?: string;
    targetPlatform?: string;
    createdBy?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ items: RepurposingTemplate[]; total: number }> {
    const { sourcePlatform, targetPlatform, createdBy, isActive, limit = 20, offset = 0 } = options;

    const query: Record<string, unknown> = {};
    if (sourcePlatform) query.sourcePlatform = sourcePlatform;
    if (targetPlatform) query.targetPlatform = targetPlatform;
    if (createdBy) query.createdBy = createdBy;
    if (typeof isActive === 'boolean') query.isActive = isActive;

    const [items, total] = await Promise.all([
      RepurposingTemplate.find(query).sort({ createdAt: -1 }).skip(offset).limit(limit),
      RepurposingTemplate.countDocuments(query),
    ]);

    return { items, total };
  }

  /**
   * Update template
   */
  async update(id: string, request: UpdateTemplateRequest): Promise<RepurposingTemplate> {
    const updateData: Record<string, unknown> = {};

    if (request.name) updateData['name'] = request.name;
    if (typeof request.isActive === 'boolean') updateData['isActive'] = request.isActive;
    if (request.rules) {
      Object.entries(request.rules).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData[`rules.${key}`] = value;
        }
      });
    }

    const template = await RepurposingTemplate.findOneAndUpdate(
      { id },
      { $set: updateData },
      { new: true }
    );

    if (!template) {
      throw new NotFoundError('Template');
    }

    logger.info('Template updated successfully', { id });
    return template;
  }

  /**
   * Delete template
   */
  async delete(id: string): Promise<void> {
    const result = await RepurposingTemplate.deleteOne({ id });
    if (result.deletedCount === 0) {
      throw new NotFoundError('Template');
    }
    logger.info('Template deleted successfully', { id });
  }

  /**
   * Get default template for platform conversion
   */
  async getDefaultTemplate(sourcePlatform: string, targetPlatform: string): Promise<RepurposingTemplate | null> {
    return RepurposingTemplate.findOne({
      sourcePlatform,
      targetPlatform,
      isActive: true,
    });
  }
}

export const templateService = new TemplateService();