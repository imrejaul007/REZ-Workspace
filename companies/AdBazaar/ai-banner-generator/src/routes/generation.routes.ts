/**
 * Banner Generation Routes
 */

import { Router, Request, Response } from 'express';
import { bannerGenerationService } from '../services';
import { authMiddleware, validateBody, schemas, recordBannerGeneration, asyncHandler, createError } from '../middleware';
import { GenerateBannerRequest, GenerateVariantRequest, RegenerateRequest } from '../types';

const router = Router();

/**
 * POST /api/generate/banner
 * Generate a new banner from description
 */
router.post(
  '/banner',
  authMiddleware,
  validateBody(schemas.generateBanner),
  asyncHandler(async (req: Request, res: Response) => {
    const advertiserId = req.user!.advertiserId;
    const startTime = Date.now();

    try {
      const result = await bannerGenerationService.generateBanner(
        advertiserId,
        req.body as GenerateBannerRequest
      );

      const durationSeconds = (Date.now() - startTime) / 1000;
      recordBannerGeneration('completed', req.body.format, req.body.style, durationSeconds);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      recordBannerGeneration('failed', req.body.format, req.body.style);
      throw error;
    }
  })
);

/**
 * POST /api/generate/variant
 * Generate banner variants
 */
router.post(
  '/variant',
  authMiddleware,
  validateBody(schemas.generateVariants),
  asyncHandler(async (req: Request, res: Response) => {
    const advertiserId = req.user!.advertiserId;
    const { baseGenerationId, count, variations } = req.body as GenerateVariantRequest;

    const variants = await bannerGenerationService.generateVariants(
      advertiserId,
      baseGenerationId,
      { count, variations }
    );

    res.status(201).json({
      success: true,
      data: variants,
    });
  })
);

/**
 * GET /api/banners/:id
 * Get generated banner by ID
 */
router.get(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const advertiserId = req.user!.advertiserId;

    const generation = await bannerGenerationService.getGeneration(id);

    if (!generation) {
      res.status(404).json({
        success: false,
        error: 'Banner not found',
      });
      return;
    }

    // Check ownership
    if (generation.advertiserId !== advertiserId && req.user!.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    res.json({
      success: true,
      data: generation,
    });
  })
);

/**
 * POST /api/banners/:id/regenerate
 * Regenerate banner with changes
 */
router.post(
  '/:id/regenerate',
  authMiddleware,
  validateBody(schemas.regenerate),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const advertiserId = req.user!.advertiserId;
    const { changes } = req.body as RegenerateRequest;
    const startTime = Date.now();

    try {
      const result = await bannerGenerationService.regenerateBanner(
        id,
        advertiserId,
        changes
      );

      const durationSeconds = (Date.now() - startTime) / 1000;
      recordBannerGeneration('completed', result.request.format, result.request.style, durationSeconds);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'Banner not found',
        });
        return;
      }
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
 * GET /api/banners
 * List banners for advertiser
 */
router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const advertiserId = req.user!.advertiserId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as 'processing' | 'completed' | 'failed' | undefined;

    const result = await bannerGenerationService.getGenerationsByAdvertiser(
      advertiserId,
      { page, limit, status }
    );

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
 * GET /api/banners/:id/performance
 * Predict banner performance
 */
router.get(
  '/:id/performance',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const performance = await bannerGenerationService.predictPerformance(id);

      res.json({
        success: true,
        data: performance,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'Banner not found or not completed',
        });
        return;
      }
      throw error;
    }
  })
);

/**
 * GET /api/banners/stats
 * Get generation statistics
 */
router.get(
  '/stats',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const advertiserId = req.user!.advertiserId;

    const stats = await bannerGenerationService.getStatistics(advertiserId);

    res.json({
      success: true,
      data: stats,
    });
  })
);

export default router;