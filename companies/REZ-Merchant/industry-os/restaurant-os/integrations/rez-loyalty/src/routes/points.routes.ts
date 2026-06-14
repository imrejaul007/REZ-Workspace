import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PointsService } from '../services/PointsService';
import { BirthdayService } from '../services/BirthdayService';
import { ReferralService } from '../services/ReferralService';
import type Redis from 'ioredis';

const router = Router();

// Validation schemas
const earnPointsSchema = z.object({
  customerId: z.string().min(1),
  programId: z.string().min(1),
  orderId: z.string().min(1),
  restaurantId: z.string().min(1),
  orderAmount: z.number().positive(),
});

const birthdayBonusSchema = z.object({
  customerId: z.string().min(1),
  programId: z.string().min(1),
  birthday: z.string().datetime(),
});

const referralSchema = z.object({
  referrerId: z.string().min(1),
  referredId: z.string().min(1),
  programId: z.string().min(1),
});

const transactionHistorySchema = z.object({
  customerId: z.string().min(1),
  programId: z.string().min(1),
  limit: z.string().transform(Number).optional(),
  offset: z.string().transform(Number).optional(),
  type: z.string().optional(),
});

// Initialize services
const getServices = (redis: Redis) => ({
  pointsService: new PointsService(redis),
  birthdayService: new BirthdayService(redis),
  referralService: new ReferralService(redis),
});

// Earn points from purchase
router.post('/earn', async (req: Request, res: Response) => {
  try {
    const redis = req.app.locals.redis;
    const { pointsService } = getServices(redis);

    const validated = earnPointsSchema.parse(req.body);
    const result = await pointsService.earnPoints(validated);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    console.error('Error earning points:', error);
    res.status(500).json({ success: false, error: 'Failed to earn points' });
  }
});

// Get points summary
router.get('/summary/:customerId/:programId', async (req: Request, res: Response) => {
  try {
    const redis = req.app.locals.redis;
    const { pointsService } = getServices(redis);

    const { customerId, programId } = req.params;
    const summary = await pointsService.getPointsSummary(customerId, programId);

    if (!summary) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error getting points summary:', error);
    res.status(500).json({ success: false, error: 'Failed to get points summary' });
  }
});

// Get transaction history
router.get('/history', async (req: Request, res: Response) => {
  try {
    const redis = req.app.locals.redis;
    const { pointsService } = getServices(redis);

    const { customerId, programId, limit, offset, type } = transactionHistorySchema.parse(req.query);
    const result = await pointsService.getTransactionHistory(customerId, programId, {
      limit: limit || 20,
      offset: offset || 0,
      type,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    console.error('Error getting transaction history:', error);
    res.status(500).json({ success: false, error: 'Failed to get transaction history' });
  }
});

// Get tier progress
router.get('/progress/:customerId/:programId', async (req: Request, res: Response) => {
  try {
    const redis = req.app.locals.redis;
    const { pointsService } = getServices(redis);

    const { customerId, programId } = req.params;
    const progress = await pointsService.getTierProgress(customerId, programId);

    if (!progress) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    res.json({ success: true, data: progress });
  } catch (error) {
    console.error('Error getting tier progress:', error);
    res.status(500).json({ success: false, error: 'Failed to get tier progress' });
  }
});

// Get restaurant pooled points
router.get('/pool/:customerId/:programId', async (req: Request, res: Response) => {
  try {
    const redis = req.app.locals.redis;
    const { pointsService } = getServices(redis);

    const { customerId, programId } = req.params;
    const pool = await pointsService.getRestaurantPooledPoints(customerId, programId);

    if (!pool) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    // Convert Map to object for JSON response
    const poolObject: Record<string, number> = {};
    pool.forEach((value, key) => {
      poolObject[key] = value;
    });

    res.json({ success: true, data: poolObject });
  } catch (error) {
    console.error('Error getting pooled points:', error);
    res.status(500).json({ success: false, error: 'Failed to get pooled points' });
  }
});

// Check birthday bonus
router.get('/birthday/check/:customerId', async (req: Request, res: Response) => {
  try {
    const redis = req.app.locals.redis;
    const { birthdayService } = getServices(redis);

    const { customerId } = req.params;
    const { birthday } = req.query;

    if (!birthday || typeof birthday !== 'string') {
      return res.status(400).json({ success: false, error: 'Birthday is required' });
    }

    const result = await birthdayService.isBirthdayBonusAvailable(customerId, new Date(birthday));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error checking birthday bonus:', error);
    res.status(500).json({ success: false, error: 'Failed to check birthday bonus' });
  }
});

// Claim birthday bonus
router.post('/birthday/claim', async (req: Request, res: Response) => {
  try {
    const redis = req.app.locals.redis;
    const { birthdayService } = getServices(redis);

    const { customerId, programId, birthday } = birthdayBonusSchema.parse(req.body);
    const result = await birthdayService.checkAndClaimBirthdayBonus(customerId, programId, new Date(birthday));

    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    console.error('Error claiming birthday bonus:', error);
    res.status(500).json({ success: false, error: 'Failed to claim birthday bonus' });
  }
});

// Create referral
router.post('/referral', async (req: Request, res: Response) => {
  try {
    const redis = req.app.locals.redis;
    const { referralService } = getServices(redis);

    const { referrerId, referredId, programId } = referralSchema.parse(req.body);
    const result = await referralService.createReferral(referrerId, referredId, programId);

    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    console.error('Error creating referral:', error);
    res.status(500).json({ success: false, error: 'Failed to create referral' });
  }
});

// Get referral stats
router.get('/referral/stats/:customerId/:programId', async (req: Request, res: Response) => {
  try {
    const redis = req.app.locals.redis;
    const { referralService } = getServices(redis);

    const { customerId, programId } = req.params;
    const stats = await referralService.getReferralStats(customerId, programId);

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting referral stats:', error);
    res.status(500).json({ success: false, error: 'Failed to get referral stats' });
  }
});

// Get referral code
router.get('/referral/code/:customerId', async (req: Request, res: Response) => {
  try {
    const redis = req.app.locals.redis;
    const { referralService } = getServices(redis);

    const { customerId } = req.params;
    const code = referralService.generateReferralCode(customerId);

    res.json({ success: true, data: { code } });
  } catch (error) {
    console.error('Error generating referral code:', error);
    res.status(500).json({ success: false, error: 'Failed to generate referral code' });
  }
});

// Check referral bonus eligibility
router.post('/referral/check-spend', async (req: Request, res: Response) => {
  try {
    const redis = req.app.locals.redis;
    const { referralService } = getServices(redis);

    const { referredId, programId, totalSpendAmount } = req.body;

    if (!referredId || !programId || totalSpendAmount === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const result = await referralService.checkAndAwardReferrerBonus(
      referredId,
      programId,
      totalSpendAmount
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error checking referral spend:', error);
    res.status(500).json({ success: false, error: 'Failed to check referral spend' });
  }
});

export default router;
