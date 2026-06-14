import { Router, Request, Response } from 'express';
import { sponsoredProductService } from '../services/index.js';
import {
  authMiddleware,
  validateBody,
  asyncHandler,
} from '../middleware/index.js';
import {
  SponsoredProductSchema,
  SponsoredProductRequest,
  JwtPayload,
} from '../types/index.js';
import { z } from 'zod';

const router = Router();

// Create sponsored product campaign
router.post(
  '/',
  authMiddleware,
  validateBody(SponsoredProductSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtPayload }).user;
    const data = req.body as SponsoredProductRequest;

    const campaign = await sponsoredProductService.createSponsoredProduct(
      user.merchantId,
      data
    );

    res.status(201).json({
      success: true,
      data: campaign,
      message: 'Sponsored product campaign created successfully',
    });
  })
);

// Get all sponsored products for merchant
router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtPayload }).user;

    const products = await sponsoredProductService.getSponsoredProducts(
      user.merchantId
    );

    res.json({
      success: true,
      data: products,
    });
  })
);

// Update bid amount
router.patch(
  '/:campaignId/bid',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtPayload }).user;
    const { campaignId } = req.params;
    const { productId, bidAmount } = req.body as {
      productId: string;
      bidAmount: number;
    };

    if (!productId || bidAmount === undefined) {
      res.status(400).json({
        success: false,
        error: 'productId and bidAmount are required',
      });
      return;
    }

    const campaign = await sponsoredProductService.updateBidAmount(
      campaignId,
      productId,
      bidAmount
    );

    if (!campaign) {
      res.status(404).json({
        success: false,
        error: 'Campaign or product not found',
      });
      return;
    }

    res.json({
      success: true,
      data: campaign,
      message: 'Bid amount updated successfully',
    });
  })
);

// Update daily budget
router.patch(
  '/:campaignId/budget',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtPayload }).user;
    const { campaignId } = req.params;
    const { productId, dailyBudget } = req.body as {
      productId: string;
      dailyBudget: number;
    };

    if (!productId || dailyBudget === undefined) {
      res.status(400).json({
        success: false,
        error: 'productId and dailyBudget are required',
      });
      return;
    }

    const campaign = await sponsoredProductService.updateDailyBudget(
      campaignId,
      productId,
      dailyBudget
    );

    if (!campaign) {
      res.status(404).json({
        success: false,
        error: 'Campaign or product not found',
      });
      return;
    }

    res.json({
      success: true,
      data: campaign,
      message: 'Daily budget updated successfully',
    });
  })
);

// Get product performance
router.get(
  '/:campaignId/performance/:productId',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { campaignId, productId } = req.params;

    const performance = await sponsoredProductService.getProductPerformance(
      campaignId,
      productId
    );

    res.json({
      success: true,
      data: performance,
    });
  })
);

// Get bid recommendations
router.get(
  '/:campaignId/recommendations/:productId',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { campaignId, productId } = req.params;

    const recommendations = await sponsoredProductService.getBidRecommendations(
      campaignId,
      productId
    );

    res.json({
      success: true,
      data: recommendations,
    });
  })
);

export default router;