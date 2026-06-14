import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { RedemptionService } from '../services/RedemptionService';
import { TierService, TIER_BENEFITS } from '../services/TierService';
import { ExpiryService } from '../services/ExpiryService';
import type Redis from 'ioredis';

const router = Router();

// Validation schemas
const redeemPointsSchema = z.object({
  customerId: z.string().min(1),
  programId: z.string().min(1),
  restaurantId: z.string().min(1),
  points: z.number().positive(),
  rewardType: z.enum(['FREE_DISH', 'DISCOUNT', 'CASHBACK', 'VIP_ACCESS']),
  orderId: z.string().optional(),
});

const useRedemptionSchema = z.object({
  redemptionId: z.string().min(1),
  orderId: z.string().min(1),
});

const cancelRedemptionSchema = z.object({
  redemptionId: z.string().min(1),
});

const redemptionHistorySchema = z.object({
  customerId: z.string().min(1),
  programId: z.string().min(1),
  limit: z.string().transform(Number).optional(),
  offset: z.string().transform(Number).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED', 'CANCELLED']).optional(),
});

// Initialize services
const getServices = (redis: Redis) => ({
  redemptionService: new RedemptionService(redis),
  tierService: new TierService(),
  expiryService: new ExpiryService(),
});

// Get all tiers
router.get('/tiers', async (req: Request, res: Response) => {
  try {
    const { tierService } = getServices(req.app.locals.redis);
    const tiers = tierService.getAllTiers();

    res.json({ success: true, data: tiers });
  } catch (error) {
    console.error('Error getting tiers:', error);
    res.status(500).json({ success: false, error: 'Failed to get tiers' });
  }
});

// Get tier benefits
router.get('/tiers/:tier', async (req: Request, res: Response) => {
  try {
    const { tierService } = getServices(req.app.locals.redis);
    const { tier } = req.params;

    if (!['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].includes(tier)) {
      return res.status(400).json({ success: false, error: 'Invalid tier' });
    }

    const benefits = tierService.getTierBenefits(tier as unknown);

    res.json({ success: true, data: benefits });
  } catch (error) {
    console.error('Error getting tier benefits:', error);
    res.status(500).json({ success: false, error: 'Failed to get tier benefits' });
  }
});

// Get customer tier summary
router.get('/tiers/customer/:customerId/:programId', async (req: Request, res: Response) => {
  try {
    const { tierService } = getServices(req.app.locals.redis);

    const { customerId, programId } = req.params;
    const summary = await tierService.getCustomerTierSummary(customerId, programId);

    if (!summary) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error getting customer tier summary:', error);
    res.status(500).json({ success: false, error: 'Failed to get customer tier summary' });
  }
});

// Get available rewards
router.get('/available/:customerId/:programId', async (req: Request, res: Response) => {
  try {
    const redis = req.app.locals.redis;
    const { redemptionService } = getServices(redis);

    const { customerId, programId } = req.params;
    const { restaurantId } = req.query;

    const rewards = await redemptionService.getAvailableRewards(
      customerId,
      programId,
      (restaurantId as string) || ''
    );

    res.json({ success: true, data: rewards });
  } catch (error) {
    console.error('Error getting available rewards:', error);
    res.status(500).json({ success: false, error: 'Failed to get available rewards' });
  }
});

// Redeem points for reward
router.post('/redeem', async (req: Request, res: Response) => {
  try {
    const redis = req.app.locals.redis;
    const { redemptionService } = getServices(redis);

    const validated = redeemPointsSchema.parse(req.body);
    const result = await redemptionService.redeemPoints(validated);

    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    console.error('Error redeeming points:', error);
    res.status(500).json({ success: false, error: 'Failed to redeem points' });
  }
});

// Get redemption history
router.get('/history', async (req: Request, res: Response) => {
  try {
    const redis = req.app.locals.redis;
    const { redemptionService } = getServices(redis);

    const { customerId, programId, limit, offset, status } = redemptionHistorySchema.parse(req.query);
    const result = await redemptionService.getRedemptionHistory(customerId, programId, {
      limit: limit || 20,
      offset: offset || 0,
      status,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    console.error('Error getting redemption history:', error);
    res.status(500).json({ success: false, error: 'Failed to get redemption history' });
  }
});

// Get active redemptions
router.get('/active/:customerId', async (req: Request, res: Response) => {
  try {
    const redis = req.app.locals.redis;
    const { redemptionService } = getServices(redis);

    const { customerId } = req.params;
    const { restaurantId } = req.query;

    const redemptions = await redemptionService.getActiveRedemptions(
      customerId,
      restaurantId as string | undefined
    );

    res.json({ success: true, data: redemptions });
  } catch (error) {
    console.error('Error getting active redemptions:', error);
    res.status(500).json({ success: false, error: 'Failed to get active redemptions' });
  }
});

// Use a redemption
router.post('/use', async (req: Request, res: Response) => {
  try {
    const redis = req.app.locals.redis;
    const { redemptionService } = getServices(redis);

    const { redemptionId, orderId } = useRedemptionSchema.parse(req.body);
    const result = await redemptionService.useRedemption(redemptionId, orderId);

    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    console.error('Error using redemption:', error);
    res.status(500).json({ success: false, error: 'Failed to use redemption' });
  }
});

// Cancel a redemption
router.post('/cancel', async (req: Request, res: Response) => {
  try {
    const redis = req.app.locals.redis;
    const { redemptionService } = getServices(redis);

    const { redemptionId } = cancelRedemptionSchema.parse(req.body);
    const result = await redemptionService.cancelRedemption(redemptionId);

    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    console.error('Error cancelling redemption:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel redemption' });
  }
});

// Get expiring points
router.get('/expiring/:customerId', async (req: Request, res: Response) => {
  try {
    const redis = req.app.locals.redis;
    const { expiryService } = getServices(redis);

    const { customerId } = req.params;
    const { days } = req.query;

    const result = await expiryService.getExpiringPoints(
      customerId,
      days ? parseInt(days as string, 10) : 30
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error getting expiring points:', error);
    res.status(500).json({ success: false, error: 'Failed to get expiring points' });
  }
});

// Preview expiry
router.get('/expiry-preview/:customerId', async (req: Request, res: Response) => {
  try {
    const redis = req.app.locals.redis;
    const { expiryService } = getServices(redis);

    const { customerId } = req.params;
    const result = await expiryService.previewExpiry(customerId);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error previewing expiry:', error);
    res.status(500).json({ success: false, error: 'Failed to preview expiry' });
  }
});

// Get offer eligibility
router.get('/eligibility/:customerId/:programId', async (req: Request, res: Response) => {
  try {
    const { tierService } = getServices(req.app.locals.redis);

    const { customerId, programId } = req.params;
    const eligibility = await tierService.getEligibleOffers(customerId, programId);

    if (!eligibility) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    res.json({ success: true, data: eligibility });
  } catch (error) {
    console.error('Error getting eligibility:', error);
    res.status(500).json({ success: false, error: 'Failed to get eligibility' });
  }
});

export default router;
