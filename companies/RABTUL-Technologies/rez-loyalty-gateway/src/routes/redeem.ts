/**
 * Redeem Routes - Unified coin redemption endpoints
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ServiceRouter } from '../services/ServiceRouter.js';
import { CoinSyncEngine } from '../services/CoinSyncEngine.js';
import { BalanceAggregator } from '../services/BalanceAggregator.js';
import { normalizeCoinType, CoinType, SPEND_PRIORITY } from '../types/index.js';

const router = Router();

// Initialize services
const syncEngine = new CoinSyncEngine();
const serviceRouter = new ServiceRouter(syncEngine);
const balanceAggregator = new BalanceAggregator();

// Request body schema
const RedeemBodySchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  amount: z.number().positive('amount must be positive'),
  coinType: z.string().optional(),
  description: z.string().min(1, 'description is required').max(500),
  referenceId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  context: z.enum(['default', 'restaurant', 'prive', 'referral']).optional().default('default'),
});

/**
 * POST /api/v1/loyalty/redeem
 * Redeem coins - auto-routes to correct service
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = RedeemBodySchema.parse(req.body);

    // If coinType not specified, use priority order
    const coinType = body.coinType
      ? normalizeCoinType(body.coinType)
      : CoinType.REZ;

    const result = await serviceRouter.redeem({
      userId: body.userId,
      amount: body.amount,
      coinType,
      description: body.description,
      referenceId: body.referenceId,
      metadata: body.metadata,
      context: body.context,
    });

    if (result.success) {
      // Invalidate cache for this user
      await balanceAggregator.invalidateCache(body.userId);

      res.status(201).json({
        success: true,
        data: result,
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to redeem coins',
        data: result,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/v1/loyalty/redeem/auto
 * Auto-redeem using spend priority order
 * Tries each coin type in order until successful
 */
router.post('/auto', async (req: Request, res: Response) => {
  try {
    const AutoRedeemSchema = z.object({
      userId: z.string().min(1, 'userId is required'),
      amount: z.number().positive('amount must be positive'),
      description: z.string().min(1, 'description is required').max(500),
      referenceId: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
    });

    const body = AutoRedeemSchema.parse(req.body);

    // Get current balance
    const balance = await balanceAggregator.getUnifiedBalance(body.userId);

    let remainingAmount = body.amount;
    const results: Array<{
      coinType: CoinType;
      amount: number;
      success: boolean;
      transactionId?: string;
      message: string;
    }> = [];

    // Try each coin type in priority order
    for (const coinType of SPEND_PRIORITY) {
      if (remainingAmount <= 0) break;

      const coinBalance = balance.balances[coinType];
      if (!coinBalance || coinBalance.available <= 0) continue;

      const redeemAmount = Math.min(remainingAmount, coinBalance.available);

      const result = await serviceRouter.redeem({
        userId: body.userId,
        amount: redeemAmount,
        coinType,
        description: `${body.description} (auto-redeem: ${coinType})`,
        referenceId: body.referenceId ? `${body.referenceId}-${coinType}` : undefined,
        metadata: { ...body.metadata, autoRedeem: true },
      });

      results.push({
        coinType,
        amount: redeemAmount,
        success: result.success,
        transactionId: result.success ? result.transactionId : undefined,
        message: result.message,
      });

      if (result.success) {
        remainingAmount -= redeemAmount;
      }
    }

    const totalRedeemed = body.amount - remainingAmount;

    res.status(201).json({
      success: remainingAmount <= 0,
      data: {
        requestedAmount: body.amount,
        totalRedeemed,
        remainingAmount,
        fullyRedeemed: remainingAmount <= 0,
        results,
      },
    });

    // Invalidate cache
    await balanceAggregator.invalidateCache(body.userId);

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/v1/loyalty/redeem/estimate
 * Estimate redemption with spend priority breakdown
 */
router.get('/estimate', async (req: Request, res: Response) => {
  try {
    const EstimateSchema = z.object({
      userId: z.string().min(1, 'userId is required'),
      amount: z.coerce.number().positive('amount must be positive'),
    });

    const { userId, amount } = EstimateSchema.parse(req.query);

    const balance = await balanceAggregator.getUnifiedBalance(userId);

    let remaining = amount;
    const breakdown: Array<{
      coinType: CoinType;
      available: number;
      toUse: number;
    }> = [];

    for (const coinType of SPEND_PRIORITY) {
      if (remaining <= 0) break;

      const coinBalance = balance.balances[coinType];
      if (!coinBalance || coinBalance.available <= 0) continue;

      const toUse = Math.min(remaining, coinBalance.available);
      breakdown.push({
        coinType,
        available: coinBalance.available,
        toUse,
      });

      remaining -= toUse;
    }

    res.json({
      success: true,
      data: {
        requestedAmount: amount,
        fullyCovered: remaining <= 0,
        shortBy: remaining > 0 ? remaining : 0,
        breakdown,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: (error as Error).message,
    });
  }
});

export default router;