import { Router, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { templateService } from '../services';
import {
  CreateTemplateSchema,
  UpdateTemplateSchema,
  TemplateQuerySchema,
} from '../validators';

const router = Router();

// Helper to extract user and company from headers
const getContext = (req: Request) => ({
  userId: req.headers['x-user-id'] as string || 'system',
  userName: req.headers['x-user-name'] as string || 'System',
  companyId: req.headers['x-company-id'] as string || process.env.DEFAULT_COMPANY_ID || 'corpservice',
});

/**
 * POST /api/templates - Create a new template
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, userName, companyId } = getContext(req);
    const input = CreateTemplateSchema.parse(req.body);

    const template = await templateService.create(input, userId, userName, companyId);

    res.status(201).json({
      success: true,
      data: template,
      message: 'Template created successfully',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }
    next(error);
  }
});

/**
 * GET /api/templates - List templates
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = TemplateQuerySchema.parse(req.query);
    const result = await templateService.list(query);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }
    next(error);
  }
});

/**
 * GET /api/templates/:id - Get template by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await templateService.getById(req.params.id);

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
 * PUT /api/templates/:id - Update template
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, userName } = getContext(req);
    const input = UpdateTemplateSchema.parse(req.body);

    const template = await templateService.update(req.params.id, input, userId, userName);

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
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }
    next(error);
  }
});

/**
 * DELETE /api/templates/:id - Delete template
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, userName } = getContext(req);

    const deleted = await templateService.delete(req.params.id, userId, userName);

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
    next(error);
  }
});

/**
 * POST /api/templates/seed - Seed default templates
 */
router.post('/seed', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, userName, companyId } = getContext(req);

    const count = await templateService.seedDefaults(companyId, userId, userName);

    res.json({
      success: true,
      data: { seeded: count },
      message: `Seeded ${count} default templates`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/templates/meta/categories - Get template categories
 */
router.get('/meta/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyId } = getContext(req);
    const categories = await templateService.getCategories(companyId);

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
