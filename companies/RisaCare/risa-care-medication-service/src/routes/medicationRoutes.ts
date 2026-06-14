import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { medicationService, CreateMedicationDto, ScheduleRemindersDto, RefillDto } from '../services/medicationService';
import { adherenceService, RecordDoseDto } from '../services/adherenceService';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const createMedicationSchema = z.object({
  profileId: z.string().uuid(),
  name: z.string().min(1),
  genericName: z.string().optional(),
  brandName: z.string().optional(),
  ndc: z.string().optional(),
  form: z.enum(['tablet', 'capsule', 'liquid', 'injection', 'topical', 'inhaler', 'patch', 'drops', 'other']),
  strength: z.string().min(1),
  color: z.string().optional(),
  shape: z.string().optional(),
  manufacturer: z.string().optional(),
  prescribedBy: z.string().min(1),
  visitId: z.string().optional(),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()).optional(),
  schedule: z.object({
    times: z.array(z.string().regex(/^\d{2}:\d{2}$/)),
    frequency: z.enum(['daily', 'twice-daily', 'three-times-daily', 'weekly', 'as-needed', 'custom']),
    withFood: z.enum(['before-meal', 'with-meal', 'after-meal', 'empty-stomach', 'any']),
    remindersEnabled: z.boolean().optional(),
    customDays: z.array(z.number()).optional()
  }),
  dosage: z.string().min(1),
  instructions: z.string().optional(),
  purpose: z.string().optional(),
  refillTracking: z.object({
    currentQuantity: z.number().min(0),
    dosesPerIntake: z.number().min(1).optional(),
    totalRefills: z.number().min(0).optional(),
    pharmacy: z.object({
      name: z.string(),
      phone: z.string(),
      address: z.string().optional()
    }).optional(),
    autoRefillEnabled: z.boolean().optional()
  }).optional(),
  notes: z.string().optional()
});

const recordDoseSchema = z.object({
  medicationId: z.string(),
  profileId: z.string().uuid(),
  scheduledTime: z.string().datetime().or(z.date()),
  status: z.enum(['taken', 'missed', 'skipped', 'delayed']),
  takenTime: z.string().datetime().or(z.date()).optional(),
  quantity: z.number().min(1).optional(),
  method: z.enum(['manual', 'auto', 'partial']).optional(),
  notes: z.string().optional(),
  sideEffects: z.string().optional(),
  skipReason: z.string().optional(),
  delayMinutes: z.number().min(0).optional()
});

const scheduleRemindersSchema = z.object({
  reminderTimes: z.array(z.string().regex(/^\d{2}:\d{2}$/)),
  caregiverIds: z.array(z.string().uuid()).optional(),
  reminderMethods: z.array(z.enum(['push', 'sms', 'email']))
});

const refillSchema = z.object({
  quantity: z.number().min(1),
  refillDate: z.string().datetime().or(z.date()).optional(),
  pharmacy: z.object({
    name: z.string(),
    phone: z.string(),
    address: z.string().optional()
  }).optional()
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
 * POST /medications
 * Create a new medication
 */
router.post(
  '/',
  validate(createMedicationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const medicationData: CreateMedicationDto = {
      ...req.body,
      startDate: new Date(req.body.startDate)
    };

    if (req.body.endDate) {
      medicationData.endDate = new Date(req.body.endDate);
    }

    const medication = await medicationService.createMedication(medicationData);

    logger.info('Medication created via API', { medicationId: medication.id });

    res.status(201).json({
      success: true,
      data: medication
    });
  })
);

/**
 * GET /medications/:id
 * Get medication by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const medication = await medicationService.getMedicationById(id);

    if (!medication) {
      res.status(404).json({
        success: false,
        error: 'Medication not found'
      });
      return;
    }

    res.json({
      success: true,
      data: medication
    });
  })
);

/**
 * GET /medications/profile/:profileId
 * List medications for a profile
 */
router.get(
  '/profile/:profileId',
  asyncHandler(async (req: Request, res: Response) => {
    const { profileId } = req.params;
    const { status, limit, offset } = req.query;

    const result = await medicationService.getMedicationsByProfile(profileId, {
      status: status as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.json({
      success: true,
      data: result.medications,
      pagination: {
        total: result.total,
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0
      }
    });
  })
);

/**
 * PATCH /medications/:id
 * Update medication
 */
router.patch(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const medication = await medicationService.updateMedication(id, req.body);

    if (!medication) {
      res.status(404).json({
        success: false,
        error: 'Medication not found'
      });
      return;
    }

    res.json({
      success: true,
      data: medication
    });
  })
);

/**
 * POST /medications/:id/pause
 * Pause medication
 */
router.post(
  '/:id/pause',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    const medication = await medicationService.pauseMedication(id, reason);

    if (!medication) {
      res.status(404).json({
        success: false,
        error: 'Medication not found'
      });
      return;
    }

    res.json({
      success: true,
      data: medication
    });
  })
);

/**
 * POST /medications/:id/discontinue
 * Discontinue medication
 */
router.post(
  '/:id/discontinue',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    const medication = await medicationService.discontinueMedication(id, reason);

    if (!medication) {
      res.status(404).json({
        success: false,
        error: 'Medication not found'
      });
      return;
    }

    res.json({
      success: true,
      data: medication
    });
  })
);

/**
 * POST /medications/:id/reminders
 * Schedule reminders for medication
 */
router.post(
  '/:id/reminders',
  validate(scheduleRemindersSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const reminderData: ScheduleRemindersDto = {
      medicationId: id,
      ...req.body
    };

    const success = await medicationService.scheduleReminders(reminderData);

    res.json({
      success,
      data: { remindersScheduled: success }
    });
  })
);

/**
 * POST /medications/:id/refill
 * Record a refill
 */
router.post(
  '/:id/refill',
  validate(refillSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const refillData: RefillDto = {
      medicationId: id,
      ...req.body
    };

    if (req.body.refillDate) {
      refillData.refillDate = new Date(req.body.refillDate);
    }

    const medication = await medicationService.recordRefill(refillData);

    if (!medication) {
      res.status(400).json({
        success: false,
        error: 'Failed to record refill'
      });
      return;
    }

    res.json({
      success: true,
      data: medication
    });
  })
);

/**
 * GET /medications/:id/refill-status
 * Get refill status
 */
router.get(
  '/:id/refill-status',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const status = await medicationService.getRefillStatus(id);

    if (!status) {
      res.status(404).json({
        success: false,
        error: 'Medication not found'
      });
      return;
    }

    res.json({
      success: true,
      data: status
    });
  })
);

/**
 * POST /medications/dose
 * Record a dose
 */
router.post(
  '/dose',
  validate(recordDoseSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const doseData: RecordDoseDto = {
      ...req.body,
      scheduledTime: new Date(req.body.scheduledTime)
    };

    if (req.body.takenTime) {
      doseData.takenTime = new Date(req.body.takenTime);
    }

    const dose = await adherenceService.recordDose(doseData);

    logger.info('Dose recorded via API', { doseId: dose.id, status: dose.status });

    res.status(201).json({
      success: true,
      data: dose
    });
  })
);

/**
 * GET /medications/:id/adherence
 * Get adherence stats for medication
 */
router.get(
  '/:id/adherence',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const stats = await adherenceService.getAdherenceStats(id);

    if (!stats) {
      res.status(404).json({
        success: false,
        error: 'Medication not found'
      });
      return;
    }

    res.json({
      success: true,
      data: stats
    });
  })
);

/**
 * GET /medications/profile/:profileId/adherence
 * Get adherence report for profile
 */
router.get(
  '/profile/:profileId/adherence',
  asyncHandler(async (req: Request, res: Response) => {
    const { profileId } = req.params;
    const { medicationId, startDate, endDate } = req.query;

    const report = await adherenceService.getAdherenceReport(profileId, {
      medicationId: medicationId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });

    res.json({
      success: true,
      data: report
    });
  })
);

/**
 * GET /medications/profile/:profileId/upcoming
 * Get upcoming doses
 */
router.get(
  '/profile/:profileId/upcoming',
  asyncHandler(async (req: Request, res: Response) => {
    const { profileId } = req.params;
    const { hours, limit } = req.query;

    const doses = await adherenceService.getUpcomingDoses(profileId, {
      hours: hours ? parseInt(hours as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({
      success: true,
      data: doses
    });
  })
);

export default router;
