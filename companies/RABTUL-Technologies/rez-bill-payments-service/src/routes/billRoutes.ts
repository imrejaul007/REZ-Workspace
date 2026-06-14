import { Router, Request, Response } from 'express';

const router = Router();

// Bill providers configuration
const BILL_PROVIDERS = [
  { id: 'electricity', name: 'Electricity', icon: 'flash' },
  { id: 'water', name: 'Water', icon: 'water' },
  { id: 'gas', name: 'Gas', icon: 'flame' },
  { id: 'internet', name: 'Internet', icon: 'wifi' },
  { id: 'mobile', name: 'Mobile Postpaid', icon: 'phone-portrait' },
  { id: 'dth', name: 'DTH', icon: 'tv' },
  { id: 'landline', name: 'Landline', icon: 'call' },
];

// GET /bills/providers - List bill providers
router.get('/providers', async (_req: Request, res: Response) => {
  res.json({ providers: BILL_PROVIDERS });
});

// GET /bills/fetch - Fetch bill from provider
router.post('/fetch', async (req: Request, res: Response) => {
  try {
    const { provider, customerId } = req.body;

    // Mock bill data - STATISTICAL: non-security mock data
    res.json({
      success: true,
      bill: {
        provider,
        customerId,
        amount: Math.floor(Math.random() * 5000) + 500,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        billNumber: `BL${Date.now()}`,
        status: 'pending',
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bill' });
  }
});

export default router;
