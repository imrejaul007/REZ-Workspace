import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware';
import { serviceAuth } from '../middleware';
import { analysisService, AnalysisRequest } from '../services';
import { logger } from '../utils/logger';

const router = Router();

// Run analysis for a study
router.post(
  '/studies/:studyId/analyze',
  serviceAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const request: AnalysisRequest = {
      studyId: req.params.studyId,
      type: req.body.type || 'both',
      confidenceLevel: req.body.confidenceLevel
    };

    const result = await analysisService.runAnalysis(request);

    logger.info('Analysis completed via API', {
      studyId: req.params.studyId,
      type: request.type,
      lift: result.overallLift
    });

    res.json({
      success: true,
      data: result
    });
  })
);

// Get analysis results for a study
router.get(
  '/studies/:studyId/results',
  serviceAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await analysisService.getResults(req.params.studyId);

    if (!result) {
      res.status(404).json({
        success: false,
        error: 'Analysis results not found. Run analysis first.'
      });
      return;
    }

    res.json({
      success: true,
      data: result
    });
  })
);

// Get recommendations for a study
router.get(
  '/studies/:studyId/recommendations',
  serviceAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const recommendations = await analysisService.getRecommendations(req.params.studyId);

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length
    });
  })
);

// Compare multiple studies
router.post(
  '/compare',
  serviceAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const studyIds = req.body.studyIds as string[];

    if (!Array.isArray(studyIds) || studyIds.length < 2) {
      res.status(400).json({
        success: false,
        error: 'At least 2 study IDs required for comparison'
      });
      return;
    }

    const results = await Promise.all(
      studyIds.map(id => analysisService.getResults(id))
    );

    const comparison = results.map((result, index) => ({
      studyId: studyIds[index],
      overallLift: result?.overallLift || 0,
      confidence: result?.confidence || 0,
      pValue: result?.pValue || 1,
      statisticalSignificance: result?.statisticalSignificance || false,
      sampleSize: result?.sampleSize.total || 0
    }));

    // Sort by lift
    comparison.sort((a, b) => b.overallLift - a.overallLift);

    res.json({
      success: true,
      data: comparison,
      winner: comparison[0]
    });
  })
);

export default router;