/**
 * Earn Routes - Unified coin earning endpoints
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ServiceRouter } from '../services/ServiceRouter.js';
import { CoinSyncEngine } from '../services/CoinSyncEngine.js';
import { BalanceAggregator } from '../services/BalanceAggregator.js';
import { normalizeCoinType, CoinType, CoinSource } from '../types/index.js';

const router = Router();

// Initialize services
const syncEngine = new CoinSyncEngine();
const serviceRouter = new ServiceRouter(syncEngine);
const balanceAggregator = new BalanceAggregator();

// Request body schema
const EarnBodySchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  amount: z.number().positive('amount must be positive'),
  coinType: z.string().optional().default('REZ'),
  source: z.enum([
    'RABTUL_WALLET',
    'REZ_MEDIA_ENGAGEMENT',
    'REZ_NOW',
    'REZ_APP',
    'DOOH',
    'KARMA',
    'MANUAL',
    'SYSTEM',
  ]).default('REZ_APP'),
  description: z.string().min(1, 'description is required').max(500),
  referenceId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  context: z.enum(['default', 'restaurant', 'prive', 'referral']).optional().default('default'),
});

/**
 * POST /api/v1/loyalty/earn
 * Earn coins - auto-routes to correct service
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = EarnBodySchema.parse(req.body);

    const result = await serviceRouter.earn({
      userId: body.userId,
      amount: body.amount,
      coinType: normalizeCoinType(body.coinType),
      source: body.source as CoinSource,
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
        error: 'Failed to earn coins',
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
 * POST /api/v1/loyalty/earn/batch
 * Batch earn coins for multiple users
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const BatchSchema = z.object({
      transactions: z.array(EarnBodySchema).min(1).max(100),
    });

    const { transactions } = BatchSchema.parse(req.body);

    const results = await Promise.allSettled(
      transactions.map(async (tx) => {
        const result = await serviceRouter.earn({
          userId: tx.userId,
          amount: tx.amount,
          coinType: normalizeCoinType(tx.coinType),
          source: tx.source as CoinSource,
          description: tx.description,
          referenceId: tx.referenceId,
          metadata: tx.metadata,
          context: tx.context,
        });
        return { userId: tx.userId, result };
      })
    );

    const responses = results.map((r, index) => {
      if (r.status === 'fulfilled') {
        return r.value;
      }
      return {
        userId: transactions[index].userId,
        result: {
          success: false,
          transactionId: '',
          newBalance: 0,
          coinType: normalizeCoinType(transactions[index].coinType),
          message: (r as PromiseRejectedResult).reason?.message || 'Unknown error',
        },
      };
    });

    // Invalidate caches
    const userIds = [...new Set(transactions.map(t => t.userId))];
    await Promise.all(userIds.map(uid => balanceAggregator.invalidateCache(uid)));

    res.status(201).json({
      success: true,
      data: {
        total: transactions.length,
        successful: responses.filter(r => r.result.success).length,
        failed: responses.filter(r => !r.result.success).length,
        results: responses,
      },
    });
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

export default router;