import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { VERTICAL_LIST, isValidVertical } from '../config/verticals';
import {
  getVerticalBooking,
  updateVerticalBooking,
  deleteVerticalBooking,
} from '../services/verticalProxy';
import { createLogger } from '../utils/logger';

const logger = createLogger('verticals-routes');
const router = Router();

// ============================================
// Validation Schemas
// ============================================

const verticalParamSchema = z.object({
  vertical: z.string().toLowerCase(),
});

const bookingIdParamSchema = z.object({
  bookingId: z.string().min(1),
});

const updateBookingBodySchema = z.object({
  startDateTime: z.string().datetime().optional(),
  endDateTime: z.string().datetime().optional(),
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
  notes: z.string().max(1000).optional(),
  partySize: z.number().int().min(1).optional(),
  bookingData: z.record(z.unknown()).optional(),
});

// ============================================
// Route Handlers
// ============================================

/**
 * GET /api/v1/verticals
 * List all available verticals
 */
router.get(
  '/',
  async (_req: Request, res: Response): Promise<void> => {
    res.json({
      success: true,
      data: {
        verticals: VERTICAL_LIST,
        total: VERTICAL_LIST.length,
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });
  }
);

/**
 * GET /api/v1/verticals/:vertical
 * Get details for a specific vertical
 */
router.get(
  '/:vertical',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId = req.requestId || uuidv4();
    const { vertical } = req.params;

    try {
      if (!isValidVertical(vertical)) {
        res.status(404).json({
          success: false,
          error: {
            code: 'VERTICAL_NOT_FOUND',
            message: `Vertical '${vertical}' is not supported`,
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        });
        return;
      }

      const verticalConfig = VERTICAL_LIST.find((v) => v.key === vertical);

      res.json({
        success: true,
        data: {
          vertical: verticalConfig,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/verticals/:vertical/bookings/:bookingId
 * Get booking from a specific vertical service
 */
router.get(
  '/:vertical/bookings/:bookingId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId = req.requestId || uuidv4();
    const { vertical, bookingId } = req.params;

    try {
      if (!isValidVertical(vertical)) {
        res.status(404).json({
          success: false,
          error: {
            code: 'VERTICAL_NOT_FOUND',
            message: `Vertical '${vertical}' is not supported`,
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        });
        return;
      }

      logger.info('Getting vertical booking', {
        requestId,
        vertical,
        bookingId,
      });

      const result = await getVerticalBooking(vertical, bookingId);

      if (!result.success) {
        res.status(502).json({
          success: false,
          error: {
            code: 'VERTICAL_UNAVAILABLE',
            message: result.error?.message || 'Failed to fetch booking from vertical service',
            details: result.error,
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      });
    } catch (error) {
      logger.error('Getting vertical booking failed', {
        requestId,
        vertical,
        bookingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }
);

/**
 * PUT /api/v1/verticals/:vertical/bookings/:bookingId
 * Update booking in a specific vertical service
 */
router.put(
  '/:vertical/bookings/:bookingId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId = req.requestId || uuidv4();
    const { vertical, bookingId } = req.params;

    try {
      const validationResult = updateBookingBodySchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: validationResult.error.errors,
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        });
        return;
      }

      if (!isValidVertical(vertical)) {
        res.status(404).json({
          success: false,
          error: {
            code: 'VERTICAL_NOT_FOUND',
            message: `Vertical '${vertical}' is not supported`,
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        });
        return;
      }

      const updates = validationResult.data;

      logger.info('Updating vertical booking', {
        requestId,
        vertical,
        bookingId,
        updates,
      });

      const result = await updateVerticalBooking(vertical, bookingId, updates);

      if (!result.success) {
        res.status(502).json({
          success: false,
          error: {
            code: 'VERTICAL_UNAVAILABLE',
            message: result.error?.message || 'Failed to update booking in vertical service',
            details: result.error,
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      });
    } catch (error) {
      logger.error('Updating vertical booking failed', {
        requestId,
        vertical,
        bookingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/verticals/:vertical/bookings/:bookingId
 * Delete/cancel booking in a specific vertical service
 */
router.delete(
  '/:vertical/bookings/:bookingId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId = req.requestId || uuidv4();
    const { vertical, bookingId } = req.params;
    const { reason } = req.query;

    try {
      if (!isValidVertical(vertical)) {
        res.status(404).json({
          success: false,
          error: {
            code: 'VERTICAL_NOT_FOUND',
            message: `Vertical '${vertical}' is not supported`,
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        });
        return;
      }

      logger.info('Deleting vertical booking', {
        requestId,
        vertical,
        bookingId,
        reason,
      });

      const result = await deleteVerticalBooking(vertical, bookingId, reason as string | undefined);

      if (!result.success) {
        res.status(502).json({
          success: false,
          error: {
            code: 'VERTICAL_UNAVAILABLE',
            message: result.error?.message || 'Failed to delete booking in vertical service',
            details: result.error,
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          deleted: true,
          bookingId,
          vertical,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      });
    } catch (error) {
      logger.error('Deleting vertical booking failed', {
        requestId,
        vertical,
        bookingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }
);

export default router;