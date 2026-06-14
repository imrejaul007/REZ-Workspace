import { Router, Request, Response, NextFunction } from 'express';
import { templateService } from '../services';
import {
  createShiftTemplateSchema,
  updateShiftTemplateSchema,
} from '../types/schemas';
import { ZodError } from 'zod';

const router = Router();

/**
 * POST /api/shifts/templates
 * Create a new shift template
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createShiftTemplateSchema.parse(req.body);
    const template = await templateService.createTemplate(validated);

    res.status(201).json({
      success: true,
      data: template,
      message: 'Shift template created successfully',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }
    next(error);
  }
});

/**
 * GET /api/shifts/templates
 * List all shift templates
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const { templates, total } = await templateService.getTemplates(page, limit);

    res.json({
      success: true,
      data: templates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/shifts/templates/:id
 * Get template by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await templateService.getTemplateById(req.params.id);

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
    next(error);
  }
});

/**
 * PATCH /api/shifts/templates/:id
 * Update a template
 */
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = updateShiftTemplateSchema.parse(req.body);
    const template = await templateService.updateTemplate(req.params.id, validated);

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
      message: 'Shift template updated successfully',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }
    next(error);
  }
});

/**
 * DELETE /api/shifts/templates/:id
 * Delete a template
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await templateService.deleteTemplate(req.params.id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Template not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Shift template deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
