import { Router, Request, Response } from 'express';
import { overlapService } from '../services';
import { OverlapAnalysisRequestSchema, ApiResponse } from '../types';
import { validateRequest, asyncHandler } from '../middleware';
import logger from '../config/logger';

const router = Router();

/**
 * POST /api/overlap
 * Analyze overlap between two datasets
 */
router.post(
  '/',
  validateRequest(OverlapAnalysisRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Overlap analysis request received', {
      uploadId1: req.body.uploadId1,
      uploadId2: req.body.uploadId2,
      analysisType: req.body.analysisType,
    });

    const result = await overlapService.analyzeOverlap(req.body);

    const response: ApiResponse = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };

    res.status(201).json(response);
  })
);

/**
 * GET /api/overlap/:analysisId
 * Get overlap analysis result
 */
router.get(
  '/:analysisId',
  asyncHandler(async (req: Request, res: Response) => {
    const { analysisId } = req.params;

    const result = await overlapService.getOverlapAnalysis(analysisId);

    if (!result) {
      res.status(404).json({
        success: false,
        error: 'Overlap analysis not found',
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
 * GET /api/overlap/brand/:brandId
 * Get all overlap analyses for a brand
 */
router.get(
  '/brand/:brandId',
  asyncHandler(async (req: Request, res: Response) => {
    const { brandId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const analyses = await overlapService.getOverlapAnalysesByBrand(brandId, limit);

    const response: ApiResponse = {
      success: true,
      data: analyses.map(a => ({
        analysisId: a.analysisId,
        uploadId1: a.uploadId1,
        uploadId2: a.uploadId2,
        analysisType: a.analysisType,
        overlappingRecords: a.overlappingRecords,
        overlapPercentage: a.overlapPercentage,
        jaccardIndex: a.jaccardIndex,
        createdAt: a.createdAt,
      })),
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

export default router;