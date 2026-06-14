/**
 * Balance Routes - Unified balance endpoints
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { BalanceAggregator } from '../services/BalanceAggregator.js';
import { normalizeCoinType, CoinType } from '../types/index.js';

const router = Router();
const balanceAggregator = new BalanceAggregator();

// Query params schema
const BalanceQuerySchema = z.object({
  refresh: z.enum(['true', 'false']).optional().default('false'),
});

/**
 * GET /api/v1/loyalty/balance/:userId
 * Get unified balance from all services
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { refresh } = BalanceQuerySchema.parse(req.query);
    const forceRefresh = refresh === 'true';

    const balance = await balanceAggregator.getUnifiedBalance(userId, forceRefresh);

    res.json({
      success: true,
      data: balance,
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
      error: 'Failed to fetch balance',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/v1/loyalty/balance/:userId/:coinType
 * Get specific coin type balance
 */
router.get('/:userId/:coinType', async (req: Request, res: Response) => {
  try {
    const { userId, coinType } = req.params;
    const normalizedCoinType = normalizeCoinType(coinType);

    const balance = await balanceAggregator.getCoinTypeBalance(userId, normalizedCoinType);

    if (!balance) {
      res.status(404).json({
        success: false,
        error: 'Balance not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        coinType: normalizedCoinType,
        balance,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch coin balance',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/v1/loyalty/balance/:userId/total
 * Get total spendable balance (all coin types combined)
 */
router.get('/:userId/total', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const total = await balanceAggregator.getTotalBalance(userId);

    res.json({
      success: true,
      data: {
        userId,
        totalBalance: total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch total balance',
      message: (error as Error).message,
    });
  }
});

export default router;
