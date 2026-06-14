import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { referralEngine } from '../services/referralEngine';
import { ambassadorEngine } from '../services/ambassadorEngine';
import { Referral } from '../models';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /overview
 * Referral overview dashboard
 */
router.get('/overview', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const stats = await referralEngine.getReferralStats(userId);
    const ambassadorInfo = await ambassadorEngine.getAmbassadorInfo(userId);

    return sendSuccess(res, {
      overview: {
        totalReferrals: stats.totalReferrals,
        qualifiedReferrals: stats.qualifiedReferrals,
        conversionRate: stats.conversionRate.toFixed(2) + '%',
        lifetimeEarnings: stats.lifetimeEarnings,
        pendingReferrals: stats.pendingReferrals,
        rewardedReferrals: stats.rewardedReferrals,
      },
      ambassador: ambassadorInfo,
    });
  } catch (error) {
    logger.error('[AnalyticsRoutes] Error getting overview:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * GET /funnel
 * Conversion funnel
 */
router.get('/funnel', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const referrals = await Referral.find({
      referrerId: userId,
    });

    const funnel = {
      invited: referrals.length,
      clicked: referrals.filter((r) => r.status !== 'pending').length,
      registered: referrals.filter((r) => ['registered', 'verified', 'qualified', 'rewarded'].includes(r.status)).length,
      verified: referrals.filter((r) => ['verified', 'qualified', 'rewarded'].includes(r.status)).length,
      qualified: referrals.filter((r) => ['qualified', 'rewarded'].includes(r.status)).length,
      rewarded: referrals.filter((r) => r.status === 'rewarded').length,
    };

    const conversionRates = {
      clickRate: funnel.invited > 0 ? ((funnel.clicked / funnel.invited) * 100).toFixed(2) + '%' : '0%',
      registrationRate: funnel.clicked > 0 ? ((funnel.registered / funnel.clicked) * 100).toFixed(2) + '%' : '0%',
      qualificationRate: funnel.registered > 0 ? ((funnel.qualified / funnel.registered) * 100).toFixed(2) + '%' : '0%',
      rewardRate: funnel.qualified > 0 ? ((funnel.rewarded / funnel.qualified) * 100).toFixed(2) + '%' : '0%',
      overallConversion: funnel.invited > 0 ? ((funnel.rewarded / funnel.invited) * 100).toFixed(2) + '%' : '0%',
    };

    return sendSuccess(res, {
      funnel,
      conversionRates,
    });
  } catch (error) {
    logger.error('[AnalyticsRoutes] Error getting funnel:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * GET /performance
 * Referral performance metrics
 */
router.get('/performance', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const stats = await referralEngine.getReferralStats(userId);
    const referrals = await Referral.find({
      referrerId: userId,
    }).sort({ createdAt: -1 }).limit(100);

    // Calculate trends
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentReferrals = referrals.filter((r) => r.createdAt >= thirtyDaysAgo);

    return sendSuccess(res, {
      performance: {
        totalReferrals: stats.totalReferrals,
        qualifiedReferrals: stats.qualifiedReferrals,
        conversionRate: stats.conversionRate,
        averageReward: stats.rewardedReferrals > 0 ? stats.lifetimeEarnings / stats.rewardedReferrals : 0,
        recentActivity: recentReferrals.length,
        trend: recentReferrals.length > (stats.totalReferrals / 3) ? 'increasing' : 'stable',
      },
    });
  } catch (error) {
    logger.error('[AnalyticsRoutes] Error getting performance:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * GET /insights
 * AI-powered insights
 */
router.get('/insights', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const stats = await referralEngine.getReferralStats(userId);

    const insights = [];

    // Low conversion insight
    if (stats.conversionRate < 20) {
      insights.push({
        type: 'warning',
        title: 'Low Conversion Rate',
        description: 'Only ' + stats.conversionRate.toFixed(1) + '% of your referrals are completing signup. Consider following up with referred users.',
        action: 'follow_up',
      });
    }

    // High performance insight
    if (stats.conversionRate > 50) {
      insights.push({
        type: 'success',
        title: 'Excellent Performance',
        description: 'You\'re converting ' + stats.conversionRate.toFixed(1) + '% of referrals. Consider becoming a creator to earn more.',
        action: 'upgrade',
      });
    }

    // No referrals
    if (stats.totalReferrals === 0) {
      insights.push({
        type: 'info',
        title: 'Get Started',
        description: 'Share your referral code with friends to start earning rewards!',
        action: 'share',
      });
    }

    return sendSuccess(res, { insights });
  } catch (error) {
    logger.error('[AnalyticsRoutes] Error getting insights:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

export default router;
