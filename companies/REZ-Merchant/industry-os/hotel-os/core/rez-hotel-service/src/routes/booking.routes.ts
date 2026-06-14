/**
 * Booking Routes
 *
 * Endpoints for booking management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, optionalAuth, requireRoles } from '../middleware/auth';
import { bookingService } from '../services/booking.service';
import { logger } from '../config/logger';

const log = (msg: string, meta?) => logger.info(`[booking-routes] ${msg}`, meta);
const router = Router();

// ─── Validation Schemas ────────────────────────────────────────────────────────

const createBookingSchema = z.object({
  guestId: z.string().min(1),
  roomId: z.string().min(1),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  numGuests: z.number().int().min(1),
  source: z.enum(['direct', 'booking.com', 'expedia', 'agoda', 'makemytrip', 'goibibo', 'phone', 'walkin']),
  specialRequests: z.string().optional(),
});

const updateBookingSchema = z.object({
  roomId: z.string().optional(),
  checkIn: z.string().datetime().optional(),
  checkOut: z.string().datetime().optional(),
  status: z.enum(['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show']).optional(),
  paymentStatus: z.enum(['pending', 'partial', 'paid', 'refunded', 'failed']).optional(),
  paidAmount: z.number().optional(),
  numGuests: z.number().int().min(1).optional(),
  specialRequests: z.string().optional(),
});

const cancelBookingSchema = z.object({
  reason: z.string().optional(),
});

const searchSchema = z.object({
  hotelId: z.string().optional(),
  guestId: z.string().optional(),
  roomId: z.string().optional(),
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  source: z.string().optional(),
  checkInFrom: z.string().optional(),
  checkInTo: z.string().optional(),
  checkOutFrom: z.string().optional(),
  checkOutTo: z.string().optional(),
});

// ─── Public Routes ────────────────────────────────────────────────────────────

/**
 * Get today's arrivals
 * GET /api/bookings/arrivals/:hotelId
 */
router.get('/arrivals/:hotelId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const arrivals = await bookingService.getTodayArrivals(req.params.hotelId);
    res.json({ success: true, data: { bookings: arrivals, total: arrivals.length } });
  } catch (error) {
    log('Get arrivals error:', error);
    res.status(500).json({ success: false, message: 'Failed to get arrivals' });
  }
});

/**
 * Get today's departures
 * GET /api/bookings/departures/:hotelId
 */
router.get('/departures/:hotelId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const departures = await bookingService.getTodayDepartures(req.params.hotelId);
    res.json({ success: true, data: { bookings: departures, total: departures.length } });
  } catch (error) {
    log('Get departures error:', error);
    res.status(500).json({ success: false, message: 'Failed to get departures' });
  }
});

// ─── Protected Routes ─────────────────────────────────────────────────────────

/**
 * Create booking
 * POST /api/bookings
 */
router.post('/', authenticateToken, requireRoles('admin', 'hotel_owner', 'staff', 'receptionist'), async (req: Request, res: Response) => {
  try {
    const input = createBookingSchema.parse(req.body);
    const hotelId = req.user?.hotelId || req.body.hotelId;

    if (!hotelId) {
      res.status(400).json({ success: false, message: 'Hotel ID required' });
      return;
    }

    const booking = await bookingService.createBooking(hotelId, input);

    if (!booking) {
      res.status(400).json({ success: false, message: 'Failed to create booking - room may not be available or guest not found' });
      return;
    }

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully',
    });
  } catch (error) {
    log('Create booking error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to create booking' });
  }
});

/**
 * Get booking by ID
 * GET /api/bookings/:bookingId
 */
router.get('/:bookingId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.getBooking(req.params.bookingId);

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    log('Get booking error:', error);
    res.status(500).json({ success: false, message: 'Failed to get booking' });
  }
});

/**
 * Get booking with full details
 * GET /api/bookings/:bookingId/details
 */
router.get('/:bookingId/details', authenticateToken, async (req: Request, res: Response) => {
  try {
    const details = await bookingService.getBookingWithDetails(req.params.bookingId);

    if (!details) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    res.json({ success: true, data: details });
  } catch (error) {
    log('Get booking details error:', error);
    res.status(500).json({ success: false, message: 'Failed to get booking details' });
  }
});

/**
 * Search bookings
 * GET /api/bookings/search
 */
router.get('/search/all', authenticateToken, async (req: Request, res: Response) => {
  try {
    const filters = searchSchema.parse(req.query);
    const bookings = await bookingService.searchBookings(filters);

    res.json({
      success: true,
      data: { bookings, total: bookings.length, filters },
    });
  } catch (error) {
    log('Search bookings error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid parameters', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Search failed' });
  }
});

/**
 * Get bookings by hotel
 * GET /api/bookings/hotel/:hotelId
 */
router.get('/hotel/:hotelId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const filters = searchSchema.parse(req.query);
    const bookings = await bookingService.getBookingsByHotel(req.params.hotelId, filters);

    res.json({
      success: true,
      data: { bookings, total: bookings.length },
    });
  } catch (error) {
    log('Get hotel bookings error:', error);
    res.status(500).json({ success: false, message: 'Failed to get bookings' });
  }
});

/**
 * Get bookings by guest
 * GET /api/bookings/guest/:guestId
 */
router.get('/guest/:guestId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const bookings = await bookingService.getBookingsByGuest(req.params.guestId);

    res.json({
      success: true,
      data: { bookings, total: bookings.length },
    });
  } catch (error) {
    log('Get guest bookings error:', error);
    res.status(500).json({ success: false, message: 'Failed to get bookings' });
  }
});

/**
 * Update booking
 * PUT /api/bookings/:bookingId
 */
router.put('/:bookingId', authenticateToken, requireRoles('admin', 'hotel_owner', 'staff', 'receptionist'), async (req: Request, res: Response) => {
  try {
    const input = updateBookingSchema.parse(req.body);
    const booking = await bookingService.updateBooking(req.params.bookingId, input);

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    res.json({
      success: true,
      data: booking,
      message: 'Booking updated successfully',
    });
  } catch (error) {
    log('Update booking error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to update booking' });
  }
});

/**
 * Check in guest
 * POST /api/bookings/:bookingId/checkin
 */
router.post('/:bookingId/checkin', authenticateToken, requireRoles('admin', 'hotel_owner', 'staff', 'receptionist'), async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.checkIn(req.params.bookingId);

    if (!booking) {
      res.status(400).json({ success: false, message: 'Cannot check in - booking not found or invalid status' });
      return;
    }

    res.json({
      success: true,
      data: booking,
      message: 'Guest checked in successfully',
    });
  } catch (error) {
    log('Check in error:', error);
    res.status(500).json({ success: false, message: 'Failed to check in guest' });
  }
});

/**
 * Check out guest
 * POST /api/bookings/:bookingId/checkout
 */
router.post('/:bookingId/checkout', authenticateToken, requireRoles('admin', 'hotel_owner', 'staff', 'receptionist'), async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.checkOut(req.params.bookingId);

    if (!booking) {
      res.status(400).json({ success: false, message: 'Cannot check out - not checked in or booking not found' });
      return;
    }

    res.json({
      success: true,
      data: booking,
      message: 'Guest checked out successfully',
    });
  } catch (error) {
    log('Check out error:', error);
    res.status(500).json({ success: false, message: 'Failed to check out guest' });
  }
});

/**
 * Cancel booking
 * POST /api/bookings/:bookingId/cancel
 */
router.post('/:bookingId/cancel', authenticateToken, requireRoles('admin', 'hotel_owner', 'staff', 'receptionist'), async (req: Request, res: Response) => {
  try {
    const { reason } = cancelBookingSchema.parse(req.body);
    const booking = await bookingService.cancelBooking(req.params.bookingId, reason);

    if (!booking) {
      res.status(400).json({ success: false, message: 'Cannot cancel - booking not found or already checked out' });
      return;
    }

    res.json({
      success: true,
      data: booking,
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    log('Cancel booking error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to cancel booking' });
  }
});

/**
 * Get booking statistics
 * GET /api/bookings/stats/:hotelId
 */
router.get('/stats/:hotelId', authenticateToken, requireRoles('admin', 'hotel_owner'), async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({ success: false, message: 'startDate and endDate required' });
      return;
    }

    const stats = await bookingService.getBookingStats(
      req.params.hotelId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({ success: true, data: stats });
  } catch (error) {
    log('Get booking stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get booking statistics' });
  }
});

export default router;
