/**
 * Coin Routes
 * API endpoints for Prive coins
 */

import { Router, Response } from 'express';
import { AuthRequest, requireAuth } from '../middleware/auth';
import coinService from '../services/coinService';
import { logger } from '../config/logger';

const router = Router();

/**
 * GET /api/coins/balance
 * Get Prive coin balance
 */
router.get('/balance', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const balance = await coinService.getBalance(userId);
    res.json({ success: true, data: balance });
  } catch (error) {
    logger.error('Failed to get balance', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Failed to get balance' });
  }
});

/**
 * GET /api/coins/transactions
 * Get coin transaction history
 */
router.get('/transactions', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const transactions = await coinService.getTransactions(userId, limit);
    res.json({ success: true, data: transactions });
  } catch (error) {
    logger.error('Failed to get transactions', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Failed to get transactions' });
  }
});

/**
 * POST /api/coins/calculate
 * Calculate bonus for a given order amount
 */
router.post('/calculate', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }

    const bonus = await coinService.processBookingBonus(userId, amount, 'preview');
    res.json({ success: true, data: bonus });
  } catch (error) {
    logger.error('Failed to calculate bonus', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Failed to calculate bonus' });
  }
});

export default router;
