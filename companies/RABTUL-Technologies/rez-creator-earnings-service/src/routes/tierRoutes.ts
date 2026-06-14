import { Router, Request, Response } from 'express';

const router = Router();

// Tiers configuration
const TIERS = [
  { id: 'starter', name: 'Starter', minConversions: 0, commission: 5 },
  { id: 'bronze', name: 'Bronze', minConversions: 10, commission: 7 },
  { id: 'silver', name: 'Silver', minConversions: 50, commission: 10 },
  { id: 'gold', name: 'Gold', minConversions: 100, commission: 12 },
  { id: 'platinum', name: 'Platinum', minConversions: 500, commission: 15 },
];

// GET /creators/tier - Get tier info
router.get('/', async (req: Request, res: Response) => {
  res.json({
    tiers: TIERS,
  });
});

// GET /creators/tier/user - Get user tier
router.get('/user', async (req: Request, res: Response) => {
  const { userId } = req.query;

  res.json({
    currentTier: TIERS[0],
    nextTier: TIERS[1],
    conversionsToNext: 10,
  });
});

export default router;
