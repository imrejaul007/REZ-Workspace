/**
 * Banner Template Routes
 */

import { Router, Request, Response } from 'express';
import { bannerTemplateService } from '../services';
import {
  authMiddleware,
  optionalAuthMiddleware,
  validateBody,
  validateQuery,
  schemas,
  recordTemplateUsage,
  asyncHandler,
} from '../middleware';
import { CreateTemplateRequest } from '../types';

const router = Router();

/**
 * GET /api/templates
 * List banner templates
 */
router.get(
  '/',
  optionalAuthMiddleware,
  validateQuery(schemas.listTemplatesQuery),
  asyncHandler(async (req: Request, res: Response) => {
    const category = req.query.category as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await bannerTemplateService.listTemplates({
      category,
      page,
      limit,
      isPublic: true,
    });

    res.json({
      success: true,
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  })
);

/**
 * GET /api/templates/categories
 * Get available template categories
 */
router.get(
  '/categories',
  asyncHandler(async (_req: Request, res: Response) => {
    const categories = await bannerTemplateService.getCategories();

    res.json({
      success: true,
      data: categories,
    });
  })
);

/**
 * GET /api/templates/popular
 * Get popular templates
 */
router.get(
  '/popular',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const templates = await bannerTemplateService.getPopularTemplates(limit);

    res.json({
      success: true,
      data: templates,
    });
  })
);

/**
 * GET /api/templates/search
 * Search templates by name
 */
router.get(
  '/search',
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!query || query.length < 2) {
      res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters',
      });
      return;
    }

    const templates = await bannerTemplateService.searchTemplates(query, limit);

    res.json({
      success: true,
      data: templates,
    });
  })
);

/**
 * GET /api/templates/:id
 * Get template by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const template = await bannerTemplateService.getTemplate(id);

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
  })
);

/**
 * POST /api/templates
 * Create a new template
 */
router.post(
  '/',
  authMiddleware,
  validateBody(schemas.createTemplate),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const template = await bannerTemplateService.createTemplate(userId, {
      name: req.body.name,
      category: req.body.category,
      dimensions: req.body.dimensions,
      layout: req.body.layout,
      isPublic: req.body.isPublic,
    });

    res.status(201).json({
      success: true,
      data: template,
    });
  })
);

/**
 * PUT /api/templates/:id
 * Update a template
 */
router.put(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;

    try {
      const template = await bannerTemplateService.updateTemplate(id, userId, {
        name: req.body.name,
        category: req.body.category,
        dimensions: req.body.dimensions,
        layout: req.body.layout,
        isPublic: req.body.isPublic,
      });

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
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        res.status(403).json({
          success: false,
          error: 'Access denied',
        });
        return;
      }
      throw error;
    }
  })
);

/**
 * DELETE /api/templates/:id
 * Delete a template
 */
router.delete(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;

    try {
      const deleted = await bannerTemplateService.deleteTemplate(id, userId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Template not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Template deleted',
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        res.status(403).json({
          success: false,
          error: 'Access denied',
        });
        return;
      }
      throw error;
    }
  })
);

/**
 * POST /api/templates/:id/use
 * Record template usage (for A/B testing)
 */
router.post(
  '/:id/use',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await bannerTemplateService.incrementUsage(id);

    // Get updated template
    const template = await bannerTemplateService.getTemplate(id);
    if (template) {
      recordTemplateUsage(template.category);
    }

    res.json({
      success: true,
      message: 'Usage recorded',
    });
  })
);

/**
 * POST /api/templates/:id/performance
 * Update template performance metrics
 */
router.post(
  '/:id/performance',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { ctr, conversion } = req.body;

    if (ctr === undefined && conversion === undefined) {
      res.status(400).json({
        success: false,
        error: 'Either ctr or conversion is required',
      });
      return;
    }

    await bannerTemplateService.updatePerformance(id, { ctr, conversion });

    res.json({
      success: true,
      message: 'Performance updated',
    });
  })
);

export default router;