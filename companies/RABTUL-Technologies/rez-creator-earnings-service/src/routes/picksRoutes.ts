import { Router, Request, Response } from 'express';

const router = Router();

// GET /creators/picks - Get creator picks
router.get('/', async (req: Request, res: Response) => {
  const { userId } = req.query;

  res.json({
    picks: [],
  });
});

// GET /creators/picks/:id - Get pick details
router.get('/:id', async (req: Request, res: Response) => {
  res.json({
    pick: {
      id: req.params.id,
      productId: '',
      conversions: 0,
      earnings: 0,
    },
  });
});

// POST /creators/picks - Create a pick
router.post('/', async (req: Request, res: Response) => {
  const { userId, productId } = req.body;

  res.json({
    success: true,
    pick: {
      id: `PICK${Date.now()}`,
      productId,
      status: 'active',
    },
  });
});

export default router;
