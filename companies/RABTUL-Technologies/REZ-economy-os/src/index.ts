import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app: Express = express();
const PORT = process.env.PORT || 4251;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/economy-os';

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(express.json());

// ============================================
// KARMA POINTS MODEL
// ============================================

const karmaSchema = new mongoose.Schema({
  entityId: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ['agent', 'user', 'company'], required: true },
  points: { type: Number, default: 0 },
  tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'], default: 'bronze' },
  history: [{
    action: String,
    points: Number,
    reason: String,
    timestamp: { type: Date, default: Date.now }
  }],
  tenantId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

karmaSchema.index({ tenantId: 1, tier: 1 });

const Karma = mongoose.model('Karma', karmaSchema);

// ============================================
// TRANSACTION MODEL
// ============================================

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true, index: true },
  from: String,
  to: String,
  type: { type: String, enum: ['payment', 'refund', 'fee', 'reward', 'karma'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
  reference: String,
  metadata: mongoose.Schema.Types.Mixed,
  tenantId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now }
});

transactionSchema.index({ tenantId: 1, status: 1 });
transactionSchema.index({ from: 1 });
transactionSchema.index({ to: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

// ============================================
// PLATFORM FEE MODEL
// ============================================

const feeSchema = new mongoose.Schema({
  feeId: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ['transaction', 'subscription', 'listing', 'withdrawal'], required: true },
  rate: Number,  // percentage
  fixed: Number,  // fixed amount
  minAmount: Number,
  maxAmount: Number,
  active: { type: Boolean, default: true },
  tenantId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Fee = mongoose.model('Fee', feeSchema);

// Health
app.get('/health', (_, res) => res.json({ status: 'healthy', service: 'economy-os', timestamp: new Date().toISOString() }));
app.get('/health/ready', async (_, res) => {
  const status = mongoose.connection.readyState === 1 ? 'ready' : 'not_ready';
  res.status(status === 'ready' ? 200 : 503).json({ status });
});

app.get('/api/info', (_, res) => {
  res.json({ service: 'economy-os', version: '1.0.0', description: 'Economy OS - Karma, Fees, Settlement', port: PORT });
});

// ============================================
// KARMA ENDPOINTS
// ============================================

// Get karma
app.get('/api/karma/:entityId', async (req, res) => {
  try {
    const karma = await Karma.findOne({ entityId: req.params.entityId });
    if (!karma) {
      return res.json({ success: true, data: { entityId: req.params.entityId, points: 0, tier: 'bronze' } });
    }
    res.json({ success: true, data: karma });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Add/remove karma points
app.post('/api/karma/:entityId/points', async (req, res) => {
  try {
    const { points, reason, type } = req.body;
    const { tenantId } = req.query;

    let karma = await Karma.findOne({ entityId: req.params.entityId });

    if (!karma) {
      karma = new Karma({
        entityId: req.params.entityId,
        type: type || 'agent',
        points: 0,
        history: [],
        tenantId
      });
    }

    karma.points += points;
    karma.history.push({ action: reason || 'Adjustment', points, timestamp: new Date() });

    // Update tier based on points
    if (karma.points >= 10000) karma.tier = 'diamond';
    else if (karma.points >= 5000) karma.tier = 'platinum';
    else if (karma.points >= 2000) karma.tier = 'gold';
    else if (karma.points >= 500) karma.tier = 'silver';

    karma.updatedAt = new Date();
    await karma.save();

    res.json({ success: true, data: karma });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// TRANSACTION ENDPOINTS
// ============================================

// Create transaction
app.post('/api/transactions', async (req, res) => {
  try {
    const { from, to, type, amount, currency, reference, metadata, tenantId } = req.body;
    const transactionId = `TXN-${uuidv4().substring(0, 12).toUpperCase()}`;

    const transaction = new Transaction({
      transactionId,
      from,
      to,
      type,
      amount,
      currency: currency || 'INR',
      reference,
      metadata,
      status: 'pending',
      tenantId
    });

    await transaction.save();

    // Auto-complete small transactions
    if (amount < 10000) {
      transaction.status = 'completed';
      await transaction.save();
    }

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// List transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const { tenantId, from, to, status, type, page = 1, limit = 20 } = req.query;
    const filter: any = { tenantId };
    if (from) filter.from = from;
    if (to) filter.to = to;
    if (status) filter.status = status;
    if (type) filter.type = type;

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Transaction.countDocuments(filter);

    res.json({ success: true, data: transactions, pagination: { total, page: Number(page), limit: Number(limit) } });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Complete transaction
app.post('/api/transactions/:id/complete', async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { transactionId: req.params.id },
      { status: 'completed' },
      { new: true }
    );

    if (!transaction) return res.status(404).json({ success: false, error: 'Transaction not found' });

    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// FEE ENDPOINTS
// ============================================

// Set fee
app.post('/api/fees', async (req, res) => {
  try {
    const { type, rate, fixed, minAmount, maxAmount, tenantId } = req.body;
    const feeId = `FEE-${type.toUpperCase()}`;

    const fee = await Fee.findOneAndUpdate(
      { feeId },
      { type, rate, fixed, minAmount, maxAmount, tenantId },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: fee });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Get fees
app.get('/api/fees', async (req, res) => {
  try {
    const { tenantId, type } = req.query;
    const filter: any = { active: true };
    if (tenantId) filter.tenantId = tenantId;
    if (type) filter.type = type;

    const fees = await Fee.find(filter);
    res.json({ success: true, data: fees });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// SETTLEMENT ENDPOINT
// ============================================

// Calculate settlement
app.post('/api/settlement', async (req, res) => {
  try {
    const { from, to, amount, tenantId } = req.body;

    // Get applicable fees
    const fees = await Fee.find({ tenantId, type: 'transaction', active: true });
    let totalFee = 0;

    for (const fee of fees) {
      const percentageFee = (amount * (fee.rate || 0)) / 100;
      const fixedFee = fee.fixed || 0;
      totalFee += percentageFee + fixedFee;
    }

    const settlement = {
      grossAmount: amount,
      totalFee,
      netAmount: amount - totalFee,
      feeBreakdown: fees.map(f => ({
        type: f.type,
        rate: f.rate,
        amount: ((amount * (f.rate || 0)) / 100) + (f.fixed || 0)
      }))
    };

    res.json({ success: true, data: settlement });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Error handling
app.use((_, res) => res.status(404).json({ success: false, error: 'Not found' }));
app.use((err: Error, _, res: Response, _next: any) => {
  res.status(500).json({ success: false, error: err.message });
});

mongoose.connect(MONGODB_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`Economy OS running on port ${PORT}`);
  });
}).catch(err => {
  console.error('MongoDB connection failed:', err);
  process.exit(1);
});

export default app;
