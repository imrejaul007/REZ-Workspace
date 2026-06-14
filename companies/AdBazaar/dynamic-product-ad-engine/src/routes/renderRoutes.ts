/**
 * Render Routes
 * API endpoints for ad rendering
 */

import { Router, Request, Response } from 'express';
import { rendererService, campaignService } from '../services';
import { optionalAuth, validateBody, recordAdRendered, recordImpression } from '../middleware';
import { renderRequestSchema, batchRenderRequestSchema } from '../utils/validation';
import type { RenderContext, BatchRenderRequest } from '../types';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/dpa/render
 * Render a dynamic ad for a specific product and user
 */
router.post(
  '/render',
  optionalAuth,
  validateBody(renderRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const { campaignId, productId, userId, sessionId, context } = req.body;

      // Build render context from request
      const renderContext: RenderContext = {
        ...context,
        userId: userId || context?.userId || req.user?.userId,
        sessionId: sessionId || context?.sessionId,
      };

      let ad;

      if (productId) {
        // Render for specific product
        ad = await rendererService.renderAd(campaignId, productId, renderContext);
      } else {
        // Auto-select product based on targeting
        const selectedProduct = await rendererService.selectProduct(campaignId, renderContext);
        if (selectedProduct) {
          ad = await rendererService.renderAd(campaignId, selectedProduct.productId, renderContext);
        }
      }

      if (!ad) {
        res.status(404).json({
          success: false,
          error: 'Unable to render ad. Campaign or product not found.',
        });
        return;
      }

      // Record metrics
      recordAdRendered(campaignId);
      recordImpression(campaignId);

      logger.debug('Ad rendered', { campaignId, adId: ad.adId });

      res.json({
        success: true,
        data: ad,
      });
    } catch (error) {
      logger.error('Render ad error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({
        success: false,
        error: 'Failed to render ad',
      });
    }
  }
);

/**
 * POST /api/dpa/render/batch
 * Render multiple ads in batch
 */
router.post(
  '/render/batch',
  optionalAuth,
  validateBody(batchRenderRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const { campaignId, productIds, count, context } = req.body;

      const request: BatchRenderRequest = {
        campaignId,
        productIds,
        count,
        context: {
          ...context,
          userId: context?.userId || req.user?.userId,
          sessionId: context?.sessionId,
        },
      };

      const result = await rendererService.renderBatch(request);

      // Record metrics for each ad
      for (const ad of result.ads) {
        recordAdRendered(campaignId);
        recordImpression(campaignId);
      }

      logger.info('Batch ads rendered', {
        campaignId,
        count: result.totalRendered,
        errors: result.errors.length,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Batch render error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({
        success: false,
        error: 'Failed to render batch ads',
      });
    }
  }
);

/**
 * GET /api/dpa/render/personalized
 * Get personalized products for a user
 */
router.get(
  '/render/personalized',
  optionalAuth,
  async (req: Request, res: Response) => {
    try {
      const { campaignId, userId, limit } = req.query as any;

      if (!campaignId) {
        res.status(400).json({
          success: false,
          error: 'campaignId is required',
        });
        return;
      }

      const context: RenderContext = {
        userId: userId || req.user?.userId,
        browsingHistory: req.headers['x-browsing-history']
          ? (req.headers['x-browsing-history'] as string).split(',')
          : undefined,
        cartItems: req.headers['x-cart-items']
          ? (req.headers['x-cart-items'] as string).split(',')
          : undefined,
      };

      const products = await rendererService.getPersonalizedProducts(
        campaignId,
        context,
        parseInt(limit) || 10
      );

      res.json({
        success: true,
        data: {
          products,
          count: products.length,
        },
      });
    } catch (error) {
      logger.error('Get personalized products error', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      res.status(500).json({
        success: false,
        error: 'Failed to get personalized products',
      });
    }
  }
);

/**
 * POST /api/dpa/render/track/impression
 * Track an ad impression
 */
router.post(
  '/render/track/impression',
  async (req: Request, res: Response) => {
    try {
      const { campaignId, productId, userId } = req.body;

      if (!campaignId) {
        res.status(400).json({
          success: false,
          error: 'campaignId is required',
        });
        return;
      }

      // Record impression
      await campaignService.recordImpression(campaignId);
      recordImpression(campaignId);

      res.json({
        success: true,
        message: 'Impression tracked',
      });
    } catch (error) {
      logger.error('Track impression error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({
        success: false,
        error: 'Failed to track impression',
      });
    }
  }
);

/**
 * POST /api/dpa/render/track/click
 * Track an ad click
 */
router.post(
  '/render/track/click',
  async (req: Request, res: Response) => {
    try {
      const { campaignId, productId, userId } = req.body;

      if (!campaignId) {
        res.status(400).json({
          success: false,
          error: 'campaignId is required',
        });
        return;
      }

      // Record click
      await campaignService.recordClick(campaignId);
      recordImpression(campaignId);

      res.json({
        success: true,
        message: 'Click tracked',
      });
    } catch (error) {
      logger.error('Track click error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({
        success: false,
        error: 'Failed to track click',
      });
    }
  }
);

/**
 * POST /api/dpa/render/track/conversion
 * Track a conversion
 */
router.post(
  '/render/track/conversion',
  async (req: Request, res: Response) => {
    try {
      const { campaignId, revenue, orderId } = req.body;

      if (!campaignId) {
        res.status(400).json({
          success: false,
          error: 'campaignId is required',
        });
        return;
      }

      if (typeof revenue !== 'number' || revenue < 0) {
        res.status(400).json({
          success: false,
          error: 'Valid revenue value is required',
        });
        return;
      }

      // Record conversion
      await campaignService.recordConversion(campaignId, revenue);

      logger.info('Conversion tracked', { campaignId, revenue, orderId });

      res.json({
        success: true,
        message: 'Conversion tracked',
      });
    } catch (error) {
      logger.error('Track conversion error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({
        success: false,
        error: 'Failed to track conversion',
      });
    }
  }
);

export default router;