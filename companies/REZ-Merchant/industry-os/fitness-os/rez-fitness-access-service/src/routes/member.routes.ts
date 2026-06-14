/**
 * Member Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { getMemberHistory } from '../services/accessService';

const router = Router();

// Get member check-in history
router.get('/:memberId/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const history = await getMemberHistory(
      req.params.memberId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
});

export { router as memberRoutes };
