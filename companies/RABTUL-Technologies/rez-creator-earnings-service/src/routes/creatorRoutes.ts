import { Router, Request, Response } from 'express';

const router = Router();

// GET /creators/profile - Get creator profile
router.get('/profile', async (req: Request, res: Response) => {
  const { userId } = req.query;

  res.json({
    profile: {
      userId,
      tier: 'starter',
      totalEarnings: 0,
      totalPicks: 0,
      totalConversions: 0,
    },
  });
});

// GET /creators/eligibility - Check creator eligibility
router.get('/eligibility', async (req: Request, res: Response) => {
  const { userId } = req.query;

  res.json({
    eligible: false,
    reason: 'Complete 10 purchases to become a creator',
  });
});

// POST /creators/apply - Apply to become creator
router.post('/apply', async (req: Request, res: Response) => {
  const { userId, bio, socialLinks } = req.body;

  res.json({
    success: true,
    application: {
      id: `APP${Date.now()}`,
      userId,
      status: 'pending',
    },
  });
});

export default router;
