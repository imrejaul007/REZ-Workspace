import { Router, Request, Response } from 'express';

const router = Router();

// Default achievements
const DEFAULT_ACHIEVEMENTS = [
  { id: 'first_purchase', name: 'First Purchase', description: 'Complete your first purchase', points: 100, icon: 'cart' },
  { id: 'referrer', name: 'Super Referrer', description: 'Refer 5 friends', points: 500, icon: 'people' },
  { id: 'big_spender', name: 'Big Spender', description: 'Spend ₹10,000', points: 300, icon: 'wallet' },
  { id: 'early_bird', name: 'Early Bird', description: 'Order before 8 AM', points: 50, icon: 'sunny' },
];

// GET /achievements - List achievements
router.get('/', async (_req: Request, res: Response) => {
  res.json({ achievements: DEFAULT_ACHIEVEMENTS });
});

// GET /achievements/user - Get user achievements
router.get('/user', async (req: Request, res: Response) => {
  const { userId } = req.query;

  res.json({
    achievements: [],
    points: 0,
    level: 1,
  });
});

// POST /achievements/recalculate - Recalculate achievements
router.post('/recalculate', async (req: Request, res: Response) => {
  const { userId } = req.body;

  res.json({
    success: true,
    newAchievements: [],
  });
});

export default router;
