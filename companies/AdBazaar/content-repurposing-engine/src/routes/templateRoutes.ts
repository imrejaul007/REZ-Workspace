import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { templateService } from '../services/templateService.js';

const router = Router();

// Validation schemas
const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  sourcePlatform: z.string().min(1),
  targetPlatform: z.string().min(1),
  rules: z.object({
    maxLength: z.number().min(1).max(5000),
    includeHashtags: z.boolean().optional().default(true),
    adaptEmoji: z.boolean().optional().default(true),
    addCTA: z.boolean().optional().default(false),
    aspectRatio: z.string().optional().default('16:9'),
  }),
});

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  rules: z.object({
    maxLength: z.number().min(1).max(5000).optional(),
    includeHashtags: z.boolean().optional(),
    adaptEmoji: z.boolean().optional(),
    addCTA: z.boolean().optional(),
    aspectRatio: z.string().optional(),
  }).optional(),
  isActive: z.boolean().optional(),
});

const listQuerySchema = z.object({
  sourcePlatform: z.string().optional(),
  targetPlatform: z.string().optional(),
  createdBy: z.string().optional(),
  isActive: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  limit: z.coerce.number().positive().optional().default(20),
  offset: z.coerce.number().nonnegative().optional().default(0),
});

// GET /api/templates - List platform templates
router.get(
  '/',
  authMiddleware,
  async (req, res, next) => {
    try {
      const query = {
        sourcePlatform: req.query.sourcePlatform as string | undefined,
        targetPlatform: req.query.targetPlatform as string | undefined,
        createdBy: req.query.createdBy as string | undefined,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        limit: parseInt(req.query.limit as string) || 20,
        offset: parseInt(req.query.offset as string) || 0,
      };

      const result = await templateService.list(query);

      res.json({
        success: true,
        data: {
          items: result.items,
          total: result.total,
          limit: query.limit,
          offset: query.offset,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/templates - Create template
router.post(
  '/',
  authMiddleware,
  validateBody(createTemplateSchema),
  async (req, res, next) => {
    try {
      const userId = (req as any).user?.id || 'system';

      const template = await templateService.create({
        ...req.body,
        createdBy: userId,
      });

      res.status(201).json({
        success: true,
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/templates/:id - Update template
router.patch(
  '/:id',
  authMiddleware,
  validateBody(updateTemplateSchema),
  async (req, res, next) => {
    try {
      const template = await templateService.update(req.params.id, req.body);

      res.json({
        success: true,
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/templates/:id - Delete template
router.delete(
  '/:id',
  authMiddleware,
  async (req, res, next) => {
    try {
      await templateService.delete(req.params.id);

      res.json({
        success: true,
        message: 'Template deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;