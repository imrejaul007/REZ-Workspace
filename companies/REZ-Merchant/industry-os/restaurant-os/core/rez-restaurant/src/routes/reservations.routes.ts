/**
 * Reservations Routes
 *
 * Endpoints for reservation management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { rateLimiters } from '../middleware/rateLimiter';
import { reservationService } from '../services/ReservationService';
import { logger } from '../config/logger';

const log = (msg: string, meta?) => logger.info(`[reservations-routes] ${msg}`, meta);
const router = Router();

// ─── Validation Schemas ────────────────────────────────────────────────────────

const createReservationSchema = z.object({
  restaurantId: z.string(),
  branchId: z.string(),
  guestName: z.string().min(1),
  guestPhone: z.string().min(10),
  guestEmail: z.string().email().optional(),
  guestCount: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  duration: z.number().positive().optional(),
  specialOccasion: z.string().optional(),
  specialRequests: z.string().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  source: z.enum(['app', 'website', 'phone', 'walkin', 'partner']).optional(),
});

const updateReservationSchema = createReservationSchema.partial().omit({ restaurantId: true, branchId: true });

// ─── Public Routes ────────────────────────────────────────────────────────────

/**
 * Get time slots
 * GET /api/reservations/branch/:branchId/slots
 */
router.get('/branch/:branchId/slots', rateLimiters.reservation, async (req: Request, res: Response) => {
  try {
    const { date, guestCount } = req.query;

    if (!date || !guestCount) {
      res.status(400).json({ success: false, message: 'date and guestCount are required' });
      return;
    }

    const slots = await reservationService.getTimeSlots({
      branchId: req.params.branchId,
      date: date as string,
      guestCount: parseInt(guestCount as string, 10),
    });

    res.json({
      success: true,
      data: slots,
    });
  } catch (error) {
    log('Get time slots error:', error);
    res.status(500).json({ success: false, message: 'Failed to get time slots' });
  }
});

/**
 * Get reservation by confirmation number
 * GET /api/reservations/confirm/:confirmationNumber
 */
router.get('/confirm/:confirmationNumber', async (req: Request, res: Response) => {
  try {
    const reservation = await reservationService.getReservationByConfirmation(
      req.params.confirmationNumber
    );

    if (!reservation) {
      res.status(404).json({ success: false, message: 'Reservation not found' });
      return;
    }

    res.json({ success: true, data: reservation });
  } catch (error) {
    log('Get reservation error:', error);
    res.status(500).json({ success: false, message: 'Failed to get reservation' });
  }
});

// ─── Protected Routes ───────────────────────────────────────────────────────────

/**
 * Create reservation
 * POST /api/reservations
 */
router.post('/', rateLimiters.reservation, authenticateToken, async (req: Request, res: Response) => {
  try {
    const input = createReservationSchema.parse(req.body);

    const reservation = await reservationService.createReservation({
      ...input,
      userId: req.user!.sub,
    });

    res.status(201).json({
      success: true,
      data: reservation,
      message: 'Reservation created successfully',
    });
  } catch (error) {
    log('Create reservation error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    if (error.message === 'Time slot not available') {
      res.status(409).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to create reservation' });
  }
});

/**
 * Get reservation by ID
 * GET /api/reservations/:reservationId
 */
router.get('/:reservationId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const reservation = await reservationService.getReservation(req.params.reservationId);

    if (!reservation) {
      res.status(404).json({ success: false, message: 'Reservation not found' });
      return;
    }

    res.json({ success: true, data: reservation });
  } catch (error) {
    log('Get reservation error:', error);
    res.status(500).json({ success: false, message: 'Failed to get reservation' });
  }
});

/**
 * Update reservation
 * PUT /api/reservations/:reservationId
 */
router.put('/:reservationId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const input = updateReservationSchema.parse(req.body);

    const reservation = await reservationService.updateReservation(
      req.params.reservationId,
      input
    );

    if (!reservation) {
      res.status(404).json({ success: false, message: 'Reservation not found' });
      return;
    }

    res.json({
      success: true,
      data: reservation,
      message: 'Reservation updated successfully',
    });
  } catch (error) {
    log('Update reservation error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to update reservation' });
  }
});

/**
 * Confirm reservation
 * POST /api/reservations/:reservationId/confirm
 */
router.post('/:reservationId/confirm', authenticateToken, async (req: Request, res: Response) => {
  try {
    const reservation = await reservationService.confirmReservation(req.params.reservationId);

    if (!reservation) {
      res.status(404).json({ success: false, message: 'Reservation not found' });
      return;
    }

    res.json({
      success: true,
      data: reservation,
      message: 'Reservation confirmed',
    });
  } catch (error) {
    log('Confirm reservation error:', error);
    res.status(500).json({ success: false, message: 'Failed to confirm reservation' });
  }
});

/**
 * Cancel reservation
 * POST /api/reservations/:reservationId/cancel
 */
router.post('/:reservationId/cancel', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;

    const reservation = await reservationService.cancelReservation(
      req.params.reservationId,
      reason
    );

    if (!reservation) {
      res.status(404).json({ success: false, message: 'Reservation not found' });
      return;
    }

    res.json({
      success: true,
      data: reservation,
      message: 'Reservation cancelled',
    });
  } catch (error) {
    log('Cancel reservation error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel reservation' });
  }
});

/**
 * Seat guest
 * POST /api/reservations/:reservationId/seat
 */
router.post('/:reservationId/seat', authenticateToken, async (req: Request, res: Response) => {
  try {
    const reservation = await reservationService.seatGuest(req.params.reservationId);

    if (!reservation) {
      res.status(404).json({ success: false, message: 'Reservation not found' });
      return;
    }

    res.json({
      success: true,
      data: reservation,
      message: 'Guest seated',
    });
  } catch (error) {
    log('Seat guest error:', error);
    res.status(500).json({ success: false, message: 'Failed to seat guest' });
  }
});

/**
 * Complete reservation
 * POST /api/reservations/:reservationId/complete
 */
router.post('/:reservationId/complete', authenticateToken, async (req: Request, res: Response) => {
  try {
    const reservation = await reservationService.completeReservation(req.params.reservationId);

    if (!reservation) {
      res.status(404).json({ success: false, message: 'Reservation not found' });
      return;
    }

    res.json({
      success: true,
      data: reservation,
      message: 'Reservation completed',
    });
  } catch (error) {
    log('Complete reservation error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete reservation' });
  }
});

/**
 * Get my upcoming reservations
 * GET /api/reservations/my/upcoming
 */
router.get('/my/upcoming', authenticateToken, async (req: Request, res: Response) => {
  try {
    const reservations = await reservationService.getUpcomingReservations(req.user!.sub);

    res.json({
      success: true,
      data: reservations,
    });
  } catch (error) {
    log('Get upcoming reservations error:', error);
    res.status(500).json({ success: false, message: 'Failed to get reservations' });
  }
});

/**
 * Get reservations by date
 * GET /api/reservations/branch/:branchId/date/:date
 */
router.get('/branch/:branchId/date/:date', authenticateToken, async (req: Request, res: Response) => {
  try {
    const reservations = await reservationService.getReservationsByDate(
      req.params.branchId,
      req.params.date
    );

    res.json({
      success: true,
      data: reservations,
    });
  } catch (error) {
    log('Get reservations by date error:', error);
    res.status(500).json({ success: false, message: 'Failed to get reservations' });
  }
});

/**
 * Get reservation statistics
 * GET /api/reservations/branch/:branchId/stats
 */
router.get('/branch/:branchId/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { date } = req.query;

    const stats = await reservationService.getReservationStats(
      req.params.branchId,
      date as string || new Date().toISOString().split('T')[0]
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    log('Get reservation stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get stats' });
  }
});

export default router;
