/**
 * Zakat Routes - Zakat calculation & management
 */
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

interface ZakatCalculation {
  id: string;
  userId: string;
  totalWealth: number;
  nisabThreshold: number;
  isEligible: boolean;
  zakatAmount: number;
  charityPartner?: string;
  createdAt: Date;
}

// Gold price in AED (mock)
const GOLD_PRICE_PER_GRAM = 250;
const NISAB_GOLD_GRAMS = 85;
const NISAB_VALUE = NISAB_GOLD_GRAMS * GOLD_PRICE_PER_GRAM; // ~21,250 AED

// Calculate Zakat
router.post('/calculate', async (req, res) => {
  const { userId, assets } = req.body;

  // Calculate total wealth
  const totalWealth = (assets?.cash || 0) +
    (assets?.gold || 0) * GOLD_PRICE_PER_GRAM +
    (assets?.investments || 0) +
    (assets?.property || 0) * 0.3; // 30% of property value

  const isEligible = totalWealth >= NISAB_VALUE;
  const zakatAmount = isEligible ? totalWealth * 0.025 : 0; // 2.5%

  const calculation: ZakatCalculation = {
    id: `ZAKAT-${uuidv4().split('-')[0].toUpperCase()}`,
    userId,
    totalWealth,
    nisabThreshold: NISAB_VALUE,
    isEligible,
    zakatAmount,
    createdAt: new Date(),
  };

  res.status(201).json({ success: true, data: calculation });
});

// Get Nisab threshold
router.get('/nisab', (req, res) => {
  res.json({
    success: true,
    data: {
      nisabValue: NISAB_VALUE,
      currency: 'AED',
      goldPricePerGram: GOLD_PRICE_PER_GRAM,
      goldGrams: NISAB_GOLD_GRAMS,
      description: 'Nisab is 85 grams of gold (or equivalent silver)',
    },
  });
});

// Pay Zakat
router.post('/pay', async (req, res) => {
  const { userId, amount, charityPartner = 'RTNM Charity' } = req.body;

  res.json({
    success: true,
    data: {
      id: `ZAKAT-PAY-${uuidv4().split('-')[0].toUpperCase()}`,
      userId,
      amount,
      charityPartner,
      status: 'completed',
      paidAt: new Date(),
    },
  });
});

// Get Zakat partners (charities)
router.get('/partners', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'karma', name: 'Karma Foundation', description: 'RTNM Charity', verified: true },
      { id: 'local', name: 'Local Mosque', description: 'Community', verified: true },
    ],
  });
});

export { router as zakatRoutes };