/**
 * Booking Routes - Appointment management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Appointment } from '../models/Appointment';
import { authenticateToken } from '../middleware/auth';
import { bookingService } from '../services/booking.service';

const router = Router();

// Validation schemas
const createBookingSchema = z.object({
  salonId: z.string().min(1),
  customerId: z.string().min(1),
  customerName: z.string().min(1).max(100),
  customerPhone: z.string().min(10).max(15),
  customerEmail: z.string().email().optional(),
  stylistId: z.string().optional(),
  serviceIds: z.array(z.string()).min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().max(500).optional(),
  source: z.enum(['app', 'web', 'phone', 'walkin', 'whatsapp']).default('app'),
});

const updateBookingSchema = z.object({
  stylistId: z.string().optional(),
  serviceIds: z.array(z.string()).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
  notes: z.string().max(500).optional(),
});

// POST /api/bookings - Create new booking
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const validationResult = createBookingSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
      return;
    }

    const bookingData = validationResult.data;

    // Check for conflicts
    const hasConflict = await bookingService.checkConflict(
      bookingData.salonId,
      bookingData.stylistId,
      bookingData.date,
      bookingData.startTime
    );

    if (hasConflict) {
      res.status(409).json({
        success: false,
        error: 'Time slot is not available. Please choose another time.',
      });
      return;
    }

    const booking = await bookingService.createBooking(bookingData);

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully',
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, error: 'Failed to create booking' });
  }
});

// GET /api/bookings - List bookings
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      salonId,
      customerId,
      stylistId,
      status,
      date,
      startDate,
      endDate,
      page = '1',
      limit = '20',
    } = req.query;

    const query: Record<string, unknown> = {};

    if (salonId) query.salonId = salonId;
    if (customerId) query.customerId = customerId;
    if (stylistId) query.stylistId = stylistId;
    if (status) query.status = status;
    if (date) query.date = date;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) (query.date as Record<string, string>).$gte = startDate as string;
      if (endDate) (query.date as Record<string, string>).$lte = endDate as string;
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Appointment.find(query)
        .populate('stylistId', 'name image')
        .skip(skip)
        .limit(limitNum)
        .sort({ date: -1, startTime: 1 }),
      Appointment.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
  }
});

// GET /api/bookings/:appointmentId - Get booking by ID
router.get('/:appointmentId', async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const booking = await Appointment.findOne({ appointmentId })
      .populate('stylistId', 'name image phone');

    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found' });
      return;
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch booking' });
  }
});

// PUT /api/bookings/:appointmentId - Update booking
router.put('/:appointmentId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const validationResult = updateBookingSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
      return;
    }

    const updates = validationResult.data;

    // Check for conflicts if time is being changed
    if (updates.date || updates.startTime || updates.stylistId) {
      const existingBooking = await Appointment.findOne({ appointmentId });
      if (existingBooking) {
        const hasConflict = await bookingService.checkConflict(
          existingBooking.salonId,
          updates.stylistId || existingBooking.stylistId,
          updates.date || existingBooking.date,
          updates.startTime || existingBooking.startTime,
          appointmentId
        );

        if (hasConflict) {
          res.status(409).json({
            success: false,
            error: 'Time slot is not available',
          });
          return;
        }
      }
    }

    const booking = await Appointment.findOneAndUpdate(
      { appointmentId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found' });
      return;
    }

    res.json({
      success: true,
      data: booking,
      message: 'Booking updated successfully',
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ success: false, error: 'Failed to update booking' });
  }
});

// DELETE /api/bookings/:appointmentId - Cancel booking
router.delete('/:appointmentId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const { reason } = req.body;

    const booking = await Appointment.findOneAndUpdate(
      { appointmentId },
      {
        $set: {
          status: 'cancelled',
          cancellationReason: reason || 'Cancelled by user',
          cancelledAt: new Date(),
        },
      },
      { new: true }
    );

    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found' });
      return;
    }

    res.json({
      success: true,
      data: booking,
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel booking' });
  }
});

// GET /api/bookings/customer/:customerId - Get customer bookings
router.get('/customer/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const { status, upcoming } = req.query;

    const query: Record<string, unknown> = { customerId };
    if (status) query.status = status;

    if (upcoming === 'true') {
      query.status = { $in: ['pending', 'confirmed', 'in_progress'] };
      query.date = { $gte: new Date().toISOString().split('T')[0] };
    }

    const bookings = await Appointment.find(query)
      .populate('stylistId', 'name image')
      .sort({ date: -1, startTime: 1 });

    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Error fetching customer bookings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
  }
});

export { router as bookingRoutes };
