import { Request, Response, NextFunction } from 'express';
import { createTemplate, getTemplateById, listTemplates, updateTemplate, deleteTemplate, getTemplateStats } from '../services/templateService';
import { CreateTemplateSchema, UpdateTemplateSchema, ListTemplatesQuerySchema } from '../utils/validators';

/**
 * Create a new onboarding template
 * POST /api/templates
 */
export async function createTemplateHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = CreateTemplateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten()
      });
      return;
    }

    const createdBy = (req.headers['x-user-id'] as string) || 'system';
    const template = await createTemplate(parsed.data, createdBy);

    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get template by ID
 * GET /api/templates/:templateId
 */
export async function getTemplateHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { templateId } = req.params;
    const template = await getTemplateById(templateId);

    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Template not found'
      });
      return;
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List all templates with filters
 * GET /api/templates
 */
export async function listTemplatesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = ListTemplatesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten()
      });
      return;
    }

    const result = await listTemplates(parsed.data);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update a template
 * PUT /api/templates/:templateId
 */
export async function updateTemplateHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { templateId } = req.params;
    const parsed = UpdateTemplateSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten()
      });
      return;
    }

    const template = await updateTemplate(templateId, parsed.data);

    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Template not found'
      });
      return;
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a template (soft delete)
 * DELETE /api/templates/:templateId
 */
export async function deleteTemplateHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { templateId } = req.params;
    const deleted = await deleteTemplate(templateId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Template not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get template statistics
 * GET /api/templates/:templateId/stats
 */
export async function getTemplateStatsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { templateId } = req.params;
    const result = await getTemplateStats(templateId);

    if (!result) {
      res.status(404).json({
        success: false,
        error: 'Template not found'
      });
      return;
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}
