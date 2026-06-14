import { Router, Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import {
  CreateProfileDTO,
  UpdateProfileDTO,
  ReportFallDTO,
  SubmitCheckInDTO,
  SetMedicationReminderDTO,
  TriggerEmergencyDTO,
  ElderlyProfileSchema,
  EmergencyContactSchema,
} from '../models/elderlyCare';
import { elderlyProfileService } from '../services/elderlyProfileService';
import { fallDetectionService } from '../services/fallDetectionService';
import { dailyCheckInService } from '../services/dailyCheckInService';
import { medicationReminderService } from '../services/medicationReminderService';
import { emergencyService } from '../services/emergencyService';
import logger from '../utils/logger';

const router = Router();

// Validation helper
const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    next(error);
  }
};

// Error handler wrapper
const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ============ PROFILE ROUTES ============

/**
 * POST /profile - Create elderly profile
 */
router.post(
  '/profile',
  validate(CreateProfileDTO),
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('POST /profile - Creating elderly profile');
    const profile = await elderlyProfileService.createProfile(req.body);
    res.status(201).json({
      success: true,
      data: profile,
      message: 'Profile created successfully',
    });
  })
);

/**
 * GET /profile/:userId - Get profile
 */
router.get(
  '/profile/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    logger.info('GET /profile/:userId - Fetching profile', { userId });

    const profile = await elderlyProfileService.getProfile(userId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found',
      });
    }

    res.json({
      success: true,
      data: profile,
    });
  })
);

/**
 * PUT /profile/:userId - Update profile
 */
router.put(
  '/profile/:userId',
  validate(UpdateProfileDTO),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    logger.info('PUT /profile/:userId - Updating profile', { userId });

    const profile = await elderlyProfileService.updateProfile(userId, req.body);
    res.json({
      success: true,
      data: profile,
      message: 'Profile updated successfully',
    });
  })
);

/**
 * POST /profile/:userId/emergency-contacts - Add emergency contact
 */
router.post(
  '/profile/:userId/emergency-contacts',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    logger.info('POST /profile/:userId/emergency-contacts', { userId });

    // Validate contact
    const contactData = EmergencyContactSchema.omit({ id: true }).parse(req.body);
    const contact = await elderlyProfileService.addEmergencyContact(userId, contactData);

    res.status(201).json({
      success: true,
      data: contact,
      message: 'Emergency contact added successfully',
    });
  })
);

/**
 * DELETE /profile/:userId/emergency-contacts/:contactId - Remove emergency contact
 */
router.delete(
  '/profile/:userId/emergency-contacts/:contactId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, contactId } = req.params;
    logger.info('DELETE /profile/:userId/emergency-contacts/:contactId', { userId, contactId });

    const removed = await elderlyProfileService.removeEmergencyContact(userId, contactId);
    if (!removed) {
      return res.status(404).json({
        success: false,
        error: 'Emergency contact not found',
      });
    }

    res.json({
      success: true,
      message: 'Emergency contact removed successfully',
    });
  })
);

// ============ FALL ROUTES ============

/**
 * POST /falls - Report fall
 */
router.post(
  '/falls',
  validate(ReportFallDTO),
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('POST /falls - Reporting fall');
    const incident = await fallDetectionService.reportFall(req.body);

    // Auto-trigger emergency for severe falls
    if (incident.severity === 'severe' || incident.severity === 'injury') {
      await emergencyService.triggerEmergency(incident.patientId, {
        type: 'fall',
        severity: incident.severity === 'injury' ? 'critical' : 'high',
        location: incident.location,
        description: `Fall reported: ${incident.cause || 'No cause specified'}`,
      });
    }

    res.status(201).json({
      success: true,
      data: incident,
      message: 'Fall reported successfully',
    });
  })
);

/**
 * GET /falls/:patientId - Get fall history
 */
router.get(
  '/falls/:patientId',
  asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    logger.info('GET /falls/:patientId - Fetching fall history', { patientId });

    const incidents = await fallDetectionService.getFallHistory(patientId, limit);
    const statistics = await fallDetectionService.getFallStatistics(patientId);

    res.json({
      success: true,
      data: {
        incidents,
        statistics,
      },
    });
  })
);

/**
 * GET /falls/:patientId/risk - Get risk assessment
 */
router.get(
  '/falls/:patientId/risk',
  asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    logger.info('GET /falls/:patientId/risk - Assessing fall risk', { patientId });

    const assessment = await fallDetectionService.assessFallRisk(patientId);
    const currentScore = await fallDetectionService.getRiskScore(patientId);
    const history = await fallDetectionService.getRiskHistory(patientId);

    res.json({
      success: true,
      data: {
        currentAssessment: assessment,
        currentScore,
        history,
      },
    });
  })
);

// ============ CHECK-IN ROUTES ============

/**
 * POST /checkin - Submit daily check-in
 */
router.post(
  '/checkin',
  validate(SubmitCheckInDTO),
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('POST /checkin - Submitting daily check-in');
    const checkIn = await dailyCheckInService.submitCheckIn(req.body);

    // Check for concerning vitals
    if (checkIn.vitals) {
      const concerns: string[] = [];

      if (checkIn.vitals.hr && (checkIn.vitals.hr < 50 || checkIn.vitals.hr > 120)) {
        concerns.push('Abnormal heart rate detected');
      }
      if (checkIn.vitals.spo2 && checkIn.vitals.spo2 < 90) {
        concerns.push('Low oxygen saturation detected');
      }
      if (checkIn.vitals.temp && (checkIn.vitals.temp < 97 || checkIn.vitals.temp > 101)) {
        concerns.push('Fever or hypothermia detected');
      }

      if (concerns.length > 0) {
        logger.warn('Concerning vitals detected', { patientId: checkIn.patientId, concerns });
        // Could trigger emergency here based on severity
      }
    }

    res.status(201).json({
      success: true,
      data: checkIn,
      message: 'Check-in submitted successfully',
    });
  })
);

/**
 * POST /checkin/schedule - Schedule daily check-in
 */
router.post(
  '/checkin/schedule',
  asyncHandler(async (req: Request, res: Response) => {
    const { patientId, time } = req.body;
    logger.info('POST /checkin/schedule - Scheduling check-in', { patientId, time });

    if (!patientId) {
      return res.status(400).json({
        success: false,
        error: 'patientId is required',
      });
    }

    const schedule = await dailyCheckInService.scheduleCheckIn(patientId, time);
    res.json({
      success: true,
      data: schedule,
      message: 'Check-in schedule set successfully',
    });
  })
);

/**
 * GET /checkin/:patientId - Get check-in history
 */
router.get(
  '/checkin/:patientId',
  asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const days = req.query.days ? parseInt(req.query.days as string, 10) : undefined;

    logger.info('GET /checkin/:patientId - Fetching check-in history', { patientId });

    const startDate = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : undefined;
    const history = await dailyCheckInService.getCheckInHistory(patientId, { limit, startDate });
    const compliance = await dailyCheckInService.getComplianceRate(patientId, days || 30);
    const trends = await dailyCheckInService.getHealthTrends(patientId, days || 30);

    res.json({
      success: true,
      data: {
        history,
        compliance,
        trends,
      },
    });
  })
);

/**
 * GET /checkin/:patientId/missed - Get missed check-ins
 */
router.get(
  '/checkin/:patientId/missed',
  asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;
    logger.info('GET /checkin/:patientId/missed - Getting missed check-ins', { patientId });

    const missed = await dailyCheckInService.getMissedCheckIns(patientId, days);

    res.json({
      success: true,
      data: missed,
    });
  })
);

// ============ MEDICATION ROUTES ============

/**
 * GET /medications/:patientId - Get medication reminders
 */
router.get(
  '/medications/:patientId',
  asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const today = req.query.today === 'true';

    logger.info('GET /medications/:patientId - Fetching medication reminders', { patientId });

    let reminders;
    if (today) {
      reminders = await medicationReminderService.getTodayReminders(patientId);
    } else {
      reminders = await medicationReminderService.getAllReminders(patientId, { limit: 50 });
    }

    const adherence = await medicationReminderService.getAdherence(patientId);
    const overdue = await medicationReminderService.getOverdueReminders(patientId);

    res.json({
      success: true,
      data: {
        reminders,
        adherence,
        overdue,
      },
    });
  })
);

/**
 * POST /medications - Set medication reminder
 */
router.post(
  '/medications',
  validate(SetMedicationReminderDTO),
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('POST /medications - Setting medication reminder');
    const reminder = await medicationReminderService.setReminder(req.body.patientId, req.body);

    res.status(201).json({
      success: true,
      data: reminder,
      message: 'Medication reminder set successfully',
    });
  })
);

/**
 * PUT /medications/:reminderId/taken - Mark medication taken
 */
router.put(
  '/medications/:reminderId/taken',
  asyncHandler(async (req: Request, res: Response) => {
    const { reminderId } = req.params;
    const { patientId } = req.body;

    logger.info('PUT /medications/:reminderId/taken - Marking medication taken', { reminderId });

    if (!patientId) {
      return res.status(400).json({
        success: false,
        error: 'patientId is required',
      });
    }

    const reminder = await medicationReminderService.markTaken(reminderId, patientId);

    res.json({
      success: true,
      data: reminder,
      message: 'Medication marked as taken',
    });
  })
);

/**
 * PUT /medications/:reminderId/skipped - Mark medication skipped
 */
router.put(
  '/medications/:reminderId/skipped',
  asyncHandler(async (req: Request, res: Response) => {
    const { reminderId } = req.params;
    const { patientId, reason } = req.body;

    logger.info('PUT /medications/:reminderId/skipped - Marking medication skipped', { reminderId });

    if (!patientId) {
      return res.status(400).json({
        success: false,
        error: 'patientId is required',
      });
    }

    const reminder = await medicationReminderService.markSkipped(reminderId, patientId, reason);

    res.json({
      success: true,
      data: reminder,
      message: 'Medication marked as skipped',
    });
  })
);

/**
 * GET /medications/:patientId/adherence - Get medication adherence
 */
router.get(
  '/medications/:patientId/adherence',
  asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;

    logger.info('GET /medications/:patientId/adherence - Fetching adherence', { patientId });

    const adherence = await medicationReminderService.getAdherence(patientId, days);

    res.json({
      success: true,
      data: adherence,
    });
  })
);

// ============ EMERGENCY ROUTES ============

/**
 * GET /emergencies/:patientId - Get active emergencies
 */
router.get(
  '/emergencies/:patientId',
  asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const all = req.query.all === 'true';

    logger.info('GET /emergencies/:patientId - Fetching emergencies', { patientId });

    let alerts;
    if (all) {
      alerts = await emergencyService.getAllAlerts(patientId, { limit: 50 });
    } else {
      alerts = await emergencyService.getActiveAlerts(patientId);
    }

    const statistics = await emergencyService.getAlertStatistics(patientId);

    res.json({
      success: true,
      data: {
        alerts,
        statistics,
      },
    });
  })
);

/**
 * POST /emergencies/:patientId/trigger - Trigger emergency
 */
router.post(
  '/emergencies/:patientId/trigger',
  validate(TriggerEmergencyDTO),
  asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    logger.warn('POST /emergencies/:patientId/trigger - EMERGENCY TRIGGERED', { patientId });

    const alert = await emergencyService.triggerEmergency(patientId, req.body);

    res.status(201).json({
      success: true,
      data: alert,
      message: 'Emergency triggered - contacts are being notified',
    });
  })
);

/**
 * PUT /emergencies/:alertId/resolve - Resolve emergency
 */
router.put(
  '/emergencies/:alertId/resolve',
  asyncHandler(async (req: Request, res: Response) => {
    const { alertId } = req.params;
    const { patientId, notes } = req.body;

    logger.info('PUT /emergencies/:alertId/resolve - Resolving emergency', { alertId });

    if (!patientId) {
      return res.status(400).json({
        success: false,
        error: 'patientId is required',
      });
    }

    const alert = await emergencyService.resolveAlert(alertId, patientId, notes);

    res.json({
      success: true,
      data: alert,
      message: 'Emergency resolved',
    });
  })
);

/**
 * PUT /emergencies/:alertId/respond - Mark as responded
 */
router.put(
  '/emergencies/:alertId/respond',
  asyncHandler(async (req: Request, res: Response) => {
    const { alertId } = req.params;
    const { patientId, responderId } = req.body;

    logger.info('PUT /emergencies/:alertId/respond - Marking as responded', { alertId });

    if (!patientId || !responderId) {
      return res.status(400).json({
        success: false,
        error: 'patientId and responderId are required',
      });
    }

    const alert = await emergencyService.markResponded(alertId, patientId, responderId);

    res.json({
      success: true,
      data: alert,
      message: 'Alert marked as responded',
    });
  })
);

/**
 * GET /emergencies/critical - Get all critical alerts (monitoring)
 */
router.get(
  '/emergencies/critical',
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('GET /emergencies/critical - Fetching all critical alerts');

    const alerts = await emergencyService.getAllCriticalAlerts();

    res.json({
      success: true,
      data: alerts,
    });
  })
);

// ============ HEALTH TRENDS ROUTES ============

/**
 * GET /trends/:patientId - Get health trends
 */
router.get(
  '/trends/:patientId',
  asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;

    logger.info('GET /trends/:patientId - Fetching health trends', { patientId });

    const trends = await dailyCheckInService.getHealthTrends(patientId, days);
    const fallRisk = await fallDetectionService.getRiskScore(patientId);
    const medicationAdherence = await medicationReminderService.getAdherence(patientId, days);

    res.json({
      success: true,
      data: {
        healthTrends: trends,
        fallRisk,
        medicationAdherence,
      },
    });
  })
);

// Error handling middleware
router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Route error', { error: err.message, stack: err.stack, path: req.path });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

export default router;
