/**
 * Booking Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Booking } from '../models/Booking';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

// Create booking
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const bookingSchema = z.object({
      salonId: z.string(),
      serviceId: z.string(),
      stylistId: z.string().optional(),
      date: z.string(),
      startTime: z.string(),
      duration: z.number(),
      price: z.number(),
      customer: z.object({
        name: z.string(),
        phone: z.string(),
        email: z.string().optional(),
      }),
      notes: z.string().optional(),
    });

    const data = bookingSchema.parse(req.body);
    const bookingId = `BKS${Date.now()}${crypto.randomUUID().split('-')[0]}`;

    // Calculate end time
    const [hours, minutes] = data.startTime.split(':').map(Number);
    const endDate = new Date(`2000-01-01T${data.startTime}:00`);
    endDate.setMinutes(endDate.getMinutes() + data.duration);
    const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

    const booking = new Booking({
      bookingId,
      ...data,
      customerId: req.user?.sub || 'anonymous',
      endTime,
      finalPrice: data.price,
      status: 'confirmed',
    });

    await booking.save();

    res.status(201).json({
      success: true,
      data: {
        bookingId,
        status: 'confirmed',
        date: data.date,
        startTime: data.startTime,
        endTime,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to create booking' });
  }
});

// Get booking
router.get('/:bookingId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({ bookingId });

    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found' });
      return;
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get booking' });
  }
});

// Get my bookings
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { status, from, to } = req.query;

    const query: unknown = { customerId: req.user?.sub };

    if (status) query.status = status;
    if (from) query.date = { $gte: from };
    if (to) query.date = { ...query.date, $lte: to };

    const bookings = await Booking.find(query).sort({ date: -1 });

    res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get bookings' });
  }
});

// Cancel booking
router.post('/:bookingId/cancel', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findOneAndUpdate(
      { bookingId, customerId: req.user?.sub },
      { status: 'cancelled', cancellationReason: reason },
      { new: true }
    );

    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found' });
      return;
    }

    res.json({
      success: true,
      data: { bookingId, status: 'cancelled' },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to cancel booking' });
  }
});

export { router as bookingRoutes };
