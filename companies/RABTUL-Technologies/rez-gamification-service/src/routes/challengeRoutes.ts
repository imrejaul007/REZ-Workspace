import { Router, Request, Response } from 'express';

const router = Router();

// GET /challenges - List challenges
router.get('/', async (req: Request, res: Response) => {
  const { userId, status } = req.query;

  res.json({
    challenges: [],
  });
});

// GET /challenges/:id - Get challenge details
router.get('/:id', async (req: Request, res: Response) => {
  res.json({
    challenge: {
      id: req.params.id,
      name: 'Daily Challenge',
      description: 'Complete a purchase today',
      reward: 50,
      status: 'active',
    },
  });
});

export default router;
