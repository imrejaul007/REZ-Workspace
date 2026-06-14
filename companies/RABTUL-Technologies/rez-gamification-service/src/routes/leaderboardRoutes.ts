import { Router, Request, Response } from 'express';

const router = Router();

// GET /leaderboard - Get leaderboard
router.get('/', async (req: Request, res: Response) => {
  const { type = 'weekly', limit = 100 } = req.query;

  res.json({
    leaderboard: [],
    type,
    updatedAt: new Date().toISOString(),
  });
});

// GET /leaderboard/user - Get user rank
router.get('/user', async (req: Request, res: Response) => {
  const { userId } = req.query;

  res.json({
    rank: 0,
    points: 0,
  });
});

export default router;
