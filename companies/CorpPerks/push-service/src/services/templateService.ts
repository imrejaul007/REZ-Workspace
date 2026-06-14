import { v4 as uuidv4 } from 'uuid';
import { NotificationTemplate, INotificationTemplate, ITemplateVariable } from '../models';
import { NotificationType } from '../models/Notification';

// ==================== TYPES ====================

export interface CreateTemplateInput {
  name: string;
  description?: string;
  type: NotificationType;
  channels: ('push' | 'in_app' | 'email' | 'sms')[];
  titleTemplate: string;
  bodyTemplate: string;
  imageTemplate?: string;
  deepLinkTemplate?: string;
  variables?: ITemplateVariable[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  isActive?: boolean;
  isDefault?: boolean;
  companyId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdBy: string;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  channels?: ('push' | 'in_app' | 'email' | 'sms')[];
  titleTemplate?: string;
  bodyTemplate?: string;
  imageTemplate?: string;
  deepLinkTemplate?: string;
  variables?: ITemplateVariable[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  isActive?: boolean;
  isDefault?: boolean;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface GetTemplatesInput {
  page?: number;
  limit?: number;
  type?: NotificationType;
  companyId?: string;
  isActive?: boolean;
  search?: string;
  tags?: string[];
}

/**
 * Template Service - Manage notification templates
 */
export class TemplateService {
  /**
   * Create a new template
   */
  async createTemplate(input: CreateTemplateInput): Promise<INotificationTemplate> {
    // Check for duplicate name within company
    const existing = await NotificationTemplate.findOne({
      name: input.name,
      companyId: input.companyId || { $exists: false },
    });
    if (existing) {
      throw new Error(`Template with name '${input.name}' already exists`);
    }

    const template = new NotificationTemplate({
      templateId: `tmpl_${uuidv4()}`,
      ...input,
      isActive: input.isActive ?? true,
      isDefault: input.isDefault ?? false,
      tags: input.tags || [],
      variables: input.variables || [],
    });

    await template.save();
    return template;
  }

  /**
   * Update an existing template
   */
  async updateTemplate(
    templateId: string,
    input: UpdateTemplateInput
  ): Promise<INotificationTemplate | null> {
    const template = await NotificationTemplate.findOneAndUpdate(
      { templateId },
      { $set: input },
      { new: true }
    );
    return template as INotificationTemplate | null;
  }

  /**
   * Get template by ID
   */
  async getTemplateById(templateId: string): Promise<INotificationTemplate | null> {
    return NotificationTemplate.findOne({ templateId }).lean() as Promise<INotificationTemplate | null>;
  }

  /**
   * Get templates with filters
   */
  async getTemplates(input: GetTemplatesInput): Promise<{
    templates: INotificationTemplate[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    const {
      page = 1,
      limit = 20,
      type,
      companyId,
      isActive = true,
      search,
      tags,
    } = input;

    const query: Record<string, unknown> = {};

    if (type) query.type = type;
    if (companyId) query.companyId = companyId;
    if (isActive !== undefined) query.isActive = isActive;
    if (tags && tags.length > 0) query.tags = { $all: tags };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [templates, total] = await Promise.all([
      NotificationTemplate.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .then(docs => docs as unknown as INotificationTemplate[]),
      NotificationTemplate.countDocuments(query),
    ]);

    return {
      templates,
      total,
      page,
      limit,
      hasMore: skip + templates.length < total,
    };
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    const result = await NotificationTemplate.deleteOne({ templateId });
    return result.deletedCount > 0;
  }

  /**
   * Duplicate a template
   */
  async duplicateTemplate(
    templateId: string,
    newName: string,
    createdBy: string
  ): Promise<INotificationTemplate | null> {
    const original = await this.getTemplateById(templateId);
    if (!original) return null;

    const duplicate = new NotificationTemplate({
      templateId: `tmpl_${uuidv4()}`,
      name: newName,
      description: original.description,
      type: original.type,
      channels: original.channels,
      titleTemplate: original.titleTemplate,
      bodyTemplate: original.bodyTemplate,
      imageTemplate: original.imageTemplate,
      deepLinkTemplate: original.deepLinkTemplate,
      variables: original.variables,
      priority: original.priority,
      isActive: false, // Inactive by default when duplicated
      isDefault: false,
      companyId: original.companyId,
      tags: original.tags,
      metadata: original.metadata,
      createdBy,
      usageCount: 0,
    });

    await duplicate.save();
    return duplicate;
  }

  /**
   * Increment template usage count
   */
  async incrementUsage(templateId: string): Promise<void> {
    await NotificationTemplate.updateOne(
      { templateId },
      {
        $inc: { usageCount: 1 },
        $set: { lastUsedAt: new Date() },
      }
    );
  }

  /**
   * Set default template for a type
   */
  async setDefaultTemplate(
    templateId: string,
    companyId?: string
  ): Promise<INotificationTemplate | null> {
    // Remove default flag from other templates of same type
    await NotificationTemplate.updateMany(
      {
        type: (await this.getTemplateById(templateId))?.type,
        companyId: companyId || { $exists: false },
      },
      { isDefault: false }
    );

    // Set this one as default
    return this.updateTemplate(templateId, { isDefault: true });
  }

  /**
   * Get default template for a type
   */
  async getDefaultTemplate(
    type: NotificationType,
    companyId?: string
  ): Promise<INotificationTemplate | null> {
    return NotificationTemplate.findOne({
      type,
      companyId: companyId || { $exists: false },
      isDefault: true,
      isActive: true,
    }).lean() as Promise<INotificationTemplate | null>;
  }

  /**
   * Validate template variables
   */
  validateVariables(
    template: INotificationTemplate,
    variables: Record<string, string>
  ): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    for (const variable of template.variables) {
      if (variable.required && !variables[variable.name]) {
        missing.push(variable.name);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Get templates by type
   */
  async getTemplatesByType(
    type: NotificationType,
    companyId?: string
  ): Promise<INotificationTemplate[]> {
    const docs = await NotificationTemplate.find({
      type,
      companyId: companyId || { $exists: false },
      isActive: true,
    })
      .sort({ usageCount: -1 })
      .lean();
    return docs as unknown as INotificationTemplate[];
  }

  /**
   * Bulk activate/deactivate templates
   */
  async bulkUpdateStatus(
    templateIds: string[],
    isActive: boolean
  ): Promise<number> {
    const result = await NotificationTemplate.updateMany(
      { templateId: { $in: templateIds } },
      { $set: { isActive } }
    );
    return result.modifiedCount;
  }
}

// Export singleton instance
export const templateService = new TemplateService();
