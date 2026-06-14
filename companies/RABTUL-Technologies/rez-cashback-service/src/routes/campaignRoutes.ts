import { Router, Request, Response } from 'express';

const router = Router();

// GET /cashback/campaigns - List campaigns
router.get('/', async (_req: Request, res: Response) => {
  res.json({
    campaigns: [],
  });
});

// GET /cashback/campaigns/:id - Get campaign details
router.get('/:id', async (req: Request, res: Response) => {
  res.json({
    campaign: {
      id: req.params.id,
      name: 'Cashback Campaign',
      description: 'Earn cashback on purchases',
      status: 'active',
    },
  });
});

export default router;
