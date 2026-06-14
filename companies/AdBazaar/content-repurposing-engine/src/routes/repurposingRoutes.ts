import { Router, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { repurposingService } from '../services/repurposingService.js';
import { highlightsExtractionService } from '../services/highlightsExtraction.js';
import { logger } from 'utils/logger.js';

const router = Router();

// Validation schemas
const repurposeSchema = z.object({
  originalContentId: z.string().min(1),
  originalPlatform: z.string().min(1),
  targetPlatform: z.string().min(1),
  content: z.object({
    title: z.string().min(1).max(300),
    description: z.string().max(5000).optional().default(''),
    hashtags: z.array(z.string()).optional().default([]),
    aspectRatio: z.string().optional(),
    mediaUrl: z.string().url().optional().default(''),
  }),
  templateId: z.string().optional(),
});

const batchRepurposeSchema = z.object({
  originalContentId: z.string().min(1),
  originalPlatform: z.string().min(1),
  targets: z.array(z.string().min(1)).min(1),
  content: z.object({
    title: z.string().min(1).max(300),
    description: z.string().max(5000).optional().default(''),
    hashtags: z.array(z.string()).optional().default([]),
    aspectRatio: z.string().optional(),
    mediaUrl: z.string().url().optional().default(''),
  }),
});

const adaptSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional().default(''),
  hashtags: z.array(z.string()).optional().default([]),
  aspectRatio: z.string().optional(),
  targetPlatform: z.string().min(1),
});

const highlightsSchema = z.object({
  sourceVideoId: z.string().min(1),
  sourceVideoUrl: z.string().url(),
  duration: z.number().positive(),
  targetPlatform: z.string().min(1),
  maxHighlights: z.number().positive().optional().default(5),
  minDuration: z.number().positive().optional().default(5),
  maxDuration: z.number().positive().optional().default(60),
});

const historySchema = z.object({
  originalContentId: z.string().optional(),
  originalPlatform: z.string().optional(),
  targetPlatform: z.string().optional(),
  limit: z.coerce.number().positive().optional().default(20),
  offset: z.coerce.number().nonnegative().optional().default(0),
});

// POST /api/repurpose - Repurpose content for a target platform
router.post(
  '/',
  authMiddleware,
  validateBody(repurposeSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const result = await repurposingService.repurpose({
        ...req.body,
        templateId: req.body.templateId,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/repurpose/batch - Batch repurposing
router.post(
  '/batch',
  authMiddleware,
  validateBody(batchRepurposeSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const results = await repurposingService.batchRepurpose(req.body);

      res.status(201).json({
        success: true,
        data: {
          results,
          count: results.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/repurpose/highlights - Extract video highlights
router.post(
  '/highlights',
  authMiddleware,
  validateBody(highlightsSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const highlights = await highlightsExtractionService.extractHighlights(req.body);

      res.status(201).json({
        success: true,
        data: {
          highlights,
          count: highlights.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/repurpose/history - Repurposing history
router.get(
  '/history',
  authMiddleware,
  validateBody(historySchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const history = await repurposingService.getHistory({
        originalContentId: req.body.originalContentId,
        originalPlatform: req.body.originalPlatform,
        targetPlatform: req.body.targetPlatform,
        limit: req.body.limit,
        offset: req.body.offset,
      });

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/repurpose/adapt - Adapt single piece of content
router.post(
  '/adapt',
  authMiddleware,
  validateBody(adaptSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const adapted = await repurposingService.adaptContent(
        {
          title: req.body.title,
          description: req.body.description,
          hashtags: req.body.hashtags,
          aspectRatio: req.body.aspectRatio,
        },
        req.body.targetPlatform
      );

      res.json({
        success: true,
        data: adapted,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/repurpose/:id - Get repurposed content
router.get(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const content = await repurposingService.getById(req.params.id);

      res.json({
        success: true,
        data: content,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;