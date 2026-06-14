import { Router, Request, Response } from 'express';

const router = Router();

// GET /missions - List missions
router.get('/', async (req: Request, res: Response) => {
  res.json({
    missions: [],
  });
});

// GET /missions/user - Get user missions
router.get('/user', async (req: Request, res: Response) => {
  const { userId } = req.query;

  res.json({
    missions: [],
    progress: 0,
  });
});

export default router;
