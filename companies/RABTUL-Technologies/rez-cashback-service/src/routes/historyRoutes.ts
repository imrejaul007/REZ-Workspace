import { Router, Request, Response } from 'express';

const router = Router();

// GET /cashback/history - Get history
router.get('/', async (req: Request, res: Response) => {
  const { userId } = req.query;

  res.json({
    history: [],
  });
});

export default router;
