/**
 * Merchant Twin Routes
 */

import { Router, Response } from 'express';
import { merchantTwinService } from '../services/merchant-twin.service';
import { authenticate, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import {
  validateBody,
  validateQuery,
  validateParams,
  createMerchantTwinSchema,
  updateMerchantTwinSchema,
  listQuerySchema,
  merchantIdParamSchema,
} from '../middleware/validation';
import { metrics } from '../middleware/metrics';
import { NotFoundError } from '../middleware/error-handler';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/merchant-twin/create
 * Create a new merchant twin
 */
router.post(
  '/create',
  optionalAuth,
  validateBody(createMerchantTwinSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const twin = await merchantTwinService.createMerchantTwin(req.body);
      metrics.merchantTwinsCreated();

      logger.info('Merchant twin created via API', {
        merchantId: req.body.merchantId,
        twinId: twin.twinId,
        createdBy: req.user?.userId || 'anonymous',
      });

      res.status(201).json({
        success: true,
        data: twin,
        message: 'Merchant twin created successfully',
      });
    } catch (error) {
      logger.error('Failed to create merchant twin', {
        error: error instanceof Error ? error.message : 'Unknown',
        merchantId: req.body.merchantId,
      });
      throw error;
    }
  }
);

/**
 * GET /api/merchant-twin/:merchantId
 * Get merchant twin by merchantId
 */
router.get(
  '/:merchantId',
  optionalAuth,
  validateParams(merchantIdParamSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const twin = await merchantTwinService.getMerchantTwin(req.params.merchantId);

      if (!twin) {
        throw new NotFoundError(`Merchant twin not found for ID: ${req.params.merchantId}`);
      }

      metrics.merchantTwinsRetrieved();

      res.json({
        success: true,
        data: twin,
      });
    } catch (error) {
      logger.error('Failed to get merchant twin', {
        error: error instanceof Error ? error.message : 'Unknown',
        merchantId: req.params.merchantId,
      });
      throw error;
    }
  }
);

/**
 * PUT /api/merchant-twin/:merchantId
 * Update merchant twin
 */
router.put(
  '/:merchantId',
  authenticate,
  validateParams(merchantIdParamSchema),
  validateBody(updateMerchantTwinSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const twin = await merchantTwinService.updateMerchantTwin(
        req.params.merchantId,
        req.body
      );

      if (!twin) {
        throw new NotFoundError(`Merchant twin not found for ID: ${req.params.merchantId}`);
      }

      logger.info('Merchant twin updated via API', {
        merchantId: req.params.merchantId,
        twinId: twin.twinId,
        updatedBy: req.user?.userId,
        fieldsUpdated: Object.keys(req.body),
      });

      res.json({
        success: true,
        data: twin,
        message: 'Merchant twin updated successfully',
      });
    } catch (error) {
      logger.error('Failed to update merchant twin', {
        error: error instanceof Error ? error.message : 'Unknown',
        merchantId: req.params.merchantId,
      });
      throw error;
    }
  }
);

/**
 * DELETE /api/merchant-twin/:merchantId
 * Delete merchant twin
 */
router.delete(
  '/:merchantId',
  authenticate,
  validateParams(merchantIdParamSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const deleted = await merchantTwinService.deleteMerchantTwin(req.params.merchantId);

      if (!deleted) {
        throw new NotFoundError(`Merchant twin not found for ID: ${req.params.merchantId}`);
      }

      logger.info('Merchant twin deleted via API', {
        merchantId: req.params.merchantId,
        deletedBy: req.user?.userId,
      });

      res.json({
        success: true,
        message: 'Merchant twin deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete merchant twin', {
        error: error instanceof Error ? error.message : 'Unknown',
        merchantId: req.params.merchantId,
      });
      throw error;
    }
  }
);

/**
 * GET /api/merchant-twin/:merchantId/audience
 * Get merchant's customer audience insights
 */
router.get(
  '/:merchantId/audience',
  optionalAuth,
  validateParams(merchantIdParamSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const insights = await merchantTwinService.getAudienceInsights(req.params.merchantId);

      if (!insights) {
        throw new NotFoundError(`Merchant twin not found for ID: ${req.params.merchantId}`);
      }

      metrics.audienceInsightsGenerated();

      res.json({
        success: true,
        data: insights,
      });
    } catch (error) {
      logger.error('Failed to get audience insights', {
        error: error instanceof Error ? error.message : 'Unknown',
        merchantId: req.params.merchantId,
      });
      throw error;
    }
  }
);

/**
 * GET /api/merchant-twin/:merchantId/insights
 * Get advertising insights for a merchant
 */
router.get(
  '/:merchantId/insights',
  optionalAuth,
  validateParams(merchantIdParamSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const insights = await merchantTwinService.getAdvertisingInsights(req.params.merchantId);

      if (!insights) {
        throw new NotFoundError(`Merchant twin not found for ID: ${req.params.merchantId}`);
      }

      metrics.advertisingInsightsGenerated();

      res.json({
        success: true,
        data: insights,
      });
    } catch (error) {
      logger.error('Failed to get advertising insights', {
        error: error instanceof Error ? error.message : 'Unknown',
        merchantId: req.params.merchantId,
      });
      throw error;
    }
  }
);

/**
 * GET /api/merchant-twin
 * List all merchant twins with pagination and filters
 */
router.get(
  '/',
  optionalAuth,
  validateQuery(listQuerySchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page, limit, category, city, investmentReadiness } = req.query as {
        page: number;
        limit: number;
        category?: string;
        city?: string;
        investmentReadiness?: string;
      };

      const { twins, total } = await merchantTwinService.listMerchantTwins(page, limit, {
        category,
        city,
        investmentReadiness,
      });

      res.json({
        success: true,
        data: twins,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Failed to list merchant twins', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      throw error;
    }
  }
);

/**
 * GET /api/merchant-twin/:merchantId/similar
 * Find similar merchants
 */
router.get(
  '/:merchantId/similar',
  optionalAuth,
  validateParams(merchantIdParamSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const similar = await merchantTwinService.findSimilarMerchants(req.params.merchantId, limit);

      res.json({
        success: true,
        data: similar,
      });
    } catch (error) {
      logger.error('Failed to find similar merchants', {
        error: error instanceof Error ? error.message : 'Unknown',
        merchantId: req.params.merchantId,
      });
      throw error;
    }
  }
);

export default router;