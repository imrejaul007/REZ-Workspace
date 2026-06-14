import { Router, Request, Response } from 'express';
import {
  validateCreateFloorRule,
  validateUpdateFloorRule,
  validatePagination,
} from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimit.js';
import { getFloorService } from '../services/index.js';
import { FloorFilter, PaginationParams, CTVDeviceCategory } from '../types/index.js';

const router = Router();

/**
 * GET /api/floors - Get floor price rules
 */
router.get(
  '/',
  authenticate,
  rateLimiter('floors'),
  validatePagination,
  async (req: Request, res: Response) => {
    try {
      const floorService = getFloorService();

      const filter: FloorFilter = {
        status: req.query.status as 'active' | 'paused' | 'deleted' | undefined,
        geo: req.query.geo as string | undefined,
        deviceType: req.query.deviceType as CTVDeviceCategory | undefined,
      };

      const pagination: PaginationParams = {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc',
      };

      const result = await floorService.listRules(filter, pagination);

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
      logger.error('List floor rules error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list floor rules',
        },
      });
    }
  }
);

/**
 * POST /api/floors - Create a floor price rule
 */
router.post(
  '/',
  authenticate,
  rateLimiter('floors'),
  validateCreateFloorRule,
  async (req: Request, res: Response) => {
    try {
      const floorService = getFloorService();

      const ruleData = {
        ...req.body,
        status: req.body.status || 'active',
        createdBy: req.auth?.sub || 'system',
      };

      const rule = await floorService.createRule(ruleData);

      res.status(201).json({
        success: true,
        data: rule,
        meta: {
          requestId: req.headers['x-request-id'],
        },
      });
    } catch (error) {
      logger.error('Create floor rule error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create floor rule',
        },
      });
    }
  }
);

/**
 * GET /api/floors/:id - Get floor rule details
 */
router.get(
  '/:id',
  authenticate,
  rateLimiter('floors'),
  async (req: Request, res: Response) => {
    try {
      const floorService = getFloorService();
      const rule = await floorService.getRuleById(req.params.id);

      if (!rule) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Floor rule not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: rule,
        meta: {
          requestId: req.headers['x-request-id'],
        },
      });
    } catch (error) {
      logger.error('Get floor rule error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get floor rule',
        },
      });
    }
  }
);

/**
 * PUT /api/floors/:id - Update a floor rule
 */
router.put(
  '/:id',
  authenticate,
  rateLimiter('floors'),
  validateUpdateFloorRule,
  async (req: Request, res: Response) => {
    try {
      const floorService = getFloorService();
      const rule = await floorService.updateRule(req.params.id, req.body);

      if (!rule) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Floor rule not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: rule,
        meta: {
          requestId: req.headers['x-request-id'],
        },
      });
    } catch (error) {
      logger.error('Update floor rule error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update floor rule',
        },
      });
    }
  }
);

/**
 * DELETE /api/floors/:id - Delete a floor rule
 */
router.delete(
  '/:id',
  authenticate,
  rateLimiter('floors'),
  async (req: Request, res: Response) => {
    try {
      const floorService = getFloorService();
      const deleted = await floorService.deleteRule(req.params.id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Floor rule not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          ruleId: req.params.id,
          deleted: true,
        },
        meta: {
          requestId: req.headers['x-request-id'],
        },
      });
    } catch (error) {
      logger.error('Delete floor rule error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete floor rule',
        },
      });
    }
  }
);

/**
 * GET /api/floors/calculate - Calculate floor price for context
 */
router.get(
  '/calculate',
  authenticate,
  rateLimiter('floors'),
  async (req: Request, res: Response) => {
    try {
      const floorService = getFloorService();

      const floorPrice = await floorService.calculateFloorPrice({
        geo: req.query.geo as string | undefined,
        deviceType: req.query.deviceType as CTVDeviceCategory | undefined,
        contentCategory: req.query.contentCategory as string | undefined,
        appBundle: req.query.appBundle as string | undefined,
      });

      res.json({
        success: true,
        data: {
          floorPrice,
          currency: 'USD',
          calculatedAt: new Date().toISOString(),
        },
        meta: {
          requestId: req.headers['x-request-id'],
        },
      });
    } catch (error) {
      logger.error('Calculate floor price error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to calculate floor price',
        },
      });
    }
  }
);

export default router;