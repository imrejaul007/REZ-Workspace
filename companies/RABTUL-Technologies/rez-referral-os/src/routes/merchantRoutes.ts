import { Router, Request, Response } from 'express';
import { requireMerchantAuth } from '../middleware/merchantAuth';
import { referralEngine } from '../services/referralEngine';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/merchant/referrals
 * List referrals to merchant's store
 */
router.get('/api/merchant/referrals', requireMerchantAuth, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = parseInt(req.query.skip as string) || 0;

    const referrals = await referralEngine.getReferralsByReferrer(merchantId, {
      limit,
      skip,
    });

    return sendSuccess(res, {
      referrals: referrals.map((r) => ({
        id: r._id,
        status: r.status,
        rewardAmount: r.rewardAmount,
        createdAt: r.createdAt,
      })),
      pagination: { limit, skip, total: referrals.length },
    });
  } catch (error) {
    logger.error('[MerchantRoutes] Error listing referrals:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * GET /api/merchant/stats
 * Get referral performance stats
 */
router.get('/api/merchant/stats', requireMerchantAuth, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;

    const stats = await referralEngine.getReferralStats(merchantId);

    return sendSuccess(res, {
      ...stats,
      merchantId,
    });
  } catch (error) {
    logger.error('[MerchantRoutes] Error getting stats:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * GET /api/merchant/leaderboard
 * Get top referrers for merchant
 */
router.get('/api/merchant/leaderboard', requireMerchantAuth, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const limit = parseInt(req.query.limit as string) || 10;

    const leaderboard = await referralEngine.getLeaderboard('merchant', req.companyId || 'rez', limit);

    return sendSuccess(res, {
      leaderboard: leaderboard.map((entry, index) => ({
        rank: index + 1,
        totalReferrals: entry.totalReferrals,
        qualifiedReferrals: entry.qualifiedReferrals,
        lifetimeEarnings: entry.lifetimeEarnings,
      })),
    });
  } catch (error) {
    logger.error('[MerchantRoutes] Error getting leaderboard:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

export default router;
