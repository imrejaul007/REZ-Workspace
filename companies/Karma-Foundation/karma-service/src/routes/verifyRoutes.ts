/**
 * Verify Routes — Karma Foundation
 *
 * Express router for verification endpoints:
 *   POST /api/karma/verify/checkin
 *   POST /api/karma/verify/checkout
 *   GET  /api/karma/verify/status/:bookingId
 */
import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import {
  processCheckIn,
  processCheckOut,
  EventBookingModel,
} from '../engines/verificationEngine';
import { getEarnRecord } from '../services/earnRecordService';
import { requireAuth } from '../middleware/auth';
import { logger } from '../config/logger';

const router = Router();

// Rate limiter for verification endpoints
const verificationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per user
  message: { success: false, error: 'Too many verification requests. Please wait.' },
  keyGenerator: (req: Request) => {
    // Use userId if authenticated, otherwise IP
    return (req as Request & { userId?: string }).userId || req.ip || 'unknown';
  },
});

// Zod schemas for validation
const GPSCoordsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const CheckInSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid userId format'),
  eventId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid eventId format'),
  mode: z.enum(['qr', 'gps']),
  qrCode: z.string().optional(),
  gpsCoords: GPSCoordsSchema.optional(),
}).refine(
  (data) => data.mode !== 'qr' || (data.qrCode && data.qrCode.length > 0),
  { message: 'qrCode is required when mode is qr', path: ['qrCode'] }
);

const BookingIdSchema = z.object({
  bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid bookingId format'),
});

// Apply rate limiting and auth to all routes
router.use(verificationLimiter);
router.use(requireAuth);

// POST /api/karma/verify/checkin
router.post('/checkin', async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = CheckInSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    const { userId, eventId, mode, qrCode, gpsCoords } = validation.data;

    // Verify user owns this action
    if (req.userId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Cannot check in for another user',
      });
      return;
    }

    const result = await processCheckIn({
      userId,
      eventId,
      mode,
      qrCode,
      gpsCoords,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Check-in error', { error, userId: req.userId });
    res.status(500).json({
      success: false,
      error: 'Check-in failed',
    });
  }
});

// POST /api/karma/verify/checkout
router.post('/checkout', async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = CheckInSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    const { userId, eventId, mode, qrCode, gpsCoords } = validation.data;

    if (req.userId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Cannot check out for another user',
      });
      return;
    }

    const result = await processCheckOut({
      userId,
      eventId,
      mode,
      qrCode,
      gpsCoords,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Check-out error', { error, userId: req.userId });
    res.status(500).json({
      success: false,
      error: 'Check-out failed',
    });
  }
});

// GET /api/karma/verify/status/:bookingId
router.get('/status/:bookingId', async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = BookingIdSchema.safeParse(req.params);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid booking ID',
      });
      return;
    }

    const { bookingId } = validation.data;
    const record = await getEarnRecord(bookingId);

    if (!record) {
      res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
      return;
    }

    // Only allow user to see their own record
    if (record.userId.toString() !== req.userId) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    logger.error('Status check error', { error, bookingId: req.params.bookingId });
    res.status(500).json({
      success: false,
      error: 'Failed to get status',
    });
  }
});

export default router;
