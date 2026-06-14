import { Router, Request, Response } from 'express';
import appointmentService, { CreateAppointmentData, UpdateAppointmentData } from '../services/appointmentService';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import { createAppointmentSchema, updateAppointmentSchema, appointmentCalendarSchema } from '../middleware/validation';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/appointments
 * List all appointments with pagination
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20 } = req.query as any;
    const { merchantId, customerId, vehicleId, status } = req.query as any;

    const result = await appointmentService.getByMerchant(merchantId || req.user?.merchantId, {
      merchantId,
      customerId,
      vehicleId,
      status,
      page: Number(page),
      limit: Number(limit),
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  })
);

/**
 * GET /api/v1/appointments/:appointmentId
 * Get appointment by ID
 */
router.get(
  '/:appointmentId',
  asyncHandler(async (req: Request, res: Response) => {
    const { appointmentId } = req.params;
    const appointment = await appointmentService.getById(appointmentId);

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
  })
);

/**
 * GET /api/v1/appointments/calendar
 * Get calendar events for date range
 */
router.get(
  '/calendar',
  validate(appointmentCalendarSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { merchantId, startDate, endDate } = req.query as any;

    const events = await appointmentService.getCalendarEvents(
      merchantId,
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      success: true,
      data: events,
      count: events.length,
    });
  })
);

/**
 * GET /api/v1/appointments/merchant/:merchantId
 * Get appointments for merchant
 */
router.get(
  '/merchant/:merchantId',
  asyncHandler(async (req: Request, res: Response) => {
    const { merchantId } = req.params;
    const { status, page = 1, limit = 20 } = req.query as any;

    const result = await appointmentService.getByMerchant(merchantId, {
      status,
      page: Number(page),
      limit: Number(limit),
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  })
);

/**
 * GET /api/v1/appointments/today
 * Get today's appointments
 */
router.get(
  '/today',
  asyncHandler(async (req: Request, res: Response) => {
    const merchantId = req.query.merchantId as string || req.user?.merchantId;

    if (!merchantId) {
      res.status(400).json({
        success: false,
        error: 'Merchant ID required',
      });
      return;
    }

    const appointments = await appointmentService.getTodayAppointments(merchantId);

    res.json({
      success: true,
      data: appointments,
      count: appointments.length,
    });
  })
);

/**
 * GET /api/v1/appointments/upcoming
 * Get upcoming appointments (next 24 hours)
 */
router.get(
  '/upcoming',
  asyncHandler(async (req: Request, res: Response) => {
    const merchantId = req.query.merchantId as string || req.user?.merchantId;

    if (!merchantId) {
      res.status(400).json({
        success: false,
        error: 'Merchant ID required',
      });
      return;
    }

    const appointments = await appointmentService.getUpcomingAppointments(merchantId);

    res.json({
      success: true,
      data: appointments,
      count: appointments.length,
    });
  })
);

/**
 * GET /api/v1/appointments/stats/:merchantId
 * Get appointment statistics
 */
router.get(
  '/stats/:merchantId',
  asyncHandler(async (req: Request, res: Response) => {
    const { merchantId } = req.params;
    const { startDate, endDate } = req.query as any;

    const stats = await appointmentService.getStatistics(
      merchantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * GET /api/v1/appointments/vehicle/:vehicleId
 * Get appointments for vehicle
 */
router.get(
  '/vehicle/:vehicleId',
  asyncHandler(async (req: Request, res: Response) => {
    const { vehicleId } = req.params;
    const appointments = await appointmentService.getByVehicle(vehicleId);

    res.json({
      success: true,
      data: appointments,
      count: appointments.length,
    });
  })
);

/**
 * POST /api/v1/appointments
 * Schedule new appointment
 */
router.post(
  '/',
  validate(createAppointmentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const appointment = await appointmentService.schedule(req.body as CreateAppointmentData);

      res.status(201).json({
        success: true,
        data: appointment,
        message: 'Appointment scheduled successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to schedule appointment';
      res.status(400).json({
        success: false,
        error: message,
      });
    }
  })
);

/**
 * PUT /api/v1/appointments/:appointmentId
 * Update appointment
 */
router.put(
  '/:appointmentId',
  validate(updateAppointmentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { appointmentId } = req.params;
      const appointment = await appointmentService.update(appointmentId, req.body as UpdateAppointmentData);

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
        message: 'Appointment updated successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update appointment';
      res.status(400).json({
        success: false,
        error: message,
      });
    }
  })
);

/**
 * PATCH /api/v1/appointments/:appointmentId/status
 * Update appointment status
 */
router.patch(
  '/:appointmentId/status',
  asyncHandler(async (req: Request, res: Response) => {
    const { appointmentId } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({
        success: false,
        error: 'Status is required',
      });
      return;
    }

    const appointment = await appointmentService.updateStatus(appointmentId, status);

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
      message: `Appointment status updated to ${status}`,
    });
  })
);

/**
 * DELETE /api/v1/appointments/:appointmentId
 * Cancel appointment
 */
router.delete(
  '/:appointmentId',
  asyncHandler(async (req: Request, res: Response) => {
    const { appointmentId } = req.params;
    const appointment = await appointmentService.cancel(appointmentId);

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
      message: 'Appointment cancelled',
    });
  })
);

export default router;