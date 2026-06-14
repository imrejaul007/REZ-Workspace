/**
 * Coin Routes
 */
import { Router, Request, Response } from 'express';
import { CoinTransactionModel } from '../models';
import { logger } from '../config/logger';

const router = Router();

// Get coin balance
router.get('/balance/:userId', async (req: Request, res: Response) => {
  try {
    const transactions = await CoinTransactionModel.find({ userId: req.params.userId });

    const totalEarned = transactions
      .filter((t) => t.type === 'earned')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalRedeemed = transactions
      .filter((t) => t.type === 'redeemed')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpired = transactions
      .filter((t) => t.type === 'expired')
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      success: true,
      data: {
        userId: req.params.userId,
        totalBalance: totalEarned - totalRedeemed,
        pendingBalance: 0,
        lifetimeEarned: totalEarned,
      },
    });
  } catch (error) {
    logger.error('Error fetching coin balance:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch balance' });
  }
});

// Get coin transactions
router.get('/transactions/:userId', async (req: Request, res: Response) => {
  try {
    const { limit = '50', page = '1' } = req.query;

    const transactions = await CoinTransactionModel.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .limit(parseInt(limit as string));

    res.json({ success: true, data: transactions });
  } catch (error) {
    logger.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
});

export default router;
