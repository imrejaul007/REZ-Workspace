import { v4 as uuidv4 } from 'uuid';
import { Template } from '../models';
import {
  CreateTemplateInput,
  UpdateTemplateInput,
  TemplateQueryInput,
} from '../validators';
import { DEFAULT_TEMPLATES, PaginatedResponse, DocumentTemplate } from '../types';

export class TemplateService {
  /**
   * Create a new template
   */
  async create(
    input: CreateTemplateInput,
    userId: string,
    userName: string,
    companyId: string
  ): Promise<DocumentTemplate> {
    const templateId = `tpl_${uuidv4()}`;

    const template = new Template({
      templateId,
      companyId,
      name: input.name,
      description: input.description,
      type: input.type,
      content: input.content,
      variables: input.variables,
      category: input.category,
      department: input.department,
      isActive: true,
      isDefault: input.isDefault || false,
      version: 1,
      createdById: userId,
      createdByName: userName,
    });

    await template.save();
    return template.toObject() as unknown as DocumentTemplate;
  }

  /**
   * Update an existing template
   */
  async update(
    templateId: string,
    input: UpdateTemplateInput,
    userId: string,
    userName: string
  ): Promise<DocumentTemplate | null> {
    const template = await Template.findOne({ templateId, isActive: true });
    if (!template) return null;

    // If content or variables changed, create new version
    if (input.content || input.variables) {
      const updates: Partial<DocumentTemplate> = {
        ...input,
        updatedById: userId,
        updatedByName: userName,
      };

      const newVersion = await Template.createNewVersion(
        templateId,
        updates,
        userId,
        userName
      );

      return newVersion.toObject() as unknown as DocumentTemplate;
    }

    // Simple update without version bump
    Object.assign(template, input, {
      updatedById: userId,
      updatedByName: userName,
    });
    await template.save();

    return template.toObject() as unknown as DocumentTemplate;
  }

  /**
   * Get template by ID
   */
  async getById(templateId: string): Promise<DocumentTemplate | null> {
    const template = await Template.findOne({ templateId, isActive: true });
    return template?.toObject() as unknown as DocumentTemplate || null;
  }

  /**
   * List templates with pagination and filters
   */
  async list(query: TemplateQueryInput): Promise<PaginatedResponse<DocumentTemplate>> {
    const filter: Record<string, unknown> = { isActive: true };

    if (query.companyId) filter.companyId = query.companyId;
    if (query.type) filter.type = query.type;
    if (query.category) filter.category = query.category;
    if (query.department) filter.department = query.department;
    if (query.isActive !== undefined) filter.isActive = query.isActive;

    if (query.search) {
      filter.$text = { $search: query.search };
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    const [templates, total] = await Promise.all([
      Template.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit),
      Template.countDocuments(filter),
    ]);

    return {
      data: templates.map((t) => t.toObject() as unknown as DocumentTemplate),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + templates.length < total,
      },
    };
  }

  /**
   * Delete (deactivate) template
   */
  async delete(templateId: string, userId: string, userName: string): Promise<boolean> {
    const template = await Template.findOne({ templateId, isActive: true });
    if (!template) return false;

    template.isActive = false;
    template.updatedById = userId;
    template.updatedByName = userName;
    await template.save();

    return true;
  }

  /**
   * Seed default templates for a company
   */
  async seedDefaults(companyId: string, userId: string, userName: string): Promise<number> {
    let seededCount = 0;

    for (const defaultTemplate of DEFAULT_TEMPLATES) {
      // Check if template already exists
      const exists = await Template.findOne({
        companyId,
        type: defaultTemplate.type,
        isDefault: true,
        isActive: true,
      });

      if (!exists) {
        const templateId = `tpl_${uuidv4()}`;

        const template = new Template({
          templateId,
          companyId,
          name: defaultTemplate.name,
          description: defaultTemplate.description,
          type: defaultTemplate.type,
          content: defaultTemplate.content,
          variables: defaultTemplate.variables,
          category: defaultTemplate.category,
          isActive: true,
          isDefault: true,
          version: 1,
          createdById: userId,
          createdByName: userName,
        });

        await template.save();
        seededCount++;
      }
    }

    return seededCount;
  }

  /**
   * Get templates by type
   */
  async getByType(
    companyId: string,
    type: string
  ): Promise<DocumentTemplate[]> {
    const templates = await Template.findByCompanyAndType(companyId, type as any);
    return templates.map((t) => t.toObject() as unknown as DocumentTemplate);
  }

  /**
   * Get template categories
   */
  async getCategories(companyId: string): Promise<string[]> {
    const result = await Template.aggregate([
      { $match: { companyId, isActive: true } },
      { $group: { _id: '$category' } },
      { $sort: { _id: 1 } },
    ]);
    return result.map((r: { _id: string }) => r._id).filter(Boolean);
  }
}

export const templateService = new TemplateService();
