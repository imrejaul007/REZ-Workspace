import { Request, Response } from 'express';
import { templateService } from '../services';
import { CreateTemplateSchema, UpdateTemplateSchema, GetTemplatesSchema } from '../validators';
import { NotificationType } from '../models';

/**
 * Create a new template
 * POST /api/templates
 */
export async function createTemplate(req: Request, res: Response): Promise<void> {
  const validation = CreateTemplateSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.error.flatten(),
    });
    return;
  }

  const data = validation.data;

  try {
    const template = await templateService.createTemplate({
      ...data,
      type: data.type as NotificationType,
    });

    res.status(201).json({
      success: true,
      data: template,
      message: 'Template created successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create template';
    res.status(400).json({
      success: false,
      error: message,
    });
  }
}

/**
 * Update a template
 * PATCH /api/templates/:id
 */
export async function updateTemplate(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const validation = UpdateTemplateSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.error.flatten(),
    });
    return;
  }

  try {
    const template = await templateService.updateTemplate(id, validation.data);

    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Template not found',
      });
      return;
    }

    res.json({
      success: true,
      data: template,
      message: 'Template updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update template',
    });
  }
}

/**
 * Get templates
 * GET /api/templates
 */
export async function getTemplates(req: Request, res: Response): Promise<void> {
  const validation = GetTemplatesSchema.safeParse(req.query);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.error.flatten(),
    });
    return;
  }

  const params = validation.data;

  try {
    const result = await templateService.getTemplates({
      page: params.page,
      limit: params.limit,
      type: params.type as NotificationType | undefined,
      companyId: params.companyId,
      isActive: params.isActive,
      search: params.search,
      tags: params.tags,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates',
    });
  }
}

/**
 * Get template by ID
 * GET /api/templates/:id
 */
export async function getTemplateById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const template = await templateService.getTemplateById(id);

    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Template not found',
      });
      return;
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch template',
    });
  }
}

/**
 * Delete a template
 * DELETE /api/templates/:id
 */
export async function deleteTemplate(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const deleted = await templateService.deleteTemplate(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Template not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete template',
    });
  }
}

/**
 * Duplicate a template
 * POST /api/templates/:id/duplicate
 */
export async function duplicateTemplate(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { newName, createdBy } = req.body;

  if (!newName || !createdBy) {
    res.status(400).json({
      success: false,
      error: 'newName and createdBy are required',
    });
    return;
  }

  try {
    const template = await templateService.duplicateTemplate(id, newName, createdBy);

    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Template not found',
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: template,
      message: 'Template duplicated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to duplicate template',
    });
  }
}

/**
 * Set default template
 * POST /api/templates/:id/set-default
 */
export async function setDefaultTemplate(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { companyId } = req.body;

  try {
    const template = await templateService.setDefaultTemplate(id, companyId);

    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Template not found',
      });
      return;
    }

    res.json({
      success: true,
      data: template,
      message: 'Template set as default',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to set default template',
    });
  }
}

/**
 * Get templates by type
 * GET /api/templates/type/:type
 */
export async function getTemplatesByType(req: Request, res: Response): Promise<void> {
  const { type } = req.params;
  const { companyId } = req.query;

  try {
    const templates = await templateService.getTemplatesByType(
      type as NotificationType,
      companyId as string | undefined
    );

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates',
    });
  }
}

/**
 * Bulk update template status
 * PATCH /api/templates/bulk/status
 */
export async function bulkUpdateStatus(req: Request, res: Response): Promise<void> {
  const { templateIds, isActive } = req.body;

  if (!templateIds || !Array.isArray(templateIds) || typeof isActive !== 'boolean') {
    res.status(400).json({
      success: false,
      error: 'templateIds array and isActive boolean are required',
    });
    return;
  }

  try {
    const count = await templateService.bulkUpdateStatus(templateIds, isActive);

    res.json({
      success: true,
      data: { updated: count },
      message: `${count} templates updated`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update templates',
    });
  }
}
