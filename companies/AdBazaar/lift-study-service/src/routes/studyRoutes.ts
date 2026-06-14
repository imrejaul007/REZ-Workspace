import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware';
import { serviceAuth, validateRequest } from '../middleware';
import { CreateLiftStudySchema, UpdateLiftStudySchema, StartLiftStudySchema } from '../utils/validation';
import { studyService, StudyFilters } from '../services';
import { logger } from '../utils/logger';

const router = Router();

// Create lift study
router.post(
  '/',
  serviceAuth,
  validateRequest(CreateLiftStudySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const createdBy = (req as any).serviceId || 'system';
    const study = await studyService.createStudy(req.body, createdBy);

    logger.info('Lift study created via API', { studyId: study._id });

    res.status(201).json({
      success: true,
      data: study
    });
  })
);

// List studies
router.get(
  '/',
  serviceAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const filters: StudyFilters = {
      status: req.query.status as string,
      type: req.query.type as string,
      campaignId: req.query.campaignId as string,
      platform: req.query.platform as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined
    };

    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }

    const result = await studyService.listStudies(filters);

    res.json({
      success: true,
      data: result.studies,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        pages: Math.ceil(result.total / (filters.limit || 20))
      }
    });
  })
);

// Get study by ID
router.get(
  '/:id',
  serviceAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const study = await studyService.getStudy(req.params.id);

    if (!study) {
      res.status(404).json({
        success: false,
        error: 'Study not found'
      });
      return;
    }

    res.json({
      success: true,
      data: study
    });
  })
);

// Update study
router.put(
  '/:id',
  serviceAuth,
  validateRequest(UpdateLiftStudySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const study = await studyService.updateStudy(req.params.id, req.body);

    if (!study) {
      res.status(404).json({
        success: false,
        error: 'Study not found'
      });
      return;
    }

    res.json({
      success: true,
      data: study
    });
  })
);

// Start study
router.post(
  '/:id/start',
  serviceAuth,
  validateRequest(StartLiftStudySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.body;
    const study = await studyService.startStudy(req.params.id, startDate, endDate);

    if (!study) {
      res.status(404).json({
        success: false,
        error: 'Study not found'
      });
      return;
    }

    res.json({
      success: true,
      data: study,
      message: 'Study started successfully'
    });
  })
);

// Pause study
router.post(
  '/:id/pause',
  serviceAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const study = await studyService.pauseStudy(req.params.id);

    if (!study) {
      res.status(404).json({
        success: false,
        error: 'Study not found'
      });
      return;
    }

    res.json({
      success: true,
      data: study,
      message: 'Study paused successfully'
    });
  })
);

// Delete study
router.delete(
  '/:id',
  serviceAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const deleted = await studyService.deleteStudy(req.params.id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Study not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Study deleted successfully'
    });
  })
);

// Get study stats
router.get(
  '/stats/overview',
  serviceAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await studyService.getStudyStats();

    res.json({
      success: true,
      data: stats
    });
  })
);

export default router;