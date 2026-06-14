import { Router, Request, Response } from 'express';
import {
  validateCreateSeat,
  validateUpdateSeat,
  validatePagination,
} from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimit.js';
import { getSeatService } from '../services/index.js';
import { SeatFilter, PaginationParams } from '../types/index.js';

const router = Router();

/**
 * GET /api/seats - List bidder seats
 */
router.get(
  '/',
  authenticate,
  rateLimiter('seats'),
  validatePagination,
  async (req: Request, res: Response) => {
    try {
      const seatService = getSeatService();

      const filter: SeatFilter = {
        status: req.query.status as 'active' | 'suspended' | 'inactive' | undefined,
        advertiserId: req.query.advertiserId as string | undefined,
        search: req.query.search as string | undefined,
      };

      const pagination: PaginationParams = {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc',
      };

      const result = await seatService.listSeats(filter, pagination);

      res.json({
        success: true,
        data: result.items,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          hasMore: result.hasMore,
          requestId: req.headers['x-request-id'],
        },
      });
    } catch (error) {
      logger.error('List seats error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list seats',
        },
      });
    }
  }
);

/**
 * POST /api/seats - Register a bidder seat
 */
router.post(
  '/',
  authenticate,
  rateLimiter('seats'),
  validateCreateSeat,
  async (req: Request, res: Response) => {
    try {
      const seatService = getSeatService();

      const seatData = {
        ...req.body,
        status: req.body.status || 'active',
      };

      const seat = await seatService.registerSeat(seatData);

      res.status(201).json({
        success: true,
        data: seat,
        meta: {
          requestId: req.headers['x-request-id'],
        },
      });
    } catch (error) {
      logger.error('Create seat error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create seat',
        },
      });
    }
  }
);

/**
 * GET /api/seats/:id - Get seat details
 */
router.get(
  '/:id',
  authenticate,
  rateLimiter('seats'),
  async (req: Request, res: Response) => {
    try {
      const seatService = getSeatService();
      const seat = await seatService.getSeatById(req.params.id);

      if (!seat) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Seat not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: seat,
        meta: {
          requestId: req.headers['x-request-id'],
        },
      });
    } catch (error) {
      logger.error('Get seat error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get seat',
        },
      });
    }
  }
);

/**
 * PUT /api/seats/:id - Update a seat
 */
router.put(
  '/:id',
  authenticate,
  rateLimiter('seats'),
  validateUpdateSeat,
  async (req: Request, res: Response) => {
    try {
      const seatService = getSeatService();
      const seat = await seatService.updateSeat(req.params.id, req.body);

      if (!seat) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Seat not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: seat,
        meta: {
          requestId: req.headers['x-request-id'],
        },
      });
    } catch (error) {
      logger.error('Update seat error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update seat',
        },
      });
    }
  }
);

/**
 * DELETE /api/seats/:id - Delete a seat
 */
router.delete(
  '/:id',
  authenticate,
  rateLimiter('seats'),
  async (req: Request, res: Response) => {
    try {
      const seatService = getSeatService();
      const deleted = await seatService.deleteSeat(req.params.id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Seat not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          seatId: req.params.id,
          deleted: true,
        },
        meta: {
          requestId: req.headers['x-request-id'],
        },
      });
    } catch (error) {
      logger.error('Delete seat error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete seat',
        },
      });
    }
  }
);

/**
 * POST /api/seats/:id/activity - Record seat activity
 */
router.post(
  '/:id/activity',
  authenticate,
  rateLimiter('seats'),
  async (req: Request, res: Response) => {
    try {
      const seatService = getSeatService();
      await seatService.recordActivity(req.params.id);

      res.json({
        success: true,
        data: {
          seatId: req.params.id,
          activityRecorded: true,
        },
        meta: {
          requestId: req.headers['x-request-id'],
        },
      });
    } catch (error) {
      logger.error('Record activity error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to record activity',
        },
      });
    }
  }
);

export default router;