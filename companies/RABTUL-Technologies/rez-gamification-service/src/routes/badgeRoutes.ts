import { Router, Request, Response } from 'express';

const router = Router();

// GET /badges - List badges
router.get('/', async (_req: Request, res: Response) => {
  res.json({
    badges: [],
  });
});

// GET /badges/user - Get user badges
router.get('/user', async (req: Request, res: Response) => {
  const { userId } = req.query;

  res.json({
    badges: [],
  });
});

export default router;
