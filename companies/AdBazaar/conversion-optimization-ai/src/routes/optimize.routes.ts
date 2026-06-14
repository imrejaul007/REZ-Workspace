/**
 * Optimization Routes
 * API endpoints for campaign optimization
 */

import { Router, Request, Response } from 'express';
import { authenticate, asyncHandler } from '../middleware';
import { validateBody, validateQuery, validateParams, schemas } from '../middleware/validation.middleware';
import { optimizationService } from '../services';
import { OptimizationGoals } from '../types';
import logger from 'utils/logger.js';

const router = Router();

/**
 * POST /api/optimize/campaign
 * Start campaign optimization
 */
router.post(
  '/campaign',
  authenticate,
  validateBody(schemas.createOptimization),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { campaignId, goals, maxBid } = req.body;
    const advertiserId = req.user!.advertiserId;

    // Check if optimization already exists for this campaign
    const existing = await optimizationService.getOptimizationByCampaign(campaignId);
    if (existing) {
      res.status(409).json({
        success: false,
        error: 'Optimization already exists for this campaign',
        data: { optimizationId: existing.optimizationId },
      });
      return;
    }

    const optimization = await optimizationService.createOptimization(
      campaignId,
      advertiserId,
      goals as OptimizationGoals,
      maxBid
    );

    logger.info('Campaign optimization started', { campaignId, optimizationId: optimization.optimizationId });

    res.status(201).json({
      success: true,
      data: {
        optimizationId: optimization.optimizationId,
        campaignId: optimization.campaignId,
        status: optimization.status,
        goals: optimization.goals,
        startedAt: optimization.startedAt,
      },
    });
  })
);

/**
 * GET /api/optimize/campaign/:id
 * Get optimization status
 */
router.get(
  '/campaign/:id',
  authenticate,
  validateParams(schemas.optimizationId),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const optimization = await optimizationService.getOptimization(id);

    if (!optimization) {
      res.status(404).json({
        success: false,
        error: 'Optimization not found',
      });
      return;
    }

    // Check if user owns this optimization
    if (optimization.advertiserId !== req.user!.advertiserId) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        optimizationId: optimization.optimizationId,
        campaignId: optimization.campaignId,
        status: optimization.status,
        goals: optimization.goals,
        currentPerformance: optimization.currentPerformance,
        recommendationsCount: optimization.recommendations.length,
        aiActions: {
          bidAdjustmentsCount: optimization.aiActions.bidAdjustments.length,
          audienceChangesCount: optimization.aiActions.audienceChanges.length,
          budgetReallocationsCount: optimization.aiActions.budgetReallocation.length,
        },
        startedAt: optimization.startedAt,
        updatedAt: optimization.updatedAt,
        lastOptimizedAt: optimization.lastOptimizedAt,
      },
    });
  })
);

/**
 * POST /api/optimize/bid
 * Get AI-optimized bid recommendation
 */
router.post(
  '/bid',
  authenticate,
  validateBody(schemas.bidOptimization),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { campaignId, placementId, currentBid, targetCPA } = req.body;

    // Verify campaign belongs to user
    const optimization = await optimizationService.getOptimizationByCampaign(campaignId);
    if (!optimization) {
      res.status(404).json({
        success: false,
        error: 'No active optimization found for this campaign',
      });
      return;
    }

    if (optimization.advertiserId !== req.user!.advertiserId) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    const recommendation = await optimizationService.generateBidRecommendation(
      campaignId,
      placementId,
      currentBid,
      targetCPA
    );

    logger.info('Bid recommendation generated', { campaignId, placementId });

    res.json({
      success: true,
      data: recommendation,
    });
  })
);

/**
 * GET /api/optimize/campaign/:id/insights
 * Get optimization insights
 */
router.get(
  '/campaign/:id/insights',
  authenticate,
  validateParams(schemas.optimizationId),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const optimization = await optimizationService.getOptimization(id);

    if (!optimization) {
      res.status(404).json({
        success: false,
        error: 'Optimization not found',
      });
      return;
    }

    if (optimization.advertiserId !== req.user!.advertiserId) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    const insights = await optimizationService.getInsights(id);

    res.json({
      success: true,
      data: {
        optimizationId: id,
        campaignId: optimization.campaignId,
        ...insights,
      },
    });
  })
);

/**
 * PUT /api/optimize/campaign/:id/pause
 * Pause optimization
 */
router.put(
  '/campaign/:id/pause',
  authenticate,
  validateParams(schemas.optimizationId),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const optimization = await optimizationService.getOptimization(id);

    if (!optimization) {
      res.status(404).json({
        success: false,
        error: 'Optimization not found',
      });
      return;
    }

    if (optimization.advertiserId !== req.user!.advertiserId) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    if (optimization.status === 'paused') {
      res.status(400).json({
        success: false,
        error: 'Optimization is already paused',
      });
      return;
    }

    if (optimization.status === 'completed') {
      res.status(400).json({
        success: false,
        error: 'Cannot pause a completed optimization',
      });
      return;
    }

    const updated = await optimizationService.pauseOptimization(id);

    logger.info('Optimization paused', { optimizationId: id });

    res.json({
      success: true,
      data: {
        optimizationId: updated!.optimizationId,
        status: updated!.status,
        updatedAt: updated!.updatedAt,
      },
    });
  })
);

/**
 * PUT /api/optimize/campaign/:id/resume
 * Resume optimization
 */
router.put(
  '/campaign/:id/resume',
  authenticate,
  validateParams(schemas.optimizationId),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const optimization = await optimizationService.getOptimization(id);

    if (!optimization) {
      res.status(404).json({
        success: false,
        error: 'Optimization not found',
      });
      return;
    }

    if (optimization.advertiserId !== req.user!.advertiserId) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    if (optimization.status !== 'paused') {
      res.status(400).json({
        success: false,
        error: 'Can only resume paused optimizations',
      });
      return;
    }

    const updated = await optimizationService.resumeOptimization(id);

    logger.info('Optimization resumed', { optimizationId: id });

    res.json({
      success: true,
      data: {
        optimizationId: updated!.optimizationId,
        status: updated!.status,
        updatedAt: updated!.updatedAt,
      },
    });
  })
);

/**
 * GET /api/optimize/recommendations
 * Get overall recommendations
 */
router.get(
  '/recommendations',
  authenticate,
  validateQuery(schemas.listOptimizations),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const advertiserId = req.user!.advertiserId;
    const { status } = req.query as { status?: string };

    const { data: optimizations, total } = await optimizationService.listOptimizations(
      advertiserId,
      { status }
    );

    // Collect all recommendations
    const allRecommendations = {
      high: [] as Array<{ campaignId: string; optimizationId: string; recommendation: unknown }>,
      medium: [] as Array<{ campaignId: string; optimizationId: string; recommendation: unknown }>,
      low: [] as Array<{ campaignId: string; optimizationId: string; recommendation: unknown }>,
    };

    for (const opt of optimizations) {
      for (const rec of opt.recommendations) {
        const entry = {
          campaignId: opt.campaignId,
          optimizationId: opt.optimizationId,
          recommendation: rec,
        };
        allRecommendations[rec.priority].push(entry);
      }
    }

    res.json({
      success: true,
      data: allRecommendations,
      pagination: {
        page: (req.query as { page?: number }).page || 1,
        limit: (req.query as { limit?: number }).limit || 20,
        total,
      },
    });
  })
);

/**
 * GET /api/optimize/campaign/:id/recommendations
 * Get recommendations for specific optimization
 */
router.get(
  '/campaign/:id/recommendations',
  authenticate,
  validateParams(schemas.optimizationId),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const optimization = await optimizationService.getOptimization(id);

    if (!optimization) {
      res.status(404).json({
        success: false,
        error: 'Optimization not found',
      });
      return;
    }

    if (optimization.advertiserId !== req.user!.advertiserId) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        optimizationId: optimization.optimizationId,
        campaignId: optimization.campaignId,
        recommendations: optimization.recommendations,
        total: optimization.recommendations.length,
      },
    });
  })
);

/**
 * GET /api/optimize/campaign/:id/audience
 * Get audience analysis
 */
router.get(
  '/campaign/:id/audience',
  authenticate,
  validateParams(schemas.optimizationId),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const optimization = await optimizationService.getOptimization(id);

    if (!optimization) {
      res.status(404).json({
        success: false,
        error: 'Optimization not found',
      });
      return;
    }

    if (optimization.advertiserId !== req.user!.advertiserId) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    const audience = await optimizationService.analyzeAudience(optimization.campaignId);

    res.json({
      success: true,
      data: {
        optimizationId: id,
        campaignId: optimization.campaignId,
        segments: audience,
      },
    });
  })
);

/**
 * GET /api/optimize/campaign/:id/timeslots
 * Get time-of-day optimization data
 */
router.get(
  '/campaign/:id/timeslots',
  authenticate,
  validateParams(schemas.optimizationId),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const optimization = await optimizationService.getOptimization(id);

    if (!optimization) {
      res.status(404).json({
        success: false,
        error: 'Optimization not found',
      });
      return;
    }

    if (optimization.advertiserId !== req.user!.advertiserId) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    const timeSlots = await optimizationService.getTimeSlotAnalysis(optimization.campaignId);

    res.json({
      success: true,
      data: {
        optimizationId: id,
        campaignId: optimization.campaignId,
        timeSlots,
      },
    });
  })
);

/**
 * GET /api/optimize/campaign/:id/competitors
 * Get competitor insights
 */
router.get(
  '/campaign/:id/competitors',
  authenticate,
  validateParams(schemas.optimizationId),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const optimization = await optimizationService.getOptimization(id);

    if (!optimization) {
      res.status(404).json({
        success: false,
        error: 'Optimization not found',
      });
      return;
    }

    if (optimization.advertiserId !== req.user!.advertiserId) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    const competitors = await optimizationService.getCompetitorInsights(optimization.campaignId);

    res.json({
      success: true,
      data: {
        optimizationId: id,
        campaignId: optimization.campaignId,
        competitors,
      },
    });
  })
);

export default router;