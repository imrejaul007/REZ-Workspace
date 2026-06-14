import { Router, Request, Response } from 'express';

const router = Router();

// GET /bill-providers - List all providers
router.get('/', async (_req: Request, res: Response) => {
  const providers = [
    { id: 'electricity', name: 'Electricity Board', categories: ['residential', 'commercial'] },
    { id: 'water', name: 'Water Supply', categories: ['residential'] },
    { id: 'gas', name: 'Gas Connection', categories: ['residential', 'commercial'] },
    { id: 'internet', name: 'Internet Providers', categories: ['broadband', 'fiber'] },
    { id: 'mobile', name: 'Mobile Postpaid', categories: ['prepaid', 'postpaid'] },
    { id: 'dth', name: 'DTH Services', categories: ['tata-sky', 'dish-tv', 'airtel'] },
  ];

  res.json({ providers });
});

export default router;
