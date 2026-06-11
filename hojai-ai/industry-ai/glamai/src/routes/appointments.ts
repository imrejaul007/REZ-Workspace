/**
 * GLAMAI - Appointments Routes
 * Salon AI Operating System
 */

import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Appointment, Service, Customer, Stylist, Payment } from '../models';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler, errors } from '../middleware/error';
import { AppointmentSchema, PaginatedResponse } from '../types';
import { logger } from '../middleware/logger';
import appointmentManager from '../services/appointmentManager';

const router = Router();

/**
 * POST /api/appointments
 * Create a new appointment
 */
router.post(
  '/',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const validated = AppointmentSchema.parse(req.body);
    const { customerId, serviceId, stylistId, date, time, notes } = validated;

    // Validate service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      throw errors.notFound('Service');
    }

    // Validate customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw errors.notFound('Customer');
    }

    // Check availability
    const dateTime = new Date(`${date}T${time}:00`);
    const conflicting = await Appointment.findOne({
      stylistId: stylistId || null,
      date: {
        $gte: new Date(dateTime.getTime() - service.duration * 60000),
        $lte: new Date(dateTime.getTime() + service.duration * 60000),
      },
      status: { $in: ['scheduled', 'confirmed'] },
    });

    if (conflicting) {
      throw errors.conflict('Time slot not available');
    }

    const appointment = await Appointment.create({
      customerId: new mongoose.Types.ObjectId(customerId),
      serviceId: new mongoose.Types.ObjectId(serviceId),
      stylistId: stylistId ? new mongoose.Types.ObjectId(stylistId) : undefined,
      date: dateTime,
      time,
      status: 'scheduled',
      notes,
    });

    // Update customer
    customer.visits += 1;
    customer.lastVisit = new Date();
    await customer.save();

    logger.info('Appointment created', { appointmentId: appointment._id });

    res.status(201).json({
      success: true,
      appointment,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/appointments
 * List appointments with filters
 */
router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { date, status, stylistId, page = '1', limit = '50' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const query: any = {};
    if (date) {
      const startDate = new Date(date as string);
      const endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }
    if (status) {
      query.status = status;
    }
    if (stylistId) {
      query.stylistId = new mongoose.Types.ObjectId(stylistId as string);
    }

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate('customerId', 'name phone email')
        .populate('serviceId', 'name category price duration')
        .populate('stylistId', 'name phone')
        .skip(skip)
        .limit(parseInt(limit as string))
        .sort({ date: 1, time: 1 }),
      Appointment.countDocuments(query),
    ]);

    const response: PaginatedResponse<any> = {
      success: true,
      data: appointments,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

/**
 * GET /api/appointments/slots
 * Get available time slots for a date
 */
router.get(
  '/slots',
  asyncHandler(async (req: Request, res: Response) => {
    const { date, serviceId, stylistId } = req.query;

    if (!date || !serviceId) {
      throw errors.validation({ message: 'date and serviceId are required' });
    }

    const slots = await appointmentManager.getAvailableSlots({
      date: date as string,
      serviceId: serviceId as string,
      stylistId: stylistId as string,
    });

    res.json({
      success: true,
      date,
      serviceId,
      stylistId: stylistId || null,
      slots,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/appointments/:id
 * Get appointment by ID
 */
router.get(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const appointment = await Appointment.findById(req.params.id)
      .populate('customerId', 'name phone email')
      .populate('serviceId', 'name category price duration')
      .populate('stylistId', 'name phone');

    if (!appointment) {
      throw errors.notFound('Appointment');
    }

    res.json({
      success: true,
      appointment,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * PATCH /api/appointments/:id
 * Update appointment status
 */
router.patch(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { status, date, time, stylistId, notes } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      throw errors.notFound('Appointment');
    }

    // Update fields
    if (status) appointment.status = status;
    if (date) appointment.date = new Date(`${date}T${time || appointment.time}:00`);
    if (time) appointment.time = time;
    if (stylistId) appointment.stylistId = new mongoose.Types.ObjectId(stylistId);
    if (notes !== undefined) appointment.notes = notes;

    await appointment.save();

    // If completed, create payment record
    if (status === 'completed') {
      const service = await Service.findById(appointment.serviceId);
      if (service) {
        await Payment.create({
          appointmentId: appointment._id,
          customerId: appointment.customerId,
          amount: service.price,
          method: 'cash',
          status: 'completed',
        });

        // Update customer stats
        const customer = await Customer.findById(appointment.customerId);
        if (customer) {
          customer.totalSpent += service.price;

          // Check for loyalty tier upgrade
          if (customer.totalSpent >= 10000 && customer.loyaltyTier === 'gold') {
            customer.loyaltyTier = 'platinum';
          } else if (customer.totalSpent >= 5000 && customer.loyaltyTier === 'silver') {
            customer.loyaltyTier = 'gold';
          } else if (customer.totalSpent >= 2000 && customer.loyaltyTier === 'bronze') {
            customer.loyaltyTier = 'silver';
          }
          await customer.save();
        }
      }
    }

    logger.info('Appointment updated', { appointmentId: appointment._id, status });

    res.json({
      success: true,
      appointment,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/appointments/:id/confirm
 * Confirm an appointment
 */
router.post(
  '/:id/confirm',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const appointment = await appointmentManager.confirmAppointment(req.params.id);

    res.json({
      success: true,
      message: 'Appointment confirmed',
      appointment,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/appointments/:id/start
 * Start an appointment
 */
router.post(
  '/:id/start',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const appointment = await appointmentManager.startAppointment(req.params.id);

    res.json({
      success: true,
      message: 'Appointment started',
      appointment,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/appointments/:id/complete
 * Complete an appointment
 */
router.post(
  '/:id/complete',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const appointment = await appointmentManager.completeAppointment(req.params.id);

    res.json({
      success: true,
      message: 'Appointment completed',
      appointment,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/appointments/:id/cancel
 * Cancel an appointment
 */
router.post(
  '/:id/cancel',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { reason } = req.body;
    await appointmentManager.cancelAppointment({
      appointmentId: req.params.id,
      reason,
    });

    res.json({
      success: true,
      message: 'Appointment cancelled',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/appointments/:id/reschedule
 * Reschedule an appointment
 */
router.post(
  '/:id/reschedule',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { newDate, newTime } = req.body;

    if (!newDate || !newTime) {
      throw errors.validation({ message: 'newDate and newTime are required' });
    }

    const result = await appointmentManager.rescheduleAppointment({
      appointmentId: req.params.id,
      newDate,
      newTime,
    });

    res.json({
      success: true,
      message: `Appointment rescheduled to ${newDate} at ${newTime}`,
      appointment: result.appointment,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/appointments/:id/no-show
 * Mark appointment as no-show
 */
router.post(
  '/:id/no-show',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const appointment = await appointmentManager.markNoShow(req.params.id);

    res.json({
      success: true,
      message: 'Appointment marked as no-show',
      appointment,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;