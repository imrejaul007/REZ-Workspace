import { Router, Request, Response } from 'express';
import { inventoryService } from '../services/index.js';
import { authMiddleware, asyncHandler } from '../middleware/index.js';
import { z } from 'zod';

const router = Router();

// Get available inventory
router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { category, minImpressions, page, limit } = req.query as {
      category?: string;
      minImpressions?: string;
      page?: string;
      limit?: string;
    };

    const result = await inventoryService.getAvailableInventory({
      category,
      minImpressions: minImpressions ? parseInt(minImpressions, 10) : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    res.json({
      success: true,
      data: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    });
  })
);

// Get inventory by product ID
router.get(
  '/product/:productId',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;

    const inventory = await inventoryService.getInventoryByProductId(productId);

    if (!inventory) {
      res.status(404).json({
        success: false,
        error: 'Product inventory not found',
      });
      return;
    }

    res.json({
      success: true,
      data: inventory,
    });
  })
);

// Get category performance
router.get(
  '/category/performance',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const performance = await inventoryService.getCategoryPerformance();

    res.json({
      success: true,
      data: performance,
    });
  })
);

// Get recommended placements
router.post(
  '/placements/recommend',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { productId, budget } = req.body as {
      productId: string;
      budget: number;
    };

    if (!productId || !budget) {
      res.status(400).json({
        success: false,
        error: 'productId and budget are required',
      });
      return;
    }

    const recommendations = await inventoryService.getRecommendedPlacements(
      productId,
      budget
    );

    res.json({
      success: true,
      data: recommendations,
    });
  })
);

export default router;