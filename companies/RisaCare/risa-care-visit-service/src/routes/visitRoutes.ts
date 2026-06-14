import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { visitService, CreateVisitDto, AttachRecordingDto } from '../services/visitService';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const createVisitSchema = z.object({
  profileId: z.string().uuid(),
  date: z.string().datetime().or(z.date()),
  type: z.enum(['in-person', 'telehealth', 'home-visit', 'emergency']),
  provider: z.object({
    id: z.string(),
    name: z.string().min(1),
    specialty: z.string().min(1),
    facility: z.string().optional()
  }),
  chiefComplaint: z.string().min(1),
  diagnoses: z.array(z.object({
    code: z.string(),
    description: z.string(),
    isPrimary: z.boolean().optional()
  })).optional(),
  medications: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string(),
    instructions: z.string().optional()
  })).optional(),
  instructions: z.array(z.string()).optional(),
  followUps: z.array(z.object({
    scheduledDate: z.string().datetime().or(z.date()),
    reason: z.string(),
    provider: z.string().optional()
  })).optional(),
  vitals: z.object({
    bloodPressure: z.object({
      systolic: z.number(),
      diastolic: z.number()
    }).optional(),
    heartRate: z.number().optional(),
    temperature: z.number().optional(),
    weight: z.number().optional(),
    height: z.number().optional(),
    oxygenSaturation: z.number().optional()
  }).optional(),
  notes: z.string().optional()
});

const attachRecordingSchema = z.object({
  url: z.string().url(),
  duration: z.number().positive(),
  type: z.enum(['audio', 'video']),
  recordedAt: z.string().datetime().or(z.date()),
  transcription: z.string().optional()
});

const getVisitsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
  status: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show']).optional()
});

// Error handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Validation middleware
const validate = (schema: z.ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors
        });
      } else {
        next(error);
      }
    }
  };

/**
 * POST /visits
 * Create a new visit
 */
router.post(
  '/',
  validate(createVisitSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const visitData: CreateVisitDto = {
      ...req.body,
      date: new Date(req.body.date)
    };

    if (req.body.followUps) {
      visitData.followUps = req.body.followUps.map((fu: { scheduledDate: string | Date }) => ({
        ...fu,
        scheduledDate: new Date(fu.scheduledDate)
      }));
    }

    const visit = await visitService.createVisit(visitData);

    logger.info('Visit created via API', { visitId: visit.id, profileId: visit.profileId });

    res.status(201).json({
      success: true,
      data: visit
    });
  })
);

/**
 * GET /visits/:id
 * Get visit by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const visit = await visitService.getVisitById(id);

    if (!visit) {
      res.status(404).json({
        success: false,
        error: 'Visit not found'
      });
      return;
    }

    res.json({
      success: true,
      data: visit
    });
  })
);

/**
 * GET /visits/profile/:profileId
 * List visits for a profile
 */
router.get(
  '/profile/:profileId',
  asyncHandler(async (req: Request, res: Response) => {
    const { profileId } = req.params;
    const { limit, offset, status } = req.query;

    const result = await visitService.getVisitsByProfile(profileId, {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      status: status as string | undefined
    });

    res.json({
      success: true,
      data: result.visits,
      pagination: {
        total: result.total,
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0
      }
    });
  })
);

/**
 * POST /visits/:id/recording
 * Attach recording to visit
 */
router.post(
  '/:id/recording',
  validate(attachRecordingSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const recordingData: AttachRecordingDto = {
      ...req.body,
      recordedAt: new Date(req.body.recordedAt)
    };

    const visit = await visitService.attachRecording(id, recordingData);

    if (!visit) {
      res.status(404).json({
        success: false,
        error: 'Visit not found'
      });
      return;
    }

    logger.info('Recording attached via API', { visitId: id });

    res.json({
      success: true,
      data: visit
    });
  })
);

/**
 * POST /visits/:id/summary
 * Generate AI summary for visit
 */
router.post(
  '/:id/summary',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Check if visit exists
    const visit = await visitService.getVisitById(id);
    if (!visit) {
      res.status(404).json({
        success: false,
        error: 'Visit not found'
      });
      return;
    }

    const summary = await visitService.generateSummary(id);

    if (!summary) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate summary'
      });
      return;
    }

    logger.info('Summary generated via API', { visitId: id });

    res.json({
      success: true,
      data: summary
    });
  })
);

/**
 * GET /visits/:id/preparation
 * Get appointment preparation data
 */
router.get(
  '/:id/preparation',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const preparation = await visitService.prepareVisit(id);

    if (!preparation) {
      res.status(404).json({
        success: false,
        error: 'Visit not found'
      });
      return;
    }

    res.json({
      success: true,
      data: preparation
    });
  })
);

/**
 * PATCH /visits/:id
 * Update visit
 */
router.patch(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const visit = await visitService.updateVisit(id, req.body);

    if (!visit) {
      res.status(404).json({
        success: false,
        error: 'Visit not found'
      });
      return;
    }

    res.json({
      success: true,
      data: visit
    });
  })
);

/**
 * DELETE /visits/:id
 * Cancel visit
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    const visit = await visitService.cancelVisit(id, reason);

    if (!visit) {
      res.status(404).json({
        success: false,
        error: 'Visit not found'
      });
      return;
    }

    logger.info('Visit cancelled via API', { visitId: id, reason });

    res.json({
      success: true,
      data: visit
    });
  })
);

export default router;
