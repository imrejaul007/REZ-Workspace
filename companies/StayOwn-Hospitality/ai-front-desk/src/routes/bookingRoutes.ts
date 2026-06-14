/**
 * Booking Routes - API endpoints for bookings
 */

import { Router, Request, Response } from 'express';
import { bookingService } from '../services/BookingService';
import { validateBookingInput, validateRequestId } from '../validators';
import { standardLimiter } from '../middleware/rateLimiter';
import { logger } from '../config/logger';

const router = Router();

/**
 * POST /api/bookings
 * Create a new booking
 */
router.post('/', standardLimiter, validateBookingInput, async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.createBooking(req.body);
    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    logger.error('Error creating booking', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to create booking' });
  }
});

/**
 * GET /api/bookings/:id
 * Get booking by ID
 */
router.get('/:id', standardLimiter, validateRequestId, async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    logger.error('Error getting booking', { error: (error as Error).message, bookingId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to get booking' });
  }
});

/**
 * GET /api/bookings/date/:date
 * Get bookings for a specific date
 */
router.get('/date/:date', standardLimiter, async (req: Request, res: Response) => {
  try {
    const date = new Date(req.params.date);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format' });
    }

    const bookings = await bookingService.getBookingsForDate(date);
    res.json({ success: true, data: bookings, count: bookings.length });
  } catch (error) {
    logger.error('Error getting bookings for date', { error: (error as Error).message, date: req.params.date });
    res.status(500).json({ success: false, error: 'Failed to get bookings' });
  }
});

/**
 * GET /api/bookings/status/upcoming
 * Get upcoming bookings
 */
router.get('/status/upcoming', standardLimiter, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const bookings = await bookingService.getUpcomingBookings(limit);
    res.json({ success: true, data: bookings, count: bookings.length });
  } catch (error) {
    logger.error('Error getting upcoming bookings', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get upcoming bookings' });
  }
});

/**
 * GET /api/bookings/status/current
 * Get current bookings
 */
router.get('/status/current', standardLimiter, async (_req: Request, res: Response) => {
  try {
    const bookings = await bookingService.getCurrentBookings();
    res.json({ success: true, data: bookings, count: bookings.length });
  } catch (error) {
    logger.error('Error getting current bookings', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get current bookings' });
  }
});

/**
 * PUT /api/bookings/:id/status
 * Update booking status
 */
router.put('/:id/status', standardLimiter, validateRequestId, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['confirmed', 'checked_in', 'checked_out', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const booking = await bookingService.updateStatus(req.params.id, status);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    logger.error('Error updating booking status', { error: (error as Error).message, bookingId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to update booking status' });
  }
});

/**
 * POST /api/bookings/:id/cancel
 * Cancel a booking
 */
router.post('/:id/cancel', standardLimiter, validateRequestId, async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.cancelBooking(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    res.json({ success: true, data: booking, message: 'Booking cancelled' });
  } catch (error) {
    logger.error('Error cancelling booking', { error: (error as Error).message, bookingId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to cancel booking' });
  }
});

export default router;