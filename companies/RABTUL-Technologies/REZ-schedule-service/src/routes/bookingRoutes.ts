import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { bookingService } from '../services/bookingService';
import { logger } from '../utils/logger';

const router = Router();

const createBookingSchema = z.object({
  eventTypeId: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  attendeeName: z.string(),
  attendeeEmail: z.string().email(),
  attendeePhone: z.string().optional(),
  timezone: z.string().default('Asia/Kolkata'),
  responses: z.record(z.unknown()).optional(),
  idempotencyKey: z.string().optional(),
});

const cancelBookingSchema = z.object({
  reason: z.string().optional(),
  notifyHost: z.boolean().default(true),
  notifyGuest: z.boolean().default(true),
});

const rescheduleBookingSchema = z.object({
  newStartTime: z.string(),
  newEndTime: z.string(),
});

function getStringQuery(req: Request, name: string): string | undefined {
  const val = (req.query as Record<string, unknown>)[name];
  return typeof val === 'string' ? val : undefined;
}

function getNumberQuery(req: Request, name: string): number | undefined {
  const val = getStringQuery(req, name);
  return val ? parseInt(val, 10) : undefined;
}

/**
 * List bookings
 * GET /api/bookings
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const status = getStringQuery(req, 'status');
    const startDate = getStringQuery(req, 'startDate');
    const endDate = getStringQuery(req, 'endDate');
    const page = getNumberQuery(req, 'page') ?? 1;
    const limit = getNumberQuery(req, 'limit') ?? 20;

    const result = await bookingService.listBookings(userId, {
      status: status as 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW' | undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('[Booking] List error:', error);
    res.status(500).json({ success: false, error: 'Failed to list bookings' });
  }
});

/**
 * Create booking
 * POST /api/bookings
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const data = createBookingSchema.parse(req.body);

    const booking = await bookingService.createBooking({
      eventTypeId: data.eventTypeId,
      startTime: data.startTime,
      endTime: data.endTime,
      attendeeName: data.attendeeName,
      attendeeEmail: data.attendeeEmail,
      attendeePhone: data.attendeePhone,
      timezone: data.timezone,
      responses: data.responses,
      idempotencyKey: data.idempotencyKey,
    }, userId);

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    if (error instanceof Error) {
      if (error.message.includes('not available')) {
        return res.status(409).json({ success: false, error: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, error: error.message });
      }
    }
    logger.error('[Booking] Create error:', error);
    res.status(500).json({ success: false, error: 'Failed to create booking' });
  }
});

/**
 * Get booking by UID
 * GET /api/bookings/:uid
 */
router.get('/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const booking = await bookingService.getBookingByUid(uid);

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    logger.error('[Booking] Get error:', error);
    res.status(500).json({ success: false, error: 'Failed to get booking' });
  }
});

/**
 * Cancel booking
 * PATCH /api/bookings/:uid/cancel
 */
router.patch('/:uid/cancel', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { reason, notifyHost = true, notifyGuest = true } = cancelBookingSchema.parse(req.body);
    const userId = req.headers['x-user-id'] as string;

    const booking = await bookingService.cancelBooking(uid, { reason, notifyHost, notifyGuest }, userId || 'host');

    res.json({ success: true, data: booking });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    logger.error('[Booking] Cancel error:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel booking' });
  }
});

/**
 * Reschedule booking
 * PATCH /api/bookings/:uid/reschedule
 */
router.patch('/:uid/reschedule', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { newStartTime, newEndTime } = rescheduleBookingSchema.parse(req.body);

    const booking = await bookingService.rescheduleBooking(uid, { newStartTime, newEndTime });

    res.json({ success: true, data: booking });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    logger.error('[Booking] Reschedule error:', error);
    res.status(500).json({ success: false, error: 'Failed to reschedule booking' });
  }
});

/**
 * Confirm booking
 * PATCH /api/bookings/:uid/confirm
 */
router.patch('/:uid/confirm', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const booking = await bookingService.confirmBooking(uid);
    res.json({ success: true, data: booking });
  } catch (error) {
    logger.error('[Booking] Confirm error:', error);
    res.status(500).json({ success: false, error: 'Failed to confirm booking' });
  }
});

/**
 * Complete booking
 * PATCH /api/bookings/:uid/complete
 */
router.patch('/:uid/complete', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const booking = await bookingService.completeBooking(uid);
    res.json({ success: true, data: booking });
  } catch (error) {
    logger.error('[Booking] Complete error:', error);
    res.status(500).json({ success: false, error: 'Failed to complete booking' });
  }
});

/**
 * Mark as no-show
 * PATCH /api/bookings/:uid/no-show
 */
router.patch('/:uid/no-show', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const booking = await bookingService.markNoShow(uid);
    res.json({ success: true, data: booking });
  } catch (error) {
    logger.error('[Booking] No-show error:', error);
    res.status(500).json({ success: false, error: 'Failed to mark as no-show' });
  }
});

export default router;
