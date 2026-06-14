import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { loyaltyService } from '../services/loyalty.service';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const enrollSchema = z.object({
  customerId: z.string().uuid(),
});

const earnPointsSchema = z.object({
  customerId: z.string().uuid(),
  amount: z.number().positive(),
  orderId: z.string().optional(),
});

const redeemSchema = z.object({
  customerId: z.string().uuid(),
  rewardId: z.string().uuid(),
  orderId: z.string().optional(),
});

/**
 * GET /api/loyalty/program
 * Get loyalty program details
 */
router.get('/program', async (_req: Request, res: Response) => {
  try {
    const program = await loyaltyService.getOrCreateDefaultProgram();
    res.json({ success: true, data: program });
  } catch (error) {
    logger.error('Error fetching program:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/loyalty/enroll
 * Enroll customer in loyalty program
 */
router.post('/enroll', async (req: Request, res: Response) => {
  try {
    const { customerId } = enrollSchema.parse(req.body);
    const loyalty = await loyaltyService.enrollCustomer(customerId);

    res.status(201).json({ success: true, data: loyalty });
  } catch (error) {
    logger.error('Error enrolling customer:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * GET /api/loyalty/customer/:customerId
 * Get customer loyalty info
 */
router.get('/customer/:customerId', async (req: Request, res: Response) => {
  try {
    const loyalty = await loyaltyService.getCustomerLoyalty(req.params.customerId);

    if (!loyalty) {
      res.status(404).json({ success: false, error: 'Customer not found in loyalty program' });
      return;
    }

    res.json({ success: true, data: loyalty });
  } catch (error) {
    logger.error('Error fetching customer loyalty:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/loyalty/earn
 * Earn points for purchase
 */
router.post('/earn', async (req: Request, res: Response) => {
  try {
    const { customerId, amount, orderId } = earnPointsSchema.parse(req.body);
    const loyalty = await loyaltyService.earnPoints(customerId, amount, orderId);

    res.json({ success: true, data: loyalty });
  } catch (error) {
    logger.error('Error earning points:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * POST /api/loyalty/redeem
 * Redeem points for reward
 */
router.post('/redeem', async (req: Request, res: Response) => {
  try {
    const { customerId, rewardId, orderId } = redeemSchema.parse(req.body);
    const result = await loyaltyService.redeemPoints(customerId, rewardId, orderId);

    if (!result.success) {
      res.status(400).json({ success: false, error: result.message });
      return;
    }

    res.json({ success: true, data: result.loyalty, message: result.message });
  } catch (error) {
    logger.error('Error redeeming points:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * GET /api/loyalty/rewards
 * Get available rewards
 */
router.get('/rewards', async (req: Request, res: Response) => {
  try {
    const rewards = await loyaltyService.getAvailableRewards();
    res.json({ success: true, data: rewards });
  } catch (error) {
    logger.error('Error fetching rewards:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/loyalty/customer/:customerId/history
 * Get points history
 */
router.get('/customer/:customerId/history', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const history = await loyaltyService.getPointsHistory(req.params.customerId, limit);
    res.json({ success: true, data: history });
  } catch (error) {
    logger.error('Error fetching history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/loyalty/customer/:customerId/birthday
 * Claim birthday bonus
 */
router.post('/customer/:customerId/birthday', async (req: Request, res: Response) => {
  try {
    const loyalty = await loyaltyService.claimBirthdayBonus(req.params.customerId);

    if (!loyalty) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    res.json({ success: true, data: loyalty });
  } catch (error) {
    logger.error('Error claiming birthday bonus:', error);
    if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * GET /api/loyalty/calculate
 * Calculate points value
 */
router.get('/calculate', async (req: Request, res: Response) => {
  try {
    const points = parseInt(req.query.points as string, 10);
    if (isNaN(points) || points < 0) {
      res.status(400).json({ success: false, error: 'Invalid points value' });
      return;
    }

    const value = await loyaltyService.calculatePointsValue(points);
    res.json({ success: true, data: { points, value } });
  } catch (error) {
    logger.error('Error calculating value:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
