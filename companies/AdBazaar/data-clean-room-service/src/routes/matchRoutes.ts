import { Router, Request, Response } from 'express';
import { matchingService } from '../services';
import { MatchRequestSchema, ApiResponse } from '../types';
import { validateRequest, asyncHandler } from '../middleware';
import logger from '../config/logger';

const router = Router();

/**
 * POST /api/match
 * Run matching against REZ audience
 */
router.post(
  '/',
  validateRequest(MatchRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Match request received', {
      uploadId: req.body.uploadId,
      matchType: req.body.matchType,
    });

    const result = await matchingService.runMatch(req.body);

    const response: ApiResponse = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };

    res.status(201).json(response);
  })
);

/**
 * GET /api/match/results
 * Get all match results for an upload
 */
router.get(
  '/results',
  asyncHandler(async (req: Request, res: Response) => {
    const uploadId = req.query.uploadId as string;

    if (!uploadId) {
      res.status(400).json({
        success: false,
        error: 'uploadId query parameter is required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const results = await matchingService.getMatchResultsByUpload(uploadId);

    const response: ApiResponse = {
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

/**
 * GET /api/match/:matchId
 * Get specific match result
 */
router.get(
  '/:matchId',
  asyncHandler(async (req: Request, res: Response) => {
    const { matchId } = req.params;

    const result = await matchingService.getMatchResult(matchId);

    if (!result) {
      res.status(404).json({
        success: false,
        error: 'Match result not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

/**
 * GET /api/match/brand/:brandId
 * Get all match jobs for a brand
 */
router.get(
  '/brand/:brandId',
  asyncHandler(async (req: Request, res: Response) => {
    const { brandId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const jobs = await matchingService.getMatchJobsByBrand(brandId, limit);

    const response: ApiResponse = {
      success: true,
      data: jobs.map(job => ({
        matchId: job.matchId,
        uploadId: job.uploadId,
        matchType: job.matchType,
        status: job.status,
        uploadedRecords: job.uploadedRecords,
        matchedRecords: job.matchedRecords,
        matchRate: job.matchRate,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
      })),
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

/**
 * GET /api/match/analytics
 * Get match analytics for a brand
 */
router.get(
  '/analytics',
  asyncHandler(async (req: Request, res: Response) => {
    const brandId = req.headers['x-brand-id'] as string;

    if (!brandId) {
      res.status(400).json({
        success: false,
        error: 'Brand ID is required in x-brand-id header',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const analytics = await matchingService.getMatchAnalytics(brandId);

    const response: ApiResponse = {
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

export default router;