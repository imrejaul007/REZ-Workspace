import { Router, Response } from 'express';
import { ZodError } from 'zod';
import { sponsoredProductService } from '../services';
import { authenticate, authorizeMerchant, asyncHandler, AppError } from '../middleware';
import {
  CreateSponsoredProductSchema,
  UpdateSponsoredProductSchema,
  PlaceBidSchema,
  SearchProductsSchema,
  AuthenticatedRequest,
} from '../types';
import { recordBid, recordSearchLatency } from '../middleware/metrics';

const router = Router();

/**
 * POST /api/sponsored/products
 * Add a product to sponsored listings
 */
router.post(
  '/products',
  authenticate,
  authorizeMerchant,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dto = CreateSponsoredProductSchema.parse(req.body);
      const merchantId = req.user!.merchantId;

      const product = await sponsoredProductService.create(dto, merchantId);

      res.status(201).json({
        success: true,
        data: product,
        message: 'Sponsored product created successfully',
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        error.errors.forEach((e) => {
          const path = e.path.join('.');
          if (!errors[path]) errors[path] = [];
          errors[path].push(e.message);
        });
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
      }
      throw error;
    }
  })
);

/**
 * GET /api/sponsored/products
 * List all sponsored products for the merchant
 */
router.get(
  '/products',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const merchantId = req.user!.merchantId;
    const { status, campaignId, page, limit } = req.query;

    const result = await sponsoredProductService.listByMerchant(merchantId, {
      status: status as string,
      campaignId: campaignId as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  })
);

/**
 * GET /api/sponsored/products/:id
 * Get a specific sponsored product by ID
 */
router.get(
  '/products/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const merchantId = req.user!.merchantId;

    const product = await sponsoredProductService.getById(id, merchantId);

    if (!product) {
      throw new AppError('Sponsored product not found', 404, 'SPONSORED_NOT_FOUND');
    }

    res.json({
      success: true,
      data: product,
    });
  })
);

/**
 * PUT /api/sponsored/products/:id
 * Update a sponsored product (bid, budget, targeting, status)
 */
router.put(
  '/products/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const dto = UpdateSponsoredProductSchema.parse(req.body);
      const merchantId = req.user!.merchantId;

      const product = await sponsoredProductService.update(id, dto, merchantId);

      res.json({
        success: true,
        data: product,
        message: 'Sponsored product updated successfully',
      });
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
      }
      throw error;
    }
  })
);

/**
 * DELETE /api/sponsored/products/:id
 * Remove a product from sponsored listings
 */
router.delete(
  '/products/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const merchantId = req.user!.merchantId;

    const deleted = await sponsoredProductService.delete(id, merchantId);

    if (!deleted) {
      throw new AppError('Sponsored product not found', 404, 'SPONSORED_NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Sponsored product deleted successfully',
    });
  })
);

/**
 * GET /api/sponsored/products/:id/performance
 * Get performance metrics for a sponsored product
 */
router.get(
  '/products/:id/performance',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const merchantId = req.user!.merchantId;
    const { startDate, endDate, groupBy } = req.query;

    const performance = await sponsoredProductService.getPerformance(id, merchantId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      groupBy: groupBy as 'day' | 'week' | 'month' | undefined,
    });

    res.json({
      success: true,
      data: performance,
    });
  })
);

/**
 * POST /api/sponsored/bid
 * Place a bid for product placement
 */
router.post(
  '/bid',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dto = PlaceBidSchema.parse(req.body);
      const merchantId = req.user!.merchantId;

      const product = await sponsoredProductService.placeBid(dto, merchantId);

      // Record bid metric
      recordBid(dto.amount);

      res.json({
        success: true,
        data: {
          sponsoredId: product.sponsoredId,
          bidAmount: product.bid.amount,
          status: product.status,
        },
        message: 'Bid placed successfully',
      });
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
      }
      throw error;
    }
  })
);

/**
 * GET /api/sponsored/search
 * Search products in the sponsored network
 */
router.get(
  '/search',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const startTime = Date.now();

    try {
      const dto = SearchProductsSchema.parse(req.query);

      const result = await sponsoredProductService.search(dto);

      // Record search latency
      recordSearchLatency('products', Date.now() - startTime);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
      }
      throw error;
    }
  })
);

/**
 * GET /api/sponsored/campaign/:campaignId/products
 * Get all sponsored products for a campaign
 */
router.get(
  '/campaign/:campaignId/products',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { campaignId } = req.params;
    const merchantId = req.user!.merchantId;

    const products = await sponsoredProductService.getByCampaign(campaignId, merchantId);

    res.json({
      success: true,
      data: products,
    });
  })
);

/**
 * GET /api/sponsored/top-performing
 * Get top performing sponsored products
 */
router.get(
  '/top-performing',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    const products = await sponsoredProductService.getTopPerforming(limit);

    res.json({
      success: true,
      data: products,
    });
  })
);

/**
 * POST /api/sponsored/products/:id/auto-bid
 * Trigger auto-bidding for a product
 */
router.post(
  '/products/:id/auto-bid',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const product = await sponsoredProductService.autoBid(id);

    res.json({
      success: true,
      data: {
        sponsoredId: product.sponsoredId,
        newBidAmount: product.bid.amount,
        strategy: product.bid.strategy,
      },
      message: 'Auto-bid executed successfully',
    });
  })
);

export default router;