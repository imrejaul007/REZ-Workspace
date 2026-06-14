import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware';
import { serviceAuth, validateRequest } from '../middleware';
import { CreateSurveySchema } from '../utils/validation';
import { surveyService, SurveyResponseInput } from '../services';
import { logger } from '../utils/logger';

const router = Router();

// Create survey
router.post(
  '/',
  serviceAuth,
  validateRequest(CreateSurveySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const survey = await surveyService.createSurvey(req.body);

    logger.info('Survey created via API', { surveyId: survey._id, studyId: req.body.studyId });

    res.status(201).json({
      success: true,
      data: survey
    });
  })
);

// List surveys
router.get(
  '/',
  serviceAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const studyId = req.query.studyId as string;
    const status = req.query.status as string;

    const surveys = await surveyService.listSurveys(studyId, status);

    res.json({
      success: true,
      data: surveys,
      count: surveys.length
    });
  })
);

// Get survey by ID
router.get(
  '/:id',
  serviceAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const survey = await surveyService.getSurvey(req.params.id);

    if (!survey) {
      res.status(404).json({
        success: false,
        error: 'Survey not found'
      });
      return;
    }

    res.json({
      success: true,
      data: survey
    });
  })
);

// Activate survey
router.post(
  '/:id/activate',
  serviceAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const survey = await surveyService.activateSurvey(req.params.id);

    if (!survey) {
      res.status(404).json({
        success: false,
        error: 'Survey not found'
      });
      return;
    }

    res.json({
      success: true,
      data: survey,
      message: 'Survey activated successfully'
    });
  })
);

// Complete survey
router.post(
  '/:id/complete',
  serviceAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const survey = await surveyService.completeSurvey(req.params.id);

    if (!survey) {
      res.status(404).json({
        success: false,
        error: 'Survey not found'
      });
      return;
    }

    res.json({
      success: true,
      data: survey,
      message: 'Survey completed successfully'
    });
  })
);

// Submit survey response
router.post(
  '/:id/responses',
  serviceAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const responseInput: SurveyResponseInput = {
      surveyId: req.params.id,
      respondentId: req.body.respondentId,
      treatmentGroup: req.body.treatmentGroup,
      responses: req.body.responses,
      completionTime: req.body.completionTime,
      demographics: req.body.demographics,
      metadata: req.body.metadata
    };

    const response = await surveyService.submitResponse(responseInput);

    logger.info('Survey response submitted via API', {
      surveyId: req.params.id,
      respondentId: req.body.respondentId
    });

    res.status(201).json({
      success: true,
      data: response
    });
  })
);

// Get survey responses
router.get(
  '/:id/responses',
  serviceAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const treatmentGroup = req.query.treatmentGroup !== undefined
      ? req.query.treatmentGroup === 'true'
      : undefined;

    const responses = await surveyService.getResponses(req.params.id, treatmentGroup);

    res.json({
      success: true,
      data: responses,
      count: responses.length
    });
  })
);

// Get survey response stats
router.get(
  '/:id/stats',
  serviceAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await surveyService.getResponseStats(req.params.id);

    res.json({
      success: true,
      data: stats
    });
  })
);

export default router;