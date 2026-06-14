/**
 * Islamic BNPL Routes - Sharia-compliant Buy Now Pay Later
 */
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

interface IslamicBNPL {
  id: string;
  userId: string;
  amount: number;
  tenure: number; // months
  profitRate: number; // 0% for Sharia
  totalAmount: number;
  monthlyPayment: number;
  status: 'pending' | 'approved' | 'active' | 'completed' | 'defaulted';
  createdAt: Date;
}

const bnplPlans = new Map<string, IslamicBNPL>();

// Apply for Islamic BNPL
router.post('/apply', async (req, res) => {
  const { userId, amount, tenure = 3 } = req.body;

  // Sharia-compliant: 0% profit rate
  const profitRate = 0;
  const totalAmount = amount;
  const monthlyPayment = totalAmount / tenure;

  const plan: IslamicBNPL = {
    id: `ISL-BNPL-${uuidv4().split('-')[0].toUpperCase()}`,
    userId,
    amount,
    tenure,
    profitRate,
    totalAmount,
    monthlyPayment,
    status: 'approved', // Auto-approved for demo
    createdAt: new Date(),
  };

  bnplPlans.set(plan.id, plan);
  res.status(201).json({ success: true, data: plan });
});

// Get BNPL plan
router.get('/:id', async (req, res) => {
  const plan = bnplPlans.get(req.params.id);
  if (!plan) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
  res.json({ success: true, data: plan });
});

// Get user's BNPL plans
router.get('/user/:userId', async (req, res) => {
  const userPlans = Array.from(bnplPlans.values()).filter(p => p.userId === req.params.userId);
  res.json({ success: true, data: userPlans });
});

// Make payment
router.post('/:id/pay', async (req, res) => {
  const plan = bnplPlans.get(req.params.id);
  if (!plan) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });

  plan.status = 'completed';
  bnplPlans.set(plan.id, plan);
  res.json({ success: true, data: plan });
});

// Get Sharia-compliant BNPL options
router.get('/options', (req, res) => {
  res.json({
    success: true,
    data: {
      tenures: [3, 6, 9, 12],
      profitRate: 0, // Sharia-compliant
      maxAmount: 10000,
      currency: 'AED',
      features: [
        'No interest (Riba)',
        'No late fees',
        'Transparent pricing',
        'Halal certified',
      ],
    },
  });
});

export { router as bnplRoutes };