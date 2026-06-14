/**
 * REZ Unified Hub - Loyalty Routes
 * Cross-company loyalty and karma points
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { apiClient } from '../services/apiClient';
import { logger } from '../utils/logger';

const router = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const AwardPointsSchema = z.object({
  user_id: z.string().min(1, 'user_id is required'),
  company: z.string().min(1, 'company is required'),
  points: z.number().positive('points must be positive'),
  action: z.string().min(1, 'action is required'),
  reference: z.string().optional(),
});

const RedeemSchema = z.object({
  user_id: z.string().min(1, 'user_id is required'),
  points: z.number().positive('points must be positive'),
  reward_id: z.string().min(1, 'reward_id is required'),
  company: z.string().optional(),
});

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/v1/loyalty/:userId/balance
 * Get unified karma/points balance across all companies
 */
router.get('/:userId/balance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    // Parallel fetch from wallet and karma
    const [walletResult, karmaResult] = await Promise.allSettled([
      apiClient.getWalletBalance(userId),
      apiClient.getKarmaBalance(userId),
    ]);

    const wallet = walletResult.status === 'fulfilled' ? walletResult.value as Record<string, unknown> : null;
    const karma = karmaResult.status === 'fulfilled' ? karmaResult.value as Record<string, unknown> : null;

    res.json({
      success: true,
      data: {
        wallet_balance: wallet?.balance || 0,
        karma_points: karma?.points || 0,
        total_points: (wallet?.balance as number || 0) + (karma?.points as number || 0),
        tier: karma?.tier || 'standard',
        wallet: wallet,
        karma: karma,
      },
    });
  } catch (error) {
    logger.error('Error fetching loyalty balance:', error);
    next(error);
  }
});

/**
 * POST /api/v1/loyalty/award
 * Award karma points across companies
 */
router.post('/award', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = AwardPointsSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: validation.error.errors,
      });
      return;
    }

    const { user_id, company, points, action, reference } = validation.data;

    // Credit to user's wallet
    const walletResult = await apiClient.call('WALLET', '/api/v1/wallet/credit', 'POST', {
      user_id,
      amount: points,
      source: `${company}_${action}`,
      reference_id: reference,
    });

    // Also record in karma
    const karmaResult = await apiClient.awardKarma(user_id, points, company, action);

    // Collect signal for intelligence
    await apiClient.collectSignal('loyalty', `points_awarded_${action}`, user_id, {
      company,
      points,
      action,
    });

    res.json({
      success: true,
      data: {
        wallet: walletResult,
        karma: karmaResult,
        points_awarded: points,
      },
    });
  } catch (error) {
    logger.error('Error awarding points:', error);
    next(error);
  }
});

/**
 * POST /api/v1/loyalty/redeem
 * Redeem points for rewards
 */
router.post('/redeem', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = RedeemSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: validation.error.errors,
      });
      return;
    }

    const { user_id, points, reward_id, company } = validation.data;

    // Redeem from karma service
    const result = await apiClient.call('KARMA', '/api/v1/redeem', 'POST', {
      user_id,
      points,
      source: company || 'unified-hub',
      item_id: reward_id,
    });

    // Collect signal
    await apiClient.collectSignal('loyalty', 'points_redeemed', user_id, {
      points,
      reward_id,
      company,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error redeeming points:', error);
    next(error);
  }
});

/**
 * GET /api/v1/loyalty/:userId/history
 * Get loyalty history across all companies
 */
router.get('/:userId/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { limit = '20', offset = '0' } = req.query;

    // Fetch from wallet and karma in parallel
    const [walletHistory, karmaHistory] = await Promise.allSettled([
      apiClient.call('WALLET', '/api/v1/transactions', 'POST', {
        user_id: userId,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      }),
      apiClient.call('KARMA', '/api/v1/history', 'POST', {
        user_id: userId,
        limit: parseInt(limit as string, 10),
      }),
    ]);

    const wallet = walletHistory.status === 'fulfilled' ? walletHistory.value as { transactions?: unknown[] } : null;
    const karma = karmaHistory.status === 'fulfilled' ? karmaHistory.value as { history?: unknown[] } : null;

    // Merge and sort histories
    const combinedHistory = [
      ...(wallet?.transactions || []).map((t: unknown) => ({ ...t as object, source: 'wallet' })),
      ...(karma?.history || []).map((h: unknown) => ({ ...h as object, source: 'karma' })),
    ].sort((a, b) => {
      const aTime = (a as { created_at?: string }).created_at || '';
      const bTime = (b as { created_at?: string }).created_at || '';
      return bTime.localeCompare(aTime);
    });

    res.json({
      success: true,
      data: {
        history: combinedHistory,
        wallet_count: wallet?.transactions?.length || 0,
        karma_count: karma?.history?.length || 0,
      },
    });
  } catch (error) {
    logger.error('Error fetching loyalty history:', error);
    next(error);
  }
});

/**
 * GET /api/v1/loyalty/tiers
 * Get available loyalty tiers and benefits
 */
router.get('/tiers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tiers = [
      {
        tier: 'bronze',
        min_points: 0,
        max_points: 999,
        benefits: ['Basic rewards', 'Email support'],
        cashback_percent: 0.5,
      },
      {
        tier: 'silver',
        min_points: 1000,
        max_points: 4999,
        benefits: ['Enhanced rewards', 'Priority support', 'Birthday bonus'],
        cashback_percent: 1.0,
      },
      {
        tier: 'gold',
        min_points: 5000,
        max_points: 19999,
        benefits: ['Premium rewards', 'Dedicated support', 'Early access', 'Extra cashback'],
        cashback_percent: 1.5,
      },
      {
        tier: 'platinum',
        min_points: 20000,
        benefits: ['VIP rewards', '24/7 support', 'Exclusive events', 'Maximum cashback'],
        cashback_percent: 2.0,
      },
    ];

    res.json({
      success: true,
      data: { tiers },
    });
  } catch (error) {
    logger.error('Error fetching tiers:', error);
    next(error);
  }
});

export default router;
