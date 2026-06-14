/**
 * REZ Bills - Smart Receipt Scanner
 * Scan bills, extract warranties, generate tax records, earn cashback
 */

import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || '3012', 10);

// RABTUL Service Connections
const RABTUL_AUTH_URL = process.env.RABTUL_AUTH_URL || 'https://rez-auth.rezapp.com';
const RABTUL_WALLET_URL = process.env.RABTUL_WALLET_URL || 'https://rez-wallet.rezapp.com';
const RABTUL_VERIFY_URL = process.env.RABTUL_VERIFY_URL || 'https://rez-verify.rezapp.com';
const RABTUL_NOTIFICATION_URL = process.env.RABTUL_NOTIFICATION_URL || 'https://rez-notification.rezapp.com';
const ANALYTICS_API = process.env.ANALYTICS_API || 'https://rez-analytics.rezapp.com';

// Internal service token for inter-service communication
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'rez-internal-token';

// Legacy URL mappings (for backward compatibility)
const WALLET_API = RABTUL_WALLET_URL;
const VERIFY_API = RABTUL_VERIFY_URL;

// Cashback rates
const CASHBACK_RATES = {
  restaurant: 0.02,   // 2%
  grocery: 0.01,       // 1%
  shopping: 0.015,     // 1.5%
  electronics: 0.01,    // 1%
  default: 0.005       // 0.5%
};

// Bill Model
const Bill = mongoose.model('Bill', new mongoose.Schema({
  bill_id: String,
  user_id: String,
  merchant_name: String,
  merchant_category: String,
  amount: Number,
  currency: { type: String, default: 'INR' },
  date: Date,
  items: [{
    name: String,
    quantity: Number,
    price: Number,
    sku: String
  }],
  warranty_months: Number,
  warranty_serial: String,
  cashback_earned: Number,
  cashback_claimed: { type: Boolean, default: false },
  tax_record_id: String,
  receipt_image: String,
  extracted_at: { type: Date, default: Date.now }
}));

// Tax Record Model
const TaxRecord = mongoose.model('TaxRecord', new mongoose.Schema({
  record_id: String,
  user_id: String,
  year: Number,
  bills: [String], // bill_ids
  total_amount: Number,
  total_cashback: Number,
  generated_at: { type: Date, default: Date.now }
}));

// Parse receipt (simplified - in production use OCR)
function parseReceipt(imageData: string): unknown {
  // In production, use OCR service
  // For now, return mock parsed data
  return {
    merchant_name: 'Extracted Merchant',
    merchant_category: 'restaurant',
    amount: 500,
    date: new Date(),
    items: []
  };
}

// Extract warranty from receipt
async function extractWarranty(bill): Promise<number | null> {
  // Check for warranty keywords
  const warrantyKeywords = ['warranty', 'guarantee', 'service warranty'];
  const text = JSON.stringify(bill).toLowerCase();

  for (const keyword of warrantyKeywords) {
    if (text.includes(keyword)) {
      // Default 12 months warranty
      return 12;
    }
  }
  return null;
}

// Calculate cashback
function calculateCashback(amount: number, category: string): number {
  const rate = CASHBACK_RATES[category] || CASHBACK_RATES.default;
  return Math.round(amount * rate * 100) / 100;
}

// POST /api/bills/scan
app.post('/api/bills/scan', async (req, res) => {
  const { user_id, receipt_image, manual_data } = req.body;

  // Parse receipt
  let data = manual_data;
  if (receipt_image && !manual_data) {
    data = parseReceipt(receipt_image);
  }

  if (!data) {
    return res.status(400).json({ error: 'No receipt data' });
  }

  // Calculate cashback
  const cashback = calculateCashback(data.amount, data.merchant_category);

  // Extract warranty
  const warranty_months = await extractWarranty(data);

  // Create bill
  const bill = new Bill({
    bill_id: `BILL-${Date.now()}`,
    user_id,
    merchant_name: data.merchant_name,
    merchant_category: data.merchant_category,
    amount: data.amount,
    date: new Date(data.date),
    items: data.items || [],
    warranty_months,
    cashback_earned: cashback,
    receipt_image
  });

  await bill.save();

  // Register warranty if found
  if (warranty_months && data.merchant_name) {
    try {
      const serial = `BILL-${bill.bill_id}`;
      await axios.post(`${VERIFY_API}/api/activate-warranty`, {
        serial_number: serial,
        user_id,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        purchase_date: data.date
      });
    } catch (e) {
    console.error('REZ Bills error:', e instanceof Error ? e.message : String(e));
  }
  }

  // Track to analytics
  try {
    await axios.post(`${ANALYTICS_API}/api/track`, {
      event: 'bill_scanned',
      user_id,
      data: { merchant_name: data.merchant_name, amount: data.amount, category: data.merchant_category }
    });
  } catch (e) {
    console.error('REZ Bills error:', e instanceof Error ? e.message : String(e));
  }

  res.json({
    success: true,
    bill_id: bill.bill_id,
    cashback_earned: cashback,
    warranty_detected: warranty_months ? 'Yes' : 'No',
    warranty_months
  });
});

// GET /api/bills/:userId
app.get('/api/bills/:userId', async (req, res) => {
  const { from, to, category, limit = 50 } = req.query;

  const query: unknown = { user_id: req.params.userId };
  if (category) query.merchant_category = category;
  if (from && to) {
    query.date = { $gte: new Date(from), $lte: new Date(to) };
  }

  const bills = await Bill.find(query)
    .sort({ date: -1 })
    .limit(Number(limit));

  const total = await Bill.aggregate([
    { $match: { user_id: req.params.userId } },
    { $group: { _id: null, total: { $sum: '$amount' }, cashback: { $sum: '$cashback_earned' } } }
  ]);

  res.json({
    bills,
    total_amount: total[0]?.total || 0,
    total_cashback: total[0]?.cashback || 0
  });
});

// GET /api/bills/:id
app.get('/api/bills/:id', async (req, res) => {
  const bill = await Bill.findOne({ bill_id: req.params.id });
  if (!bill) {
    return res.status(404).json({ error: 'Bill not found' });
  }
  res.json(bill);
});

// POST /api/bills/:id/claim-cashback
app.post('/api/bills/:id/claim-cashback', async (req, res) => {
  const { user_id } = req.body;

  const bill = await Bill.findOne({ bill_id: req.params.id });
  if (!bill) {
    return res.status(404).json({ error: 'Bill not found' });
  }

  if (bill.cashback_claimed) {
    return res.status(400).json({ error: 'Cashback already claimed' });
  }

  // Transfer to wallet
  try {
    await axios.post(`${WALLET_API}/api/earn`, {
      user_id,
      amount: bill.cashback_earned,
      source: 'bill_cashback',
      reason: `Cashback for ${bill.merchant_name}`
    });

    bill.cashback_claimed = true;
    await bill.save();

    res.json({ success: true, cashback_claimed: bill.cashback_earned });
  } catch (e) {
    res.status(500).json({ error: 'Failed to claim cashback' });
  }
});

// GET /api/tax/:userId
app.get('/api/tax/:userId', async (req, res) => {
  const { year } = req.query;

  const yearNum = Number(year) || new Date().getFullYear();
  const startDate = new Date(yearNum, 0, 1);
  const endDate = new Date(yearNum, 11, 31);

  const bills = await Bill.find({
    user_id: req.params.userId,
    date: { $gte: startDate, $lte: endDate }
  });

  const totalAmount = bills.reduce((sum, b) => sum + b.amount, 0);
  const totalCashback = bills.reduce((sum, b) => sum + b.cashback_earned, 0);

  // Group by category
  const byCategory = await Bill.aggregate([
    { $match: { user_id: req.params.userId, date: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: '$merchant_category', total: { $sum: '$amount' }, count: { $sum: 1 } } }
  ]);

  res.json({
    year: yearNum,
    bills_count: bills.length,
    total_amount: totalAmount,
    total_cashback: totalCashback,
    by_category: byCategory
  });
});

// POST /api/tax/generate
app.post('/api/tax/generate', async (req, res) => {
  const { user_id, year } = req.body;

  const yearNum = year || new Date().getFullYear();
  const startDate = new Date(yearNum, 0, 1);
  const endDate = new Date(yearNum, 11, 31);

  const bills = await Bill.find({
    user_id,
    date: { $gte: startDate, $lte: endDate }
  });

  const total = bills.reduce((sum, b) => sum + b.amount, 0);

  const record = new TaxRecord({
    record_id: `TAX-${yearNum}-${user_id}`,
    user_id,
    year: yearNum,
    bills: bills.map(b => b.bill_id),
    total_amount: total
  });

  await record.save();

  // Update bills with tax_record_id
  await Bill.updateMany(
    { user_id, date: { $gte: startDate, $lte: endDate } },
    { tax_record_id: record.record_id }
  );

  res.json({ success: true, record });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'rez-bills',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Start server
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-bills';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log(`REZ Bills connected to MongoDB`);
    app.listen(PORT, () => {
      console.log(`REZ Bills started on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    // Start anyway for development without MongoDB
    app.listen(PORT, () => {
      console.log(`REZ Bills started on port ${PORT} (without MongoDB)`);
    });
  });

export default app;
