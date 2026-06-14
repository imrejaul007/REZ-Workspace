import { Router, Request, Response } from 'express';
import {
  validateCreateDeal,
  validateUpdateDeal,
  validatePagination,
} from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimit.js';
import { getDealService } from '../services/index.js';
import { DealFilter, PaginationParams, DealStatus, DealType } from '../types/index.js';

const router = Router();

/**
 * GET /api/deals - List available deals
 */
router.get(
  '/',
  authenticate,
  rateLimiter('deals'),
  validatePagination,
  async (req: Request, res: Response) => {
    try {
      const dealService = getDealService();

      const filter: DealFilter = {
        status: req.query.status as DealStatus | undefined,
        type: req.query.type as DealType | undefined,
        advertiserId: req.query.advertiserId as string | undefined,
        publisherId: req.query.publisherId as string | undefined,
        search: req.query.search as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const pagination: PaginationParams = {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc',
      };

      const result = await dealService.listDeals(filter, pagination);

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
      logger.error('List deals error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list deals',
        },
      });
    }
  }
);

/**
 * POST /api/deals - Create a new private deal
 */
router.post(
  '/',
  authenticate,
  rateLimiter('deals'),
  validateCreateDeal,
  async (req: Request, res: Response) => {
    try {
      const dealService = getDealService();

      const dealData = {
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        createdBy: req.auth?.sub || 'system',
      };

      const deal = await dealService.createDeal(dealData);

      res.status(201).json({
        success: true,
        data: deal,
        meta: {
          requestId: req.headers['x-request-id'],
        },
      });
    } catch (error) {
      logger.error('Create deal error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create deal',
        },
      });
    }
  }
);

/**
 * GET /api/deals/:id - Get deal details
 */
router.get(
  '/:id',
  authenticate,
  rateLimiter('deals'),
  async (req: Request, res: Response) => {
    try {
      const dealService = getDealService();
      const deal = await dealService.getDealById(req.params.id);

      if (!deal) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Deal not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: deal,
        meta: {
          requestId: req.headers['x-request-id'],
        },
      });
    } catch (error) {
      logger.error('Get deal error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get deal',
        },
      });
    }
  }
);

/**
 * PUT /api/deals/:id - Update a deal
 */
router.put(
  '/:id',
  authenticate,
  rateLimiter('deals'),
  validateUpdateDeal,
  async (req: Request, res: Response) => {
    try {
      const dealService = getDealService();

      const updateData = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        updatedBy: req.auth?.sub || 'system',
      };

      const deal = await dealService.updateDeal(req.params.id, updateData, req.auth?.sub || 'system');

      if (!deal) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Deal not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: deal,
        meta: {
          requestId: req.headers['x-request-id'],
        },
      });
    } catch (error) {
      logger.error('Update deal error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update deal',
        },
      });
    }
  }
);

/**
 * DELETE /api/deals/:id - Delete a deal (soft delete)
 */
router.delete(
  '/:id',
  authenticate,
  rateLimiter('deals'),
  async (req: Request, res: Response) => {
    try {
      const dealService = getDealService();
      const deleted = await dealService.deleteDeal(req.params.id, req.auth?.sub || 'system');

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Deal not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          dealId: req.params.id,
          deleted: true,
        },
        meta: {
          requestId: req.headers['x-request-id'],
        },
      });
    } catch (error) {
      logger.error('Delete deal error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete deal',
        },
      });
    }
  }
);

export default router;