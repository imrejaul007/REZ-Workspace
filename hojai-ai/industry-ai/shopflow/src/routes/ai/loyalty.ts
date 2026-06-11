import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { loyaltyAgent } from '../../services';
import { logger } from '../../utils/logger';
import { validate } from '../../middleware/validate';
import { aiLimiter } from '../../middleware/rateLimit';

const router = Router();

const loyaltyPointsSchema = z.object({
  customerId: z.string(),
});

const earnPointsSchema = z.object({
  customerId: z.string(),
  purchaseAmount: z.number().positive(),
});

const redeemPointsSchema = z.object({
  customerId: z.string(),
  points: z.number().int().positive(),
});

const adjustPointsSchema = z.object({
  customerId: z.string(),
  points: z.number().int(),
  operation: z.enum(['add', 'subtract', 'set']),
});

// POST /api/ai/loyalty/points - Get loyalty info
router.post('/points', aiLimiter, validate(loyaltyPointsSchema), async (req: Request, res: Response) => {
  try {
    const { customerId } = req.body;

    logger.info('Loyalty points info requested', { customerId });

    const result = await loyaltyAgent.getLoyaltyInfo(customerId);

    if (!result) {
      res.status(404).json({
        success: false,
        error: 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Loyalty points info failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get loyalty info',
      code: 'LOYALTY_ERROR',
    });
  }
});

// POST /api/ai/loyalty/earn - Earn points
router.post('/earn', aiLimiter, validate(earnPointsSchema), async (req: Request, res: Response) => {
  try {
    const { customerId, purchaseAmount } = req.body;

    logger.info('Earn points requested', { customerId, purchaseAmount });

    const result = await loyaltyAgent.earnPoints(customerId, purchaseAmount);

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    logger.error('Earn points failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to earn points',
      code: 'POINTS_ERROR',
    });
  }
});

// POST /api/ai/loyalty/redeem - Redeem points
router.post('/redeem', aiLimiter, validate(redeemPointsSchema), async (req: Request, res: Response) => {
  try {
    const { customerId, points } = req.body;

    logger.info('Redeem points requested', { customerId, points });

    const result = await loyaltyAgent.redeemPoints(customerId, points);

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    logger.error('Redeem points failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to redeem points',
      code: 'POINTS_ERROR',
    });
  }
});

// POST /api/ai/loyalty/adjust - Adjust points
router.post('/adjust', aiLimiter, validate(adjustPointsSchema), async (req: Request, res: Response) => {
  try {
    const { customerId, points, operation } = req.body;

    logger.info('Adjust points requested', { customerId, points, operation });

    const result = await loyaltyAgent.adjustPoints(customerId, points, operation);

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    logger.error('Adjust points failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to adjust points',
      code: 'POINTS_ERROR',
    });
  }
});

// GET /api/ai/loyalty/history - Get points history
router.get('/history/:customerId', aiLimiter, async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await loyaltyAgent.getPointsHistory(customerId, limit);

    if (!result) {
      res.status(404).json({
        success: false,
        error: 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Get points history failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get points history',
      code: 'LOYALTY_ERROR',
    });
  }
});

// GET /api/ai/loyalty/stats - Get all tier stats
router.get('/stats', aiLimiter, async (req: Request, res: Response) => {
  try {
    const stats = await loyaltyAgent.getAllTierStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Get tier stats failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get tier stats',
      code: 'LOYALTY_ERROR',
    });
  }
});

export default router;