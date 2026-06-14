import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { referralEngine } from '../services/referralEngine';
import { rewardEngine } from '../services/rewardEngine';
import { ambassadorEngine } from '../services/ambassadorEngine';
import { campaignEngine } from '../services/campaignEngine';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const askQuestionSchema = z.object({
  question: z.string().min(1).max(500),
  context: z.enum(['performance', 'campaigns', 'earnings', 'general']).optional().default('general'),
});

const getInsightsSchema = z.object({
  type: z.enum(['performance', 'optimization', 'campaign', 'ambassador', 'general']).optional().default('general'),
});

// AI-powered insights and recommendations
router.post('/api/ai/ask', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const validation = askQuestionSchema.safeParse(req.body);

    if (!validation.success) {
      return sendError(res, 'VALIDATION_ERROR', 400, validation.error.errors);
    }

    const { question, context } = validation.data;

    // Get user context
    const stats = await referralEngine.getReferralStats(userId);
    const ambassadorInfo = await ambassadorEngine.getAmbassadorInfo(userId);
    const pendingRewards = await rewardEngine.getPendingRewardsSummary(userId);

    // Generate AI response based on question
    const response = await generateAIResponse(question, {
      stats,
      ambassadorInfo,
      pendingRewards,
      context,
    });

    return sendSuccess(res, {
      question,
      response,
      suggestions: generateSuggestions(stats, ambassadorInfo, context),
    });
  } catch (error) {
    logger.error('[AIRoutes] AI ask error:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

// Get performance insights
router.get('/api/ai/insights', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const type = (req.query.type as string) || 'general';

    const stats = await referralEngine.getReferralStats(userId);
    const ambassadorInfo = await ambassadorEngine.getAmbassadorInfo(userId);
    const leaderboard = await referralEngine.getLeaderboard('consumer', req.companyId || 'rez', 100);
    const pendingRewards = await rewardEngine.getPendingRewardsSummary(userId);

    const insights = await generateInsights(type, stats, ambassadorInfo, leaderboard, pendingRewards);

    return sendSuccess(res, insights);
  } catch (error) {
    logger.error('[AIRoutes] Insights error:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

// Get referral tips
router.get('/api/ai/tips', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const stats = await referralEngine.getReferralStats(userId);

    const tips = generateTips(stats);

    return sendSuccess(res, { tips });
  } catch (error) {
    logger.error('[AIRoutes] Tips error:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

// Get campaign recommendations
router.get('/api/ai/campaign-recommendations', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const stats = await referralEngine.getReferralStats(userId);

    const campaigns = await campaignEngine.getActiveCampaigns({ type: 'consumer' });

    const recommendations = campaigns
      .filter(c => c.isActive)
      .slice(0, 5)
      .map(c => ({
        campaignId: c._id,
        name: c.name,
        reason: generateCampaignReason(c, stats),
        potentialEarnings: calculatePotentialEarnings(c, stats),
      }));

    return sendSuccess(res, { recommendations });
  } catch (error) {
    logger.error('[AIRoutes] Campaign recommendations error:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

// Generate AI response based on question
async function generateAIResponse(
  question: string,
  context: {
    stats: Awaited<ReturnType<typeof referralEngine.getReferralStats>>;
    ambassadorInfo: Awaited<ReturnType<typeof ambassadorEngine.getAmbassadorInfo>>;
    pendingRewards: Awaited<ReturnType<typeof rewardEngine.getPendingRewardsSummary>>;
    context: string;
  }
) {
  const { stats, ambassadorInfo, pendingRewards } = context;
  const lowerQuestion = question.toLowerCase();

  // Performance related
  if (lowerQuestion.includes('low') || lowerQuestion.includes('improve') || lowerQuestion.includes('increase')) {
    return generatePerformanceAdvice(stats);
  }

  // Earnings related
  if (lowerQuestion.includes('earn') || lowerQuestion.includes('money') || lowerQuestion.includes('reward')) {
    return generateEarningsAdvice(stats, pendingRewards, ambassadorInfo);
  }

  // Campaign related
  if (lowerQuestion.includes('campaign') || lowerQuestion.includes('promotion')) {
    return generateCampaignAdvice(stats);
  }

  // Ambassador tier related
  if (lowerQuestion.includes('tier') || lowerQuestion.includes('ambassador') || lowerQuestion.includes('level')) {
    return generateAmbassadorAdvice(ambassadorInfo);
  }

  // General help
  return generateGeneralAdvice(stats);
}

function generatePerformanceAdvice(stats: { totalReferrals: number; qualifiedReferrals: number; conversionRate: number }) {
  if (stats.totalReferrals === 0) {
    return `You're just getting started! Share your referral code on WhatsApp, Instagram, or any social media to get your first referrals. Personal messages to friends and family work best for initial traction.`;
  }

  if (stats.conversionRate < 20) {
    return `Your click rate is good (${stats.totalReferrals} visits), but only ${stats.qualifiedReferrals} people completed signup. Try sharing with people more likely to use REZ, and remind them to complete verification after signing up.`;
  }

  if (stats.conversionRate >= 50) {
    return `Excellent performance! You're converting ${stats.conversionRate.toFixed(0)}% of your referrals. Consider becoming a creator to earn commissions on all REZ orders, not just signups.`;
  }

  return `Good progress! You're converting ${stats.conversionRate.toFixed(0)}% of referrals. To improve, try sharing during peak hours (evening 6-9 PM) and personalize your message with why you use REZ.`;
}

function generateEarningsAdvice(
  stats: { lifetimeEarnings: number },
  pendingRewards: { pending: number; lifetime: number },
  ambassadorInfo: { bonusMultiplier: number } | null
) {
  const base = `You've earned ₹${pendingRewards.lifetime} total. `;
  const pending = pendingRewards.pending > 0 ? `${pendingRewards.pending} coins pending approval. ` : '';

  if (ambassadorInfo && ambassadorInfo.bonusMultiplier > 1) {
    return base + pending + `Your ${ambassadorInfo.bonusMultiplier}x ambassador bonus is active. Keep referring to unlock higher tiers and better rewards!`;
  }

  if (pendingRewards.pending === 0 && stats.lifetimeEarnings === 0) {
    return base + `Complete your first referral to start earning. Share your code with 5 friends who shop on REZ regularly.`;
  }

  return base + pending + `Increase referrals to reach ambassador status and earn bonus multipliers up to 1.2x!`;
}

function generateCampaignAdvice(stats: { totalReferrals: number }) {
  if (stats.totalReferrals < 10) {
    return `Focus on building your referral base first. Share your code consistently - even 1-2 shares daily can add up. Join upcoming referral campaigns when available for bonus rewards.`;
  }

  return `Great referral base! Keep an eye on campaigns for bonus multipliers. Merchant campaigns often offer higher rewards for specific categories you already use.`;
}

function generateAmbassadorAdvice(ambassadorInfo: { currentTier: string; referralsToNextTier: number; benefits: string[] } | null) {
  if (!ambassadorInfo) {
    return `You haven't earned ambassador status yet. Reach 26 qualified referrals to become a Silver ambassador and unlock a 1.05x bonus on all rewards!`;
  }

  const tierBenefits = ambassadorInfo.benefits.slice(0, 2).join('. ');
  return `You're ${ambassadorInfo.currentTier}! ${ambassadorInfo.referralsToNextTier} more referrals to the next tier. Benefits: ${tierBenefits}.`;
}

function generateGeneralAdvice(stats: { totalReferrals: number; qualifiedReferrals: number }) {
  if (stats.totalReferrals === 0) {
    return `Welcome to REZ Referrals! Start by sharing your code with friends and family. The best approach: share with 5 people you know will use REZ, and ask them to complete verification after signing up.`;
  }

  return `You have ${stats.totalReferrals} referrals (${stats.qualifiedReferrals} qualified). Keep sharing consistently, and check campaigns for bonus opportunities. Your next milestone: 26 referrals for Silver tier!`;
}

function generateSuggestions(
  stats: { totalReferrals: number; conversionRate: number; qualifiedReferrals: number },
  ambassadorInfo: { referralsToNextTier: number } | null,
  context: string
) {
  const suggestions: Array<{ action: string; reason: string; priority: 'high' | 'medium' | 'low' }> = [];

  if (stats.totalReferrals === 0) {
    suggestions.push({ action: 'Share your code', reason: 'Get your first referral', priority: 'high' });
  }

  if (ambassadorInfo && ambassadorInfo.referralsToNextTier <= 10) {
    suggestions.push({ action: 'Reach next tier', reason: `${ambassadorInfo.referralsToNextTier} more for bonus multiplier`, priority: 'high' });
  }

  if (stats.conversionRate < 30) {
    suggestions.push({ action: 'Improve conversion', reason: 'Follow up with referred users', priority: 'medium' });
  }

  suggestions.push({ action: 'Check campaigns', reason: 'Find bonus opportunities', priority: 'medium' });

  return suggestions;
}

function generateTips(stats: { totalReferrals: number; conversionRate: number }) {
  const tips = [
    'Share your code during evening hours (6-9 PM) for better response',
    'Personalize your referral message - explain why YOU use REZ',
    'Follow up with referred users to help them complete signup',
    'Share on multiple platforms - WhatsApp, Instagram, Twitter',
  ];

  if (stats.conversionRate < 30) {
    tips.push('Many referrals drop off after clicking - remind them to complete verification');
  }

  return tips;
}

async function generateInsights(
  type: string,
  stats: { totalReferrals: number; qualifiedReferrals: number; conversionRate: number; lifetimeEarnings: number },
  ambassadorInfo: { currentTier: string; referralsToNextTier: number } | null,
  leaderboard: unknown[],
  pendingRewards: { pending: number }
) {
  const insights: Record<string, unknown> = {
    summary: {
      totalReferrals: stats.totalReferrals,
      qualifiedReferrals: stats.qualifiedReferrals,
      conversionRate: stats.conversionRate,
      pendingCoins: pendingRewards.pending,
    },
  };

  if (type === 'performance' || type === 'general') {
    insights.performance = {
      conversionTrend: stats.conversionRate > 30 ? 'above_average' : 'below_average',
      daysToNextTier: ambassadorInfo?.referralsToNextTier || 26,
      estimatedEarnings: Math.floor(stats.qualifiedReferrals * 100),
    };
  }

  if (type === 'optimization') {
    insights.optimization = {
      shareFrequency: stats.totalReferrals === 0 ? 'needs_start' : 'moderate',
      conversionOptimization: stats.conversionRate < 30 ? 'follow_up_referrals' : 'good',
      nextMilestone: ambassadorInfo?.referralsToNextTier || 26,
    };
  }

  if (type === 'ambassador' || ambassadorInfo) {
    insights.ambassador = {
      currentTier: ambassadorInfo?.currentTier || 'bronze',
      referralsToNextTier: ambassadorInfo?.referralsToNextTier || 26,
      bonusMultiplier: ambassadorInfo ? 1 + (ambassadorInfo.referralsToNextTier / 100) : 1,
    };
  }

  return insights;
}

function generateCampaignReason(campaign: { name: string; referrerReward: { value: number } }, stats: { totalReferrals: number }) {
  return `Earn ${campaign.referrerReward.value} coins per referral - ${stats.totalReferrals > 10 ? 'you have experience to maximize this' : 'great to get started'}`;
}

function calculatePotentialEarnings(campaign: { referrerReward: { value: number } }, stats: { totalReferrals: number }) {
  const monthlyTarget = 50;
  return Math.floor(campaign.referrerReward.value * monthlyTarget);
}

export default router;
