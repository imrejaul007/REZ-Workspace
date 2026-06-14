import { Router, Response } from 'express';
import { TemplateService } from '../services';
import { AuthenticatedRequest, Platform } from '../types';
import { authenticate, extractAccountId, asyncHandler } from '../middleware';
import { createModuleLogger } from 'utils/logger.js';
import {
  CreateTemplateSchema,
  UpdateTemplateSchema,
  PaginationSchema,
} from '../utils/validators';

const logger = createModuleLogger('TemplateRoutes');

export function createTemplateRouter(templateService: TemplateService): Router {
  const router = Router();

  // All routes require authentication
  router.use(authenticate);
  router.use(extractAccountId);

  /**
   * GET /api/templates
   * Get quick reply templates
   */
  router.get(
    '/',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const pagination = PaginationSchema.parse({
        page: req.query.page,
        limit: req.query.limit,
      });

      const result = await templateService.getTemplates({
        platform: req.query.platform as Platform | 'all',
        category: req.query.category as string,
        search: req.query.search as string,
        page: pagination.page,
        limit: pagination.limit,
      });

      res.json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    })
  );

  /**
   * POST /api/templates
   * Create template
   */
  router.post(
    '/',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const validated = CreateTemplateSchema.parse(req.body);

      const template = await templateService.createTemplate(validated);

      res.status(201).json({ success: true, data: template });
    })
  );

  /**
   * GET /api/templates/:id
   * Get template by ID
   */
  router.get(
    '/:id',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const template = await templateService.getTemplateById(req.params.id);

      if (!template) {
        res.status(404).json({ success: false, error: 'Template not found' });
        return;
      }

      res.json({ success: true, data: template });
    })
  );

  /**
   * PATCH /api/templates/:id
   * Update template
   */
  router.patch(
    '/:id',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const validated = UpdateTemplateSchema.parse(req.body);

      const template = await templateService.updateTemplate(req.params.id, validated);

      if (!template) {
        res.status(404).json({ success: false, error: 'Template not found' });
        return;
      }

      res.json({ success: true, data: template });
    })
  );

  /**
   * DELETE /api/templates/:id
   * Delete template
   */
  router.delete(
    '/:id',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const deleted = await templateService.deleteTemplate(req.params.id);

      if (!deleted) {
        res.status(404).json({ success: false, error: 'Template not found' });
        return;
      }

      res.json({ success: true, message: 'Template deleted' });
    })
  );

  /**
   * GET /api/templates/categories
   * Get template categories
   */
  router.get(
    '/categories',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const categories = await templateService.getCategories();

      res.json({ success: true, data: categories });
    })
  );

  /**
   * POST /api/templates/:id/use
   * Use template (increment usage count)
   */
  router.post(
    '/:id/use',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const template = await templateService.getTemplateById(req.params.id);

      if (!template) {
        res.status(404).json({ success: false, error: 'Template not found' });
        return;
      }

      await templateService.incrementUsage(req.params.id);

      res.json({ success: true, data: template });
    })
  );

  /**
   * GET /api/templates/suggested
   * Get suggested templates based on keywords
   */
  router.get(
    '/suggested',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const platform = req.query.platform as Platform;
      const keywords = (req.query.keywords as string)?.split(',') || [];

      if (!platform) {
        res.status(400).json({ success: false, error: 'Platform is required' });
        return;
      }

      const templates = await templateService.getSuggestedTemplates(platform, keywords);

      res.json({ success: true, data: templates });
    })
  );

  return router;
}
