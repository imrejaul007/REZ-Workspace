/**
 * Feed Routes
 * API endpoints for product feed management
 */

import { Router, Request, Response } from 'express';
import { feedService } from '../services';
import { authenticate, validateBody, validateQuery, validateParams, recordFeedCreated } from '../middleware';
import { feedUploadSchema, listFeedsQuerySchema, idParamSchema } from '../utils/validation';
import type { FeedUploadRequest } from '../types';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/dpa/feed
 * Upload a new product feed
 */
router.post(
  '/feed',
  authenticate,
  validateBody(feedUploadSchema),
  async (req: Request, res: Response) => {
    try {
      const data: FeedUploadRequest = req.body;

      // Check for existing feed with same name for this merchant
      const existingFeeds = await feedService.listFeeds({
        merchantId: data.merchantId,
        limit: 1,
      });

      if (existingFeeds.total >= 50) {
        res.status(400).json({
          success: false,
          error: 'Maximum number of feeds (50) reached for this merchant',
        });
        return;
      }

      const feed = await feedService.createFeed(data);

      // Record metrics
      recordFeedCreated();

      logger.info('Feed created via API', { feedId: feed.feedId, merchantId: data.merchantId });

      res.status(201).json({
        success: true,
        data: {
          feedId: feed.feedId,
          name: feed.name,
          productCount: feed.stats.totalProducts,
          activeProducts: feed.stats.activeProducts,
          status: feed.status,
          createdAt: feed.createdAt,
        },
      });
    } catch (error) {
      logger.error('Create feed error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({
        success: false,
        error: 'Failed to create feed',
      });
    }
  }
);

/**
 * GET /api/dpa/feeds
 * List all product feeds with pagination
 */
router.get(
  '/feeds',
  authenticate,
  validateQuery(listFeedsQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { merchantId, status, page, limit, sortBy, sortOrder } = req.query as any;

      const result = await feedService.listFeeds({
        merchantId,
        status,
        page,
        limit,
        sortBy,
        sortOrder,
      });

      res.json({
        success: true,
        data: result.feeds.map(feed => ({
          feedId: feed.feedId,
          name: feed.name,
          merchantId: feed.merchantId,
          source: feed.source,
          stats: feed.stats,
          status: feed.status,
          createdAt: feed.createdAt,
          updatedAt: feed.updatedAt,
        })),
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error) {
      logger.error('List feeds error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({
        success: false,
        error: 'Failed to list feeds',
      });
    }
  }
);

/**
 * GET /api/dpa/feeds/:id
 * Get a specific feed by ID
 */
router.get(
  '/feeds/:id',
  authenticate,
  validateParams(idParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const feed = await feedService.getFeed(id);

      if (!feed) {
        res.status(404).json({
          success: false,
          error: 'Feed not found',
        });
        return;
      }

      res.json({
        success: true,
        data: feed,
      });
    } catch (error) {
      logger.error('Get feed error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({
        success: false,
        error: 'Failed to get feed',
      });
    }
  }
);

/**
 * PUT /api/dpa/feeds/:id
 * Update a feed (add/update products)
 */
router.put(
  '/feeds/:id',
  authenticate,
  validateParams(idParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { products } = req.body;

      if (!products || !Array.isArray(products)) {
        res.status(400).json({
          success: false,
          error: 'products array is required',
        });
        return;
      }

      const feed = await feedService.updateFeed(id, products);

      if (!feed) {
        res.status(404).json({
          success: false,
          error: 'Feed not found',
        });
        return;
      }

      logger.info('Feed updated via API', { feedId: id, productCount: products.length });

      res.json({
        success: true,
        data: {
          feedId: feed.feedId,
          totalProducts: feed.stats.totalProducts,
          activeProducts: feed.stats.activeProducts,
          lastSynced: feed.stats.lastSynced,
        },
      });
    } catch (error) {
      logger.error('Update feed error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({
        success: false,
        error: 'Failed to update feed',
      });
    }
  }
);

/**
 * DELETE /api/dpa/feeds/:id
 * Delete a feed
 */
router.delete(
  '/feeds/:id',
  authenticate,
  validateParams(idParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await feedService.deleteFeed(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Feed not found',
        });
        return;
      }

      logger.info('Feed deleted via API', { feedId: id });

      res.json({
        success: true,
        message: 'Feed deleted successfully',
      });
    } catch (error) {
      logger.error('Delete feed error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({
        success: false,
        error: 'Failed to delete feed',
      });
    }
  }
);

/**
 * POST /api/dpa/feeds/:id/sync
 * Sync a feed from external source
 */
router.post(
  '/feeds/:id/sync',
  authenticate,
  validateParams(idParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await feedService.syncFeed(id);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: 'Feed sync failed',
          details: result.errors,
        });
        return;
      }

      logger.info('Feed synced via API', { feedId: id, productsUpdated: result.productsUpdated });

      res.json({
        success: true,
        data: {
          productsUpdated: result.productsUpdated,
          lastSynced: new Date(),
        },
      });
    } catch (error) {
      logger.error('Sync feed error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({
        success: false,
        error: 'Failed to sync feed',
      });
    }
  }
);

/**
 * POST /api/dpa/feeds/:id/pause
 * Pause a feed
 */
router.post(
  '/feeds/:id/pause',
  authenticate,
  validateParams(idParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const feed = await feedService.pauseFeed(id);

      if (!feed) {
        res.status(404).json({
          success: false,
          error: 'Feed not found',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          feedId: feed.feedId,
          status: feed.status,
        },
      });
    } catch (error) {
      logger.error('Pause feed error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({
        success: false,
        error: 'Failed to pause feed',
      });
    }
  }
);

/**
 * POST /api/dpa/feeds/:id/activate
 * Activate a paused feed
 */
router.post(
  '/feeds/:id/activate',
  authenticate,
  validateParams(idParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const feed = await feedService.activateFeed(id);

      if (!feed) {
        res.status(404).json({
          success: false,
          error: 'Feed not found',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          feedId: feed.feedId,
          status: feed.status,
        },
      });
    } catch (error) {
      logger.error('Activate feed error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({
        success: false,
        error: 'Failed to activate feed',
      });
    }
  }
);

/**
 * GET /api/dpa/feeds/:id/products
 * Get products from a feed with filtering
 */
router.get(
  '/feeds/:id/products',
  authenticate,
  validateParams(idParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { categories, minPrice, maxPrice, inStockOnly, brands } = req.query as any;

      const filters: any = {};
      if (categories) filters.categories = categories.split(',');
      if (minPrice) filters.minPrice = parseFloat(minPrice);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
      if (inStockOnly === 'true') filters.inStockOnly = true;
      if (brands) filters.brands = brands.split(',');

      const products = await feedService.getProducts(id, filters);

      res.json({
        success: true,
        data: {
          products,
          count: products.length,
        },
      });
    } catch (error) {
      logger.error('Get products error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({
        success: false,
        error: 'Failed to get products',
      });
    }
  }
);

export default router;