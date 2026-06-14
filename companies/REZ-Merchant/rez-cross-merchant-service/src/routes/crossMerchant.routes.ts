/**
 * Cross-Merchant Routes
 */

import { Router, Request, Response } from 'express';
import { CrossMerchantService } from '../services/CrossMerchantService';

const router = Router();
const service = new CrossMerchantService();

router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const progress = await service.getProgress(req.params.userId);
    res.json({ success: true, data: progress });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

router.get('/:userId/badges', async (req: Request, res: Response) => {
  try {
    const earned = await service.getEarnedBadges(req.params.userId);
    const available = await service.getAvailableBadges(req.params.userId);
    res.json({ success: true, data: { earned, available } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get badges' });
  }
});

router.post('/:userId/visit', async (req: Request, res: Response) => {
  try {
    const { merchantId, category, amount } = req.body;
    const result = await service.recordVisit(req.params.userId, merchantId, category, amount);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record visit' });
  }
});

export { router as crossMerchantRoutes };
