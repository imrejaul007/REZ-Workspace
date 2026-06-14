import { Router } from 'express';
import { walletReadService } from '../services/WalletReadService';
import { requireInternalToken } from '../middleware/internalAuth';

const router = Router();

// GET /internal/wallet/read/balance/:userId
router.get('/balance/:userId', requireInternalToken, async (req, res) => {
  const userId = String(req.params.userId);

  const balance = await walletReadService.getBalance(userId);

  if (!balance) {
    return res.status(404).json({ error: 'Wallet not found' });
  }

  res.json({ userId, balance });
});

// GET /internal/wallet/read/statistics/:userId
router.get('/statistics/:userId', requireInternalToken, async (req, res) => {
  const userId = String(req.params.userId);

  const stats = await walletReadService.getStatistics(userId);

  if (!stats) {
    return res.status(404).json({ error: 'Wallet not found' });
  }

  res.json({ userId, statistics: stats });
});

// GET /internal/wallet/read/leaderboard
router.get('/leaderboard', requireInternalToken, async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 10;

  const topWallets = await walletReadService.getTopWallets(limit);

  res.json({ leaderboard: topWallets });
});

export default router;
