import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { searchAvailability, searchAllVerticals, searchMerchants } from '../services/bookingService';
import { createLogger } from '../utils/logger';

const logger = createLogger('search-routes');
const router = Router();

// ============================================
// Validation Schemas
// ============================================

const availabilityQuerySchema = z.object({
  vertical: z.string().min(1),
  merchantId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format').optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format').optional(),
  partySize: z.coerce.number().int().min(1).max(100).optional(),
  filters: z.record(z.unknown()).optional(),
});

const searchAllQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format').optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format').optional(),
  vertical: z.string().optional(),
  partySize: z.coerce.number().int().min(1).max(100).optional(),
});

const merchantSearchQuerySchema = z.object({
  vertical: z.string().min(1),
  city: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(1).max(100).optional(),
  query: z.string().optional(),
});

// ============================================
// Route Handlers
// ============================================

/**
 * GET /api/v1/search/availability
 * Search availability for a specific vertical
 */
router.get(
  '/availability',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId = req.requestId || uuidv4();
    const startTime = Date.now();

    try {
      const validationResult = availabilityQuerySchema.safeParse(req.query);

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

      const { vertical, merchantId, date, startTime: startTimeStr, endTime: endTimeStr, partySize, filters } =
        validationResult.data;

      logger.info('Searching availability', {
        requestId,
        vertical,
        merchantId,
        date,
        startTime: startTimeStr,
        partySize,
      });

      const slots = await searchAvailability({
        vertical,
        merchantId,
        date,
        startTime: startTimeStr,
        endTime: endTimeStr,
        partySize,
        filters,
      });

      const duration = Date.now() - startTime;

      logger.info('Availability search completed', {
        requestId,
        vertical,
        merchantId,
        slotsFound: slots.length,
        durationMs: duration,
      });

      res.json({
        success: true,
        data: {
          slots,
          total: slots.length,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
          durationMs: duration,
        },
      });
    } catch (error) {
      logger.error('Availability search failed', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }
);

/**
 * GET /api/v1/search/availability/all
 * Search availability across all verticals
 */
router.get(
  '/availability/all',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId = req.requestId || uuidv4();
    const startTime = Date.now();

    try {
      const validationResult = searchAllQuerySchema.safeParse(req.query);

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

      const { date, startTime: startTimeStr, partySize, vertical } = validationResult.data;

      logger.info('Searching all verticals availability', {
        requestId,
        date,
        startTime: startTimeStr,
        partySize,
        verticalFilter: vertical,
      });

      const verticalsResult = await searchAllVerticals(date, startTimeStr, partySize, vertical);

      const duration = Date.now() - startTime;

      logger.info('All verticals search completed', {
        requestId,
        verticalsSearched: verticalsResult.length,
        durationMs: duration,
      });

      res.json({
        success: true,
        data: {
          verticals: verticalsResult,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
          durationMs: duration,
        },
      });
    } catch (error) {
      logger.error('All verticals search failed', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }
);

/**
 * GET /api/v1/search/merchants
 * Search merchants by vertical and location
 */
router.get(
  '/merchants',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId = req.requestId || uuidv4();
    const startTime = Date.now();

    try {
      const validationResult = merchantSearchQuerySchema.safeParse(req.query);

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

      const { vertical, city, lat, lng, radius, query } = validationResult.data;

      logger.info('Searching merchants', {
        requestId,
        vertical,
        city,
        location: lat && lng ? { lat, lng } : undefined,
        radius,
        query,
      });

      const merchants = await searchMerchants({
        vertical,
        city,
        lat,
        lng,
        radius,
        query,
      });

      const duration = Date.now() - startTime;

      logger.info('Merchant search completed', {
        requestId,
        merchantsFound: merchants.length,
        durationMs: duration,
      });

      res.json({
        success: true,
        data: {
          merchants,
          total: merchants.length,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
          durationMs: duration,
        },
      });
    } catch (error) {
      logger.error('Merchant search failed', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }
);

export default router;