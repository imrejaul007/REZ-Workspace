import { Router, Request, Response } from 'express';
import { QuestsService } from '../services/quests.service';

const router = Router();
const questsService = new QuestsService(null as any);

// ===========================================
// QUESTS
// ===========================================

/**
 * @route GET /api/quests/active
 * @desc Get active quests for driver
 */
router.get('/active', async (req: Request, res: Response) => {
  try {
    const { driverId } = req.query;
    if (!driverId) {
      return res.status(400).json({ error: 'driverId required' });
    }

    const quests = await questsService.getActiveQuests(driverId as string);
    const progress = await questsService.getDriverProgress(driverId as string);

    res.json({ success: true, quests, progress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/quests/claim
 * @desc Claim quest reward
 */
router.post('/claim', async (req: Request, res: Response) => {
  try {
    const { driverId, questId } = req.body;

    const result = await questsService.claimReward(driverId, questId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /api/quests/leaderboard
 * @desc Get weekly leaderboard
 */
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    const leaderboard = await questsService.getWeeklyLeaderboard(parseInt(limit as string));
    res.json({ success: true, leaderboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/quests/rank
 * @desc Get driver's rank
 */
router.get('/rank', async (req: Request, res: Response) => {
  try {
    const { driverId } = req.query;
    if (!driverId) {
      return res.status(400).json({ error: 'driverId required' });
    }

    const rank = await questsService.getDriverRank(driverId as string);
    res.json({ success: true, rank });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/quests/guaranteed
 * @desc Get guaranteed earnings
 */
router.get('/guaranteed', async (req: Request, res: Response) => {
  try {
    const { driverId, timeBlock } = req.query;
    if (!driverId || !timeBlock) {
      return res.status(400).json({ error: 'driverId and timeBlock required' });
    }

    const guarantee = await questsService.getGuaranteedEarnings(
      driverId as string,
      timeBlock as 'morning' | 'evening' | 'night'
    );
    res.json({ success: true, guarantee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
