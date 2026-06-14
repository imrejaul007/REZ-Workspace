import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { shareRateLimiter } from '../middleware/rateLimiter';
import { referralEngine } from '../services/referralEngine';
import { rewardEngine } from '../services/rewardEngine';
import { ambassadorEngine } from '../services/ambassadorEngine';
import { fraudEngine } from '../services/fraudEngine';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const createCodeSchema = z.object({
  type: z.enum(['consumer', 'merchant', 'creator']).default('consumer'),
  isPublic: z.boolean().optional(),
});

const trackReferralSchema = z.object({
  code: z.string().min(6).max(12),
  source: z.string().optional(),
  medium: z.string().optional(),
  ip: z.string().optional(),
  deviceId: z.string().optional(),
  userAgent: z.string().optional(),
});

/**
 * GET /api/consumer/code
 * Get user's referral code
 */
router.get('/api/consumer/code', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const type = (req.query.type as string) || 'consumer';
    const companyId = req.companyId || 'rez';

    const code = await referralEngine.getOrCreateCode(userId, type as 'consumer' | 'merchant' | 'creator', companyId);

    return sendSuccess(res, {
      code: code.code,
      type: code.type,
      url: `https://rez.app/join?ref=${code.code}`,
      totalReferrals: code.totalReferrals,
      qualifiedReferrals: code.qualifiedReferrals,
      lifetimeEarnings: code.lifetimeEarnings,
      tier: code.tier,
    });
  } catch (error) {
    logger.error('[ConsumerRoutes] Error getting code:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * POST /api/consumer/code
 * Create/generate referral code
 */
router.post('/api/consumer/code', requireAuth, shareRateLimiter, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const validation = createCodeSchema.safeParse(req.body);

    if (!validation.success) {
      return sendError(res, 'VALIDATION_ERROR', 400, validation.error.errors);
    }

    const { type, isPublic } = validation.data;
    const companyId = req.companyId || 'rez';

    const code = await referralEngine.generateCode({
      ownerId: userId,
      ownerType: 'user',
      type,
      companyId,
      isPublic: isPublic || false,
    });

    return sendSuccess(res, {
      code: code.code,
      type: code.type,
      url: `https://rez.app/join?ref=${code.code}`,
    }, 201);
  } catch (error) {
    logger.error('[ConsumerRoutes] Error creating code:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * GET /api/consumer/referrals
 * List user's referrals
 */
router.get('/api/consumer/referrals', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const status = req.query.status as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = parseInt(req.query.skip as string) || 0;

    const referrals = await referralEngine.getReferralsByReferrer(userId, {
      status: status as 'pending' | 'clicked' | 'registered' | 'verified' | 'qualified' | 'rewarded' | 'rejected' | 'expired' | undefined,
      limit,
      skip,
    });

    return sendSuccess(res, {
      referrals: referrals.map((r) => ({
        id: r._id,
        status: r.status,
        rewardAmount: r.rewardAmount,
        rewardType: r.rewardType,
        qualifiedAt: r.qualifiedAt,
        rewardedAt: r.rewardedAt,
        createdAt: r.createdAt,
      })),
      pagination: {
        limit,
        skip,
        total: referrals.length,
      },
    });
  } catch (error) {
    logger.error('[ConsumerRoutes] Error listing referrals:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * GET /api/consumer/referrals/:id
 * Get referral detail
 */
router.get('/api/consumer/referrals/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const referralId = req.params.id;
    const userId = req.userId!;

    const referral = await referralEngine.getReferralById(referralId);

    if (!referral) {
      return sendError(res, 'REFERRAL_NOT_FOUND', 404);
    }

    // Verify ownership
    if (referral.referrerId.toString() !== userId) {
      return sendError(res, 'AUTH_UNAUTHORIZED', 403);
    }

    return sendSuccess(res, {
      id: referral._id,
      status: referral.status,
      rewardAmount: referral.rewardAmount,
      rewardType: referral.rewardType,
      riskScore: referral.riskScore,
      riskFlags: referral.riskFlags,
      touchpoints: referral.touchpoints,
      firstTouch: referral.firstTouch,
      lastTouch: referral.lastTouch,
      qualifiedAt: referral.qualifiedAt,
      rewardedAt: referral.rewardedAt,
      createdAt: referral.createdAt,
    });
  } catch (error) {
    logger.error('[ConsumerRoutes] Error getting referral:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * GET /api/consumer/stats
 * Get referral stats
 */
router.get('/api/consumer/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const stats = await referralEngine.getReferralStats(userId);
    const rewardsSummary = await rewardEngine.getPendingRewardsSummary(userId);
    const ambassadorInfo = await ambassadorEngine.getAmbassadorInfo(userId);

    return sendSuccess(res, {
      ...stats,
      wallet: rewardsSummary,
      ambassador: ambassadorInfo,
    });
  } catch (error) {
    logger.error('[ConsumerRoutes] Error getting stats:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * GET /api/consumer/leaderboard
 * Get top referrers leaderboard
 */
router.get('/api/consumer/leaderboard', requireAuth, async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as string) || 'consumer';
    const companyId = req.companyId || 'rez';
    const limit = parseInt(req.query.limit as string) || 10;

    const leaderboard = await referralEngine.getLeaderboard(
      type as 'consumer' | 'merchant' | 'creator',
      companyId,
      limit
    );

    return sendSuccess(res, {
      leaderboard: leaderboard.map((entry, index) => ({
        rank: index + 1,
        ownerId: entry.ownerId,
        code: entry.code,
        totalReferrals: entry.totalReferrals,
        qualifiedReferrals: entry.qualifiedReferrals,
        lifetimeEarnings: entry.lifetimeEarnings,
        tier: entry.tier,
      })),
    });
  } catch (error) {
    logger.error('[ConsumerRoutes] Error getting leaderboard:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * GET /api/consumer/ambassador
 * Get ambassador tier and benefits
 */
router.get('/api/consumer/ambassador', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const ambassadorInfo = await ambassadorEngine.getAmbassadorInfo(userId);

    if (!ambassadorInfo) {
      return sendSuccess(res, {
        currentTier: 'bronze',
        nextTier: 'silver',
        referralsToNextTier: 26,
        benefits: ['Basic referral tracking', 'Standard rewards'],
        bonusMultiplier: 1.0,
        totalReferrals: 0,
        qualifiedReferrals: 0,
      });
    }

    return sendSuccess(res, ambassadorInfo);
  } catch (error) {
    logger.error('[ConsumerRoutes] Error getting ambassador info:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * POST /api/consumer/refer
 * Track referral (link click)
 */
router.post('/api/consumer/refer', shareRateLimiter, async (req: Request, res: Response) => {
  try {
    const validation = trackReferralSchema.safeParse(req.body);

    if (!validation.success) {
      return sendError(res, 'VALIDATION_ERROR', 400, validation.error.errors);
    }

    const { code, source, medium, ip, deviceId, userAgent } = validation.data;

    const referral = await referralEngine.trackTouchpoint({
      code,
      touchpoint: {
        source: source || 'link',
        medium: medium || 'click',
        ip,
        deviceId,
        userAgent,
      },
    });

    return sendSuccess(res, {
      tracked: !!referral,
      code,
    });
  } catch (error) {
    logger.error('[ConsumerRoutes] Error tracking referral:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * POST /api/consumer/register
 * Register new referral (on signup)
 */
router.post('/api/consumer/register', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { code, refereeId } = req.body;

    if (!code) {
      return sendError(res, 'VALIDATION_ERROR', 400, 'Referral code is required');
    }

    // Get referral code to find referrer
    const referralCode = await referralEngine.getCodeByCode(code);
    if (!referralCode) {
      return sendError(res, 'REFERRAL_INVALID', 400);
    }

    // Run fraud check
    const fraudResult = await fraudEngine.runFraudChecks({
      referrerId: referralCode.ownerId.toString(),
      refereeId: refereeId || userId,
      referralCode: code,
      ip: req.ip,
      deviceId: req.headers['x-device-id'] as string,
      timestamp: new Date(),
    });

    if (fraudResult.recommendation === 'block') {
      return sendError(res, 'FRAUD_BLOCKED', 403, { flags: fraudResult.flags });
    }

    // Register referral
    const referral = await referralEngine.registerReferral({
      referrerId: referralCode.ownerId.toString(),
      refereeId: refereeId || userId,
      code,
      type: 'consumer',
    });

    if (!referral) {
      return sendError(res, 'REFERRAL_INVALID', 400);
    }

    // Record fingerprint
    await fraudEngine.recordFingerprint({
      ip: req.ip,
      deviceId: req.headers['x-device-id'] as string,
      refereeId: refereeId || userId,
    });

    return sendSuccess(res, {
      registered: true,
      referralId: referral._id,
      status: referral.status,
    }, 201);
  } catch (error) {
    logger.error('[ConsumerRoutes] Error registering referral:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

export default router;
