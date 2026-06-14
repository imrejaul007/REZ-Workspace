/**
 * REZ Bills - Bills Routes
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const billsRouter = Router();

// Cashback rates by category
const CASHBACK_RATES = {
  restaurant: 0.02,
  grocery: 0.01,
  shopping: 0.015,
  electronics: 0.01,
  default: 0.005,
};

// In-memory store (use MongoDB in production)
const bills = new Map();
const taxRecords = new Map();

/**
 * POST /api/bills/scan
 * Scan and parse a receipt
 */
billsRouter.post('/scan', async (req, res) => {
  try {
    const { imageData, userId } = req.body;

    // Parse receipt (mock - use OCR in production)
    const parsed = parseReceipt(imageData);
    const cashbackRate = CASHBACK_RATES[parsed.category] || CASHBACK_RATES.default;
    const cashback = Math.round(parsed.amount * cashbackRate * 100) / 100;

    const bill = {
      bill_id: uuidv4(),
      user_id: userId,
      merchant_name: parsed.merchant_name,
      merchant_category: parsed.category,
      amount: parsed.amount,
      currency: 'INR',
      date: new Date(),
      items: parsed.items || [],
      warranty_months: parsed.warranty_months || 0,
      warranty_serial: null,
      cashback_earned: cashback,
      cashback_claimed: false,
      tax_record_id: null,
      receipt_image: imageData,
      extracted_at: new Date(),
    };

    bills.set(bill.bill_id, bill);

    res.json({
      success: true,
      data: {
        bill,
        cashback_earned: cashback,
        message: `Earned ₹${cashback} cashback!`,
      },
    });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ success: false, error: 'Failed to scan bill' });
  }
});

/**
 * GET /api/bills
 * Get all bills for a user
 */
billsRouter.get('/', async (req, res) => {
  try {
    const { userId, category, startDate, endDate } = req.query;

    let userBills = Array.from(bills.values()).filter(
      (b) => b.user_id === userId
    );

    if (category) {
      userBills = userBills.filter((b) => b.merchant_category === category);
    }

    if (startDate) {
      userBills = userBills.filter((b) => new Date(b.date) >= new Date(startDate as string));
    }

    if (endDate) {
      userBills = userBills.filter((b) => new Date(b.date) <= new Date(endDate as string));
    }

    // Sort by date descending
    userBills.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({
      success: true,
      data: {
        bills: userBills,
        total: userBills.length,
        total_amount: userBills.reduce((sum, b) => sum + b.amount, 0),
        total_cashback: userBills.reduce((sum, b) => sum + b.cashback_earned, 0),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch bills' });
  }
});

/**
 * GET /api/bills/:id
 * Get single bill
 */
billsRouter.get('/:id', async (req, res) => {
  const bill = bills.get(req.params.id);
  if (!bill) {
    return res.status(404).json({ success: false, error: 'Bill not found' });
  }
  res.json({ success: true, data: bill });
});

/**
 * POST /api/bills/:id/claim-cashback
 * Claim cashback from a bill
 */
billsRouter.post('/:id/claim-cashback', async (req, res) => {
  try {
    const bill = bills.get(req.params.id);
    if (!bill) {
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }

    if (bill.cashback_claimed) {
      return res.status(400).json({ success: false, error: 'Cashback already claimed' });
    }

    bill.cashback_claimed = true;
    bills.set(bill.bill_id, bill);

    // Call wallet API to add coins
    // await axios.post(`${WALLET_API}/api/coins/credit`, {
    //   userId: bill.user_id,
    //   amount: bill.cashback_earned * 100, // Convert to coins
    //   reason: `Cashback from ${bill.merchant_name}`,
    // });

    res.json({
      success: true,
      data: {
        coins_credited: bill.cashback_earned * 100,
        message: 'Cashback claimed successfully!',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to claim cashback' });
  }
});

/**
 * GET /api/bills/tax-records/:year
 * Get tax records for a year
 */
billsRouter.get('/tax-records/:year', async (req, res) => {
  try {
    const { userId } = req.query;
    const year = parseInt(req.params.year);

    const yearBills = Array.from(bills.values()).filter((b) => {
      const billYear = new Date(b.date).getFullYear();
      return billYear === year && b.user_id === userId;
    });

    const taxRecord = {
      record_id: uuidv4(),
      user_id: userId,
      year,
      bills: yearBills.map((b) => b.bill_id),
      total_amount: yearBills.reduce((sum, b) => sum + b.amount, 0),
      total_cashback: yearBills.reduce((sum, b) => sum + b.cashback_earned, 0),
      generated_at: new Date(),
    };

    taxRecords.set(taxRecord.record_id, taxRecord);

    res.json({ success: true, data: taxRecord });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate tax record' });
  }
});

// Helper function - mock OCR
function parseReceipt(imageData: string) {
  // In production, use OCR service
  return {
    merchant_name: 'Restaurant ABC',
    category: 'restaurant',
    amount: Math.floor(Math.random() * 1000) + 100,
    items: [],
    warranty_months: 0,
  };
}
