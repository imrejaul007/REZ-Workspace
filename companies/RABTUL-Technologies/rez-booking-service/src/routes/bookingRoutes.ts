/**
 * Unified Booking Routes
 *
 * Central booking management endpoints
 */

import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { z } from 'zod';
import { Booking, BookingStatus, BookingType } from '../models';

const router = Router();

// ─── Configuration ────────────────────────────────────────────────────────────

const HOTEL_SERVICE_URL = process.env.HOTEL_SERVICE_URL || 'https://rez-hotel-service.onrender.com';
const STAYOWN_SERVICE_URL = process.env.STAYOWN_SERVICE_URL || 'https://rez-stayown-service.onrender.com';
const TRAVEL_SERVICE_URL = process.env.TRAVEL_SERVICE_URL || 'https://rez-travel-service.onrender.com';

// ─── Validation Schemas ──────────────────────────────────────────────────────

const createBookingSchema = z.object({
  type: z.enum(['hotel', 'flight', 'train', 'bus', 'cab']),
  userId: z.string(),
  source: z.enum(['hotel', 'stayown', 'travel', 'app', 'admin']),
  externalBookingId: z.string().optional(),
  confirmationNumber: z.string().optional(),

  // Property/Service details
  propertyId: z.string().optional(),
  propertyName: z.string().optional(),
  roomTypeId: z.string().optional(),
  roomName: z.string().optional(),

  // Travel details
  flightId: z.string().optional(),
  trainId: z.string().optional(),
  busId: z.string().optional(),
  cabId: z.string().optional(),

  // Dates
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  departureDate: z.string().optional(),
  returnDate: z.string().optional(),

  // Guest details
  guests: z.array(z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
  })).min(1),

  // Contact
  contactEmail: z.string().email(),
  contactPhone: z.string(),

  // Pricing
  pricing: z.object({
    baseAmount: z.number(),
    taxes: z.number().optional().default(0),
    fees: z.number().optional().default(0),
    discount: z.number().optional().default(0),
    total: z.number(),
    currency: z.string().optional().default('INR'),
  }),

  // Payment
  paymentId: z.string().optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  paymentMethod: z.string().optional(),

  // Metadata
  metadata: z.record(z.unknown()).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'refunded', 'failed']),
  reason: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const listQuerySchema = z.object({
  userId: z.string().optional(),
  type: z.enum(['hotel', 'flight', 'train', 'bus', 'cab']).optional(),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'refunded', 'failed']).optional(),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * List all bookings
 * GET /api/bookings
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId, type, status, page = 1, limit = 20 } = req.query;

    const filter: unknown = {};
    if (userId) filter.userId = userId;
    if (type) filter.type = type;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('[Booking] List error:', error);
    res.status(500).json({ success: false, message: 'Failed to list bookings' });
  }
});

/**
 * Get booking by ID
 * GET /api/bookings/:bookingId
 */
router.get('/:bookingId', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('[Booking] Get error:', error);
    res.status(500).json({ success: false, message: 'Failed to get booking' });
  }
});

/**
 * Create a new booking
 * POST /api/bookings
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createBookingSchema.parse(req.body);

    // Generate booking ID using crypto
    const prefix = data.type.toUpperCase().substring(0, 2);
    const { randomBytes } = require('crypto');
    const bookingId = `${prefix}${Date.now()}${randomBytes(4).toString('hex').toUpperCase()}`;

    // Generate confirmation number using crypto (6-digit, not 4-digit)
    const { randomInt } = require('crypto');
    const confirmationNumber = data.confirmationNumber ||
      `MCB${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(randomInt(100000, 999999)).padStart(6, '0')}`;

    const booking = new Booking({
      ...data,
      bookingId,
      confirmationNumber,
      status: data.paymentStatus === 'paid' ? BookingStatus.CONFIRMED : BookingStatus.PENDING,
      guestCount: data.guests.length,
      checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
      checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
      departureDate: data.departureDate ? new Date(data.departureDate) : undefined,
      returnDate: data.returnDate ? new Date(data.returnDate) : undefined,
    });

    await booking.save();

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('[Booking] Create error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Invalid booking data', errors: error.errors });
    }
    res.status(500).json({ success: false, message: 'Failed to create booking' });
  }
});

/**
 * Update booking status
 * PATCH /api/bookings/:bookingId/status
 */
router.patch('/:bookingId/status', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const data = updateStatusSchema.parse(req.body);

    const booking = await Booking.findOneAndUpdate(
      { bookingId },
      {
        $set: {
          status: data.status,
          ...(data.reason && { cancellationReason: data.reason }),
          ...(data.status === BookingStatus.CANCELLED && { cancelledAt: new Date() }),
          ...(data.metadata && { metadata: data.metadata }),
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('[Booking] Update status error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
    }
    res.status(500).json({ success: false, message: 'Failed to update booking status' });
  }
});

/**
 * Get booking by confirmation number
 * GET /api/bookings/confirmation/:confirmationNumber
 */
router.get('/confirmation/:confirmationNumber', async (req: Request, res: Response) => {
  try {
    const { confirmationNumber } = req.params;

    const booking = await Booking.findOne({ confirmationNumber });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('[Booking] Get by confirmation error:', error);
    res.status(500).json({ success: false, message: 'Failed to get booking' });
  }
});

/**
 * Get user booking history
 * GET /api/bookings/user/:userId
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { type, status, page = 1, limit = 20 } = req.query;

    const filter: unknown = { userId };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('[Booking] User history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get booking history' });
  }
});

/**
 * Get booking statistics
 * GET /api/bookings/stats
 */
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, userId } = req.query;

    const match: unknown = {};
    if (userId) match.userId = userId;
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate as string);
      if (endDate) match.createdAt.$lte = new Date(endDate as string);
    }

    const stats = await Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.total' },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] },
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
          byType: {
            $push: '$type',
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalBookings: 1,
          totalRevenue: 1,
          confirmedBookings: 1,
          cancelledBookings: 1,
          completionRate: {
            $cond: [
              { $eq: ['$totalBookings', 0] },
              0,
              { $divide: ['$confirmedBookings', '$totalBookings'] },
            ],
          },
        },
      },
    ]);

    const byTypeStats = await Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          revenue: { $sum: '$pricing.total' },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        summary: stats[0] || {
          totalBookings: 0,
          totalRevenue: 0,
          confirmedBookings: 0,
          cancelledBookings: 0,
          completionRate: 0,
        },
        byType: byTypeStats.reduce((acc, item) => {
          acc[item._id] = { count: item.count, revenue: item.revenue };
          return acc;
        }, {} as Record<string, { count: number; revenue: number }>),
      },
    });
  } catch (error) {
    console.error('[Booking] Stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get statistics' });
  }
});

export default router;
