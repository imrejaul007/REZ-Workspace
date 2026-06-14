/**
 * Transfer Routes - P2P & Cross-border transfers
 */
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

interface Transfer {
  id: string;
  senderId: string;
  recipientId: string;
  amount: number;
  currency: string;
  targetCurrency: string;
  targetAmount: number;
  exchangeRate: number;
  fees: number;
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

const transfers = new Map<string, Transfer>();

// Send money
router.post('/send', async (req, res) => {
  const { senderId, recipientId, amount, currency, targetCurrency } = req.body;

  // Mock exchange rates
  const rates: Record<string, number> = {
    'USD-AED': 3.67, 'AED-USD': 0.27,
    'INR-AED': 0.044, 'AED-INR': 22.5,
    'USD-INR': 83.2, 'INR-USD': 0.012,
  };

  const rateKey = `${currency}-${targetCurrency}`;
  const exchangeRate = rates[rateKey] || 1;
  const targetAmount = amount * exchangeRate;
  const fees = amount * 0.01; // 1% fee
  const totalAmount = amount + fees;

  const transfer: Transfer = {
    id: `REM-${uuidv4().split('-')[0].toUpperCase()}`,
    senderId,
    recipientId,
    amount,
    currency,
    targetCurrency,
    targetAmount,
    exchangeRate,
    fees,
    totalAmount,
    status: 'completed',
    createdAt: new Date(),
    completedAt: new Date(),
  };

  transfers.set(transfer.id, transfer);
  res.status(201).json({ success: true, data: transfer });
});

// Get transfer status
router.get('/:id', async (req, res) => {
  const transfer = transfers.get(req.params.id);
  if (!transfer) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
  res.json({ success: true, data: transfer });
});

// Get user's transfers
router.get('/user/:userId', async (req, res) => {
  const userTransfers = Array.from(transfers.values())
    .filter(t => t.senderId === req.params.userId || t.recipientId === req.params.userId);
  res.json({ success: true, data: userTransfers });
});

// Get transfer quote
router.post('/quote', async (req, res) => {
  const { amount, currency, targetCurrency } = req.body;

  const rates: Record<string, number> = {
    'USD-AED': 3.67, 'AED-USD': 0.27,
    'INR-AED': 0.044, 'AED-INR': 22.5,
    'USD-INR': 83.2, 'INR-USD': 0.012,
  };

  const rateKey = `${currency}-${targetCurrency}`;
  const exchangeRate = rates[rateKey] || 1;
  const targetAmount = amount * exchangeRate;
  const fees = amount * 0.01;

  res.json({
    success: true,
    data: {
      amount,
      currency,
      targetCurrency,
      exchangeRate,
      targetAmount,
      fees,
      totalAmount: amount + fees,
      deliveryTime: 'Same day',
    },
  });
});

export { router as transferRoutes };