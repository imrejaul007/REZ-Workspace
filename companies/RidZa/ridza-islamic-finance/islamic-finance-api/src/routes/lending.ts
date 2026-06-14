/**
 * Islamic Lending Routes - Sharia-compliant loans
 */
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

interface IslamicLoan {
  id: string;
  userId: string;
  amount: number;
  tenure: number; // months
  profitRate: number; // Murabaha markup
  totalAmount: number;
  monthlyPayment: number;
  type: 'murabaha' | 'ijara' | 'musharaka';
  status: 'pending' | 'approved' | 'active' | 'completed' | 'defaulted';
  createdAt: Date;
}

const loans = new Map<string, IslamicLoan>();

// Apply for Islamic loan
router.post('/apply', async (req, res) => {
  const { userId, amount, tenure = 12, type = 'murabaha' } = req.body;

  // Murabaha: Cost + markup (no interest)
  const profitRates = { murabaha: 5, ijara: 4, musharaka: 6 };
  const profitRate = profitRates[type as keyof typeof profitRates] || 5;
  const profitAmount = amount * (profitRate / 100);
  const totalAmount = amount + profitAmount;
  const monthlyPayment = totalAmount / tenure;

  const loan: IslamicLoan = {
    id: `ISL-LOAN-${uuidv4().split('-')[0].toUpperCase()}`,
    userId,
    amount,
    tenure,
    profitRate,
    totalAmount,
    monthlyPayment,
    type,
    status: 'approved',
    createdAt: new Date(),
  };

  loans.set(loan.id, loan);
  res.status(201).json({ success: true, data: loan });
});

// Get loan
router.get('/:id', async (req, res) => {
  const loan = loans.get(req.params.id);
  if (!loan) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
  res.json({ success: true, data: loan });
});

// Get user's loans
router.get('/user/:userId', async (req, res) => {
  const userLoans = Array.from(loans.values()).filter(l => l.userId === req.params.userId);
  res.json({ success: true, data: userLoans });
});

// Get loan types
router.get('/types', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'murabaha',
        name: 'Murabaha',
        description: 'Cost-plus financing - buy item and sell at profit',
        profitRate: '5%',
        features: ['Transparent pricing', 'No interest', 'Asset-backed'],
      },
      {
        id: 'ijara',
        name: 'Ijara',
        description: 'Lease-to-own arrangement',
        profitRate: '4%',
        features: ['Rental model', 'Ownership transfer', 'Maintenance included'],
      },
      {
        id: 'musharaka',
        name: 'Musharaka',
        description: 'Profit-sharing partnership',
        profitRate: '6%',
        features: ['Equity partnership', 'Shared risk', 'Gradual ownership'],
      },
    ],
  });
});

export { router as lendingRoutes };