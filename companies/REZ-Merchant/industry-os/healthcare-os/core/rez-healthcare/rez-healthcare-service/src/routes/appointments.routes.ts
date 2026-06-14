import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AppointmentService, CreateAppointmentInput } from '../services/AppointmentService';
import { logger } from '../config/logger';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const appointmentService = new AppointmentService();

// Apply authentication to all routes - HIPAA requires proper auth for PHI access
router.use(authenticateToken);

// Validation schemas
const createAppointmentSchema = z.object({
  patientId: z.string().min(1),
  providerId: z.string().min(1),
  providerName: z.string().min(1),
  type: z.enum(['in-person', 'telemedicine', 'home-visit']),
  scheduledAt: z.string().datetime(),
  duration: z.number().min(5).max(180).optional(),
  reason: z.object({
    chiefComplaint: z.string().min(1),
    symptoms: z.array(z.string()).optional(),
    duration: z.string().optional(),
    severity: z.enum(['mild', 'moderate', 'severe']).optional(),
  }),
  priority: z.enum(['routine', 'urgent', 'emergency']).optional(),
});

const updateAppointmentSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
  duration: z.number().min(5).max(180).optional(),
  status: z.enum(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show', 'rescheduled']).optional(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  followUpRequired: z.boolean().optional(),
  followUpDate: z.string().datetime().optional(),
});

const cancelAppointmentSchema = z.object({
  reason: z.string().min(1),
  cancelledBy: z.string().min(1),
});

// Create appointment
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createAppointmentSchema.parse(req.body);
    const appointment = await appointmentService.createAppointment({
      ...validatedData,
      scheduledAt: new Date(validatedData.scheduledAt),
    } as CreateAppointmentInput);

    res.status(201).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    } else {
      logger.error('Failed to create appointment', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to create appointment',
      });
    }
  }
});

// Get appointment by ID
router.get('/:appointmentId', async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await appointmentService.getAppointmentById(appointmentId);

    if (!appointment) {
      res.status(404).json({
        success: false,
        error: 'Appointment not found',
      });
      return;
    }

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    logger.error('Failed to get appointment', { error, appointmentId: req.params.appointmentId });
    res.status(500).json({
      success: false,
      error: 'Failed to get appointment',
    });
  }
});

// Get patient appointments
router.get('/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const { status, upcoming, page, limit } = req.query;

    const result = await appointmentService.getPatientAppointments(patientId, {
      status: status as unknown,
      upcoming: upcoming === 'true',
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to get patient appointments', { error, patientId: req.params.patientId });
    res.status(500).json({
      success: false,
      error: 'Failed to get patient appointments',
    });
  }
});

// Get provider appointments for a date
router.get('/provider/:providerId', async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const { date } = req.query;

    const appointments = await appointmentService.getProviderAppointments(
      providerId,
      date ? new Date(date as string) : new Date()
    );

    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    logger.error('Failed to get provider appointments', { error, providerId: req.params.providerId });
    res.status(500).json({
      success: false,
      error: 'Failed to get provider appointments',
    });
  }
});

// Update appointment
router.put('/:appointmentId', async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const validatedData = updateAppointmentSchema.parse(req.body);

    const updateData: unknown = { ...validatedData };
    if (updateData.scheduledAt) {
      updateData.scheduledAt = new Date(updateData.scheduledAt as string);
    }
    if (updateData.followUpDate) {
      updateData.followUpDate = new Date(updateData.followUpDate as string);
    }

    const appointment = await appointmentService.updateAppointment(appointmentId, updateData as unknown);

    if (!appointment) {
      res.status(404).json({
        success: false,
        error: 'Appointment not found',
      });
      return;
    }

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    } else {
      logger.error('Failed to update appointment', { error, appointmentId: req.params.appointmentId });
      res.status(500).json({
        success: false,
        error: 'Failed to update appointment',
      });
    }
  }
});

// Cancel appointment
router.post('/:appointmentId/cancel', async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const validatedData = cancelAppointmentSchema.parse(req.body);

    const appointment = await appointmentService.cancelAppointment(
      appointmentId,
      validatedData.reason,
      validatedData.cancelledBy
    );

    if (!appointment) {
      res.status(404).json({
        success: false,
        error: 'Appointment not found',
      });
      return;
    }

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    } else {
      logger.error('Failed to cancel appointment', { error, appointmentId: req.params.appointmentId });
      res.status(500).json({
        success: false,
        error: 'Failed to cancel appointment',
      });
    }
  }
});

// Reschedule appointment
router.post('/:appointmentId/reschedule', async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const { newScheduledAt, newDuration } = req.body;

    if (!newScheduledAt) {
      res.status(400).json({
        success: false,
        error: 'newScheduledAt is required',
      });
      return;
    }

    const appointment = await appointmentService.rescheduleAppointment(
      appointmentId,
      new Date(newScheduledAt),
      newDuration
    );

    if (!appointment) {
      res.status(404).json({
        success: false,
        error: 'Appointment not found',
      });
      return;
    }

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    logger.error('Failed to reschedule appointment', { error, appointmentId: req.params.appointmentId });
    res.status(500).json({
      success: false,
      error: 'Failed to reschedule appointment',
    });
  }
});

export default router;
