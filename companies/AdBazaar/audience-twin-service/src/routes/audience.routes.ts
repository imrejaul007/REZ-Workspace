import { Router, Response } from 'express';
import { z } from 'zod';
import { audienceTwinService } from '../services';
import {
  authenticate,
  AuthenticatedRequest,
  asyncHandler,
  ApiResponse,
  CreateAudienceTwinRequestSchema,
  PredictBehaviorRequestSchema,
  audienceTwinCreated,
  audienceTwinSize,
  predictionRequests,
  qualityScoreGauge,
} from '../middleware';
import { AudienceTwin, PredictionResult, SegmentAssignment } from '../types';

const router = Router();

// Validation schemas
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().optional(),
});

// POST /api/audience/create - Create audience twin from criteria
router.post(
  '/create',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validation = CreateAudienceTwinRequestSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: validation.error.errors,
      });
      return;
    }

    const twin = await audienceTwinService.createAudienceTwin(
      validation.data,
      req.user!.userId
    );

    // Update metrics
    audienceTwinCreated.inc({ category: twin.category });
    audienceTwinSize.set({ category: twin.category }, twin.size);
    qualityScoreGauge.set({ category: twin.category }, twin.qualityScore);

    res.status(201).json({
      success: true,
      data: twin,
      message: 'Audience twin created successfully',
    } as ApiResponse<AudienceTwin>);
  })
);

// GET /api/audience - List all audience twins
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validation = paginationSchema.safeParse(req.query);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: validation.error.errors,
      });
      return;
    }

    const { page, limit, category } = validation.data;
    const result = await audienceTwinService.listAudienceTwins(
      req.user!.userId,
      { page, limit, category }
    );

    res.json({
      success: true,
      data: {
        items: result.twins,
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  })
);

// GET /api/audience/:id - Get audience twin by ID
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const twin = await audienceTwinService.getAudienceTwin(id, req.user!.userId);

    if (!twin) {
      res.status(404).json({
        success: false,
        error: 'Audience twin not found',
      });
      return;
    }

    res.json({
      success: true,
      data: twin,
    } as ApiResponse<AudienceTwin>);
  })
);

// POST /api/audience/:id/predict - Predict behavior
router.post(
  '/:id/predict',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const validation = PredictBehaviorRequestSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: validation.error.errors,
      });
      return;
    }

    const twin = await audienceTwinService.getAudienceTwinById(id);

    if (!twin) {
      res.status(404).json({
        success: false,
        error: 'Audience twin not found',
      });
      return;
    }

    const prediction = await audienceTwinService.predictBehavior(id, validation.data);

    // Update metrics
    predictionRequests.inc({ action: validation.data.action });

    res.json({
      success: true,
      data: prediction,
    } as ApiResponse<PredictionResult>);
  })
);

// GET /api/audience/:id/segments - Get segment assignments
router.get(
  '/:id/segments',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const twin = await audienceTwinService.getAudienceTwinById(id);

    if (!twin) {
      res.status(404).json({
        success: false,
        error: 'Audience twin not found',
      });
      return;
    }

    const segments = await audienceTwinService.getSegments(id);

    res.json({
      success: true,
      data: segments,
    } as ApiResponse<SegmentAssignment[]>);
  })
);

// POST /api/audience/:id/refresh - Refresh twin with latest data
router.post(
  '/:id/refresh',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const twin = await audienceTwinService.getAudienceTwin(id, req.user!.userId);

    if (!twin) {
      res.status(404).json({
        success: false,
        error: 'Audience twin not found',
      });
      return;
    }

    const refreshedTwin = await audienceTwinService.refreshAudienceTwin(
      id,
      req.user!.userId
    );

    // Update metrics
    audienceTwinSize.set({ category: refreshedTwin.category }, refreshedTwin.size);
    qualityScoreGauge.set({ category: refreshedTwin.category }, refreshedTwin.qualityScore);

    res.json({
      success: true,
      data: refreshedTwin,
      message: 'Audience twin refreshed successfully',
    } as ApiResponse<AudienceTwin>);
  })
);

// DELETE /api/audience/:id - Delete audience twin
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const deleted = await audienceTwinService.deleteAudienceTwin(id, req.user!.userId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Audience twin not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Audience twin deleted successfully',
    });
  })
);

export default router;