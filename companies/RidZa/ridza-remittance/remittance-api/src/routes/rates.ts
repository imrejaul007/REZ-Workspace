/**
 * Exchange Rates Routes
 */
import { Router } from 'express';

const router = Router();

// Get all exchange rates
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      base: 'USD',
      timestamp: new Date().toISOString(),
      rates: {
        AED: 3.67,
        INR: 83.2,
        EUR: 0.92,
        GBP: 0.79,
        SAR: 3.75,
        QAR: 3.64,
 KWD: 0.31,
      },
    },
  });
});

// Get specific rate
router.get('/:from/:to', (req, res) => {
  const { from, to } = req.params;
  const rates: Record<string, number> = {
    'USD-AED': 3.67, 'AED-USD': 0.27,
    'USD-INR': 83.2, 'INR-USD': 0.012,
    'USD-EUR': 0.92, 'EUR-USD': 1.09,
    'USD-GBP': 0.79, 'GBP-USD': 1.27,
    'USD-SAR': 3.75, 'SAR-USD': 0.27,
    'USD-QAR': 3.64, 'QAR-USD': 0.27,
    'USD-KWD': 0.31, 'KWD-USD': 3.25,
  };

  const rateKey = `${from}-${to}`;
  const rate = rates[rateKey];

  if (!rate) {
    return res.status(404).json({ success: false, error: { code: 'RATE_NOT_FOUND' } });
  }

  res.json({
    success: true,
    data: {
      from,
      to,
      rate,
      inverseRate: 1 / rate,
      timestamp: new Date().toISOString(),
    },
  });
});

export { router as ratesRoutes };
