import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware';
import { serviceAuth, validateRequest } from '../middleware';
import { BrandLiftSurveySchema } from '../utils/validation';
import { brandLiftService } from '../services';
import { logger } from '../utils/logger';

const router = Router();

// Submit brand lift survey response
router.post(
  '/:studyId/brand-lift',
  serviceAuth,
  validateRequest(BrandLiftSurveySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const survey = await brandLiftService.submitSurvey(req.body, req.params.studyId);

    logger.info('Brand lift survey submitted via API', {
      studyId: req.params.studyId,
      respondentId: req.body.respondentId
    });

    res.status(201).json({
      success: true,
      data: survey
    });
  })
);

// Get brand lift results
router.get(
  '/:studyId/brand-lift',
  serviceAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await brandLiftService.getBrandLiftResults(req.params.studyId);

    if (!result) {
      res.status(404).json({
        success: false,
        error: 'Brand lift results not available. Insufficient data or study not found.'
      });
      return;
    }

    res.json({
      success: true,
      data: result
    });
  })
);

// Get brand lift survey responses
router.get(
  '/:studyId/brand-lift/responses',
  serviceAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const treatmentGroup = req.query.treatmentGroup !== undefined
      ? req.query.treatmentGroup === 'true'
      : undefined;

    const responses = await brandLiftService.getSurveyResponses(req.params.studyId, treatmentGroup);

    res.json({
      success: true,
      data: responses,
      count: responses.length
    });
  })
);

export default router;