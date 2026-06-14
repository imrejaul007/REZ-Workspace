/**
 * Explorer Score Routes
 */
import { Router, Request, Response } from 'express';
import { ExplorerProfileModel } from '../models';
import { logger } from '../config/logger';

const router = Router();

// Get explorer score
router.get('/score/:userId', async (req: Request, res: Response) => {
  try {
    let profile = await ExplorerProfileModel.findOne({ userId: req.params.userId });

    if (!profile) {
      profile = new ExplorerProfileModel({ userId: req.params.userId });
      await profile.save();
    }

    // Calculate percentile
    const totalExplorers = await ExplorerProfileModel.countDocuments({
      score: { $gt: profile.score },
    });
    const allExplorers = await ExplorerProfileModel.countDocuments();

    profile.leaderboardPercentile = Math.round((totalExplorers / allExplorers) * 100);

    res.json({
      success: true,
      data: {
        score: profile.score,
        tier: profile.tier,
        stats: profile.stats,
        leaderboardPercentile: profile.leaderboardPercentile,
      },
    });
  } catch (error) {
    logger.error('Error fetching explorer score:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch explorer score' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const { limit = '20', page = '1' } = req.query;

    const leaderboard = await ExplorerProfileModel.find()
      .sort({ score: -1 })
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .limit(parseInt(limit as string))
      .select('userId score tier stats.badges');

    res.json({ success: true, data: leaderboard });
  } catch (error) {
    logger.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
  }
});

// Get explorer badges
router.get('/badges/:userId', async (req: Request, res: Response) => {
  try {
    const profile = await ExplorerProfileModel.findOne({ userId: req.params.userId });

    if (!profile) {
      return res.json({ success: true, data: [] });
    }

    res.json({ success: true, data: profile.badges });
  } catch (error) {
    logger.error('Error fetching badges:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch badges' });
  }
});

export default router;
