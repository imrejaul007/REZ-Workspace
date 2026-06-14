import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getUserCalendar, getMerchantCalendar } from '../services/bookingService';
import { createLogger } from '../utils/logger';

const logger = createLogger('calendars-routes');
const router = Router();

// ============================================
// Validation Schemas
// ============================================

const calendarQuerySchema = z.object({
  fromDate: z.string().datetime({ message: 'Invalid fromDate format' }),
  toDate: z.string().datetime({ message: 'Invalid toDate format' }),
  vertical: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
});

// ============================================
// Route Handlers
// ============================================

/**
 * GET /api/v1/calendars/user/:userId
 * Get unified calendar for a user
 */
router.get(
  '/user/:userId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId = req.requestId || uuidv4();
    const startTime = Date.now();
    const { userId } = req.params;

    try {
      const validationResult = calendarQuerySchema.safeParse(req.query);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: validationResult.error.errors,
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        });
        return;
      }

      const { fromDate, toDate, vertical, status } = validationResult.data;

      logger.info('Getting user calendar', {
        requestId,
        userId,
        fromDate,
        toDate,
        vertical,
        status,
      });

      const events = await getUserCalendar(
        userId,
        new Date(fromDate),
        new Date(toDate),
        vertical,
        status
      );

      const duration = Date.now() - startTime;

      // Group events by date
      const eventsByDate = events.reduce<Record<string, typeof events>>((acc, event) => {
        const dateKey = event.startDateTime.toISOString().split('T')[0] || '';
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(event);
        return acc;
      }, {});

      logger.info('User calendar retrieved', {
        requestId,
        userId,
        eventCount: events.length,
        daysWithEvents: Object.keys(eventsByDate).length,
        durationMs: duration,
      });

      res.json({
        success: true,
        data: {
          events,
          eventsByDate,
          total: events.length,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
          durationMs: duration,
        },
      });
    } catch (error) {
      logger.error('Getting user calendar failed', {
        requestId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }
);

/**
 * GET /api/v1/calendars/merchant/:merchantId
 * Get calendar for a merchant
 */
router.get(
  '/merchant/:merchantId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId = req.requestId || uuidv4();
    const startTime = Date.now();
    const { merchantId } = req.params;

    try {
      const validationResult = calendarQuerySchema.safeParse(req.query);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: validationResult.error.errors,
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        });
        return;
      }

      const { fromDate, toDate, status } = validationResult.data;

      logger.info('Getting merchant calendar', {
        requestId,
        merchantId,
        fromDate,
        toDate,
        status,
      });

      const events = await getMerchantCalendar(
        merchantId,
        new Date(fromDate),
        new Date(toDate),
        status
      );

      const duration = Date.now() - startTime;

      // Group events by date and status
      const eventsByDate = events.reduce<Record<string, typeof events>>((acc, event) => {
        const dateKey = event.startDateTime.toISOString().split('T')[0] || '';
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(event);
        return acc;
      }, {});

      // Calculate statistics
      const stats = {
        total: events.length,
        byStatus: events.reduce<Record<string, number>>((acc, event) => {
          acc[event.status] = (acc[event.status] || 0) + 1;
          return acc;
        }, {}),
      };

      logger.info('Merchant calendar retrieved', {
        requestId,
        merchantId,
        eventCount: events.length,
        stats,
        durationMs: duration,
      });

      res.json({
        success: true,
        data: {
          events,
          eventsByDate,
          stats,
          total: events.length,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
          durationMs: duration,
        },
      });
    } catch (error) {
      logger.error('Getting merchant calendar failed', {
        requestId,
        merchantId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }
);

/**
 * GET /api/v1/calendars/conflicts/:merchantId
 * Check for booking conflicts at a specific time
 */
router.get(
  '/conflicts/:merchantId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId = req.requestId || uuidv4();
    const { merchantId } = req.params;
    const { date, time, duration } = req.query;

    try {
      if (!date || !time || !duration) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'date, time, and duration are required',
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        });
        return;
      }

      logger.info('Checking booking conflicts', {
        requestId,
        merchantId,
        date,
        time,
        duration,
      });

      // Parse date and time
      const startDateTime = new Date(`${date}T${time}`);
      const endDateTime = new Date(startDateTime.getTime() + Number(duration) * 60 * 1000);

      // Query for overlapping bookings
      const { UnifiedBooking } = await import('../models');
      const conflicts = await UnifiedBooking.find({
        merchantId,
        status: { $in: ['confirmed', 'pending', 'in_progress'] },
        $or: [
          {
            startDateTime: { $lt: endDateTime },
            endDateTime: { $gt: startDateTime },
          },
        ],
      }).limit(10);

      const hasConflicts = conflicts.length > 0;

      logger.info('Conflict check completed', {
        requestId,
        merchantId,
        hasConflicts,
        conflictCount: conflicts.length,
      });

      res.json({
        success: true,
        data: {
          hasConflicts,
          conflicts: conflicts.map((c) => ({
            bookingId: c.bookingId,
            startDateTime: c.startDateTime,
            endDateTime: c.endDateTime,
            status: c.status,
          })),
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      });
    } catch (error) {
      logger.error('Checking booking conflicts failed', {
        requestId,
        merchantId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }
);

export default router;