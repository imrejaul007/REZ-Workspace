import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app: Express = express();
const PORT = process.env.PORT || 4180;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trust-scorer';

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(express.json());

// ============================================
// TRUST SCORE MODEL
// ============================================

const trustSchema = new mongoose.Schema({
  entityId: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ['supplier', 'buyer', 'agent', 'company'], required: true },

  // Overall Score (0-100)
  score: { type: Number, default: 50, min: 0, max: 100 },

  // Component Scores
  metrics: {
    creditScore: { type: Number, default: 50, weight: 0.25 },
    paymentHistory: { type: Number, default: 50, weight: 0.25 },
    disputeRate: { type: Number, default: 50, weight: 0.25 },
    deliverySuccess: { type: Number, default: 50, weight: 0.25 }
  },

  // Tier
  tier: { type: String, enum: ['enterprise', 'verified', 'conditional', 'review'], default: 'review' },

  // History
  history: [{
    score: Number,
    reason: String,
    updatedBy: String,
    timestamp: { type: Date, default: Date.now }
  }],

  // Risk flags
  riskFlags: [{
    type: String,
    severity: { type: String, enum: ['low', 'medium', 'high'] },
    description: String,
    raisedAt: { type: Date, default: Date.now }
  }],

  tenantId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

trustSchema.index({ tenantId: 1, tier: 1 });

const TrustScore = mongoose.model('TrustScore', trustSchema);

// ============================================
// PAYMENT HISTORY MODEL
// ============================================

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true, index: true },
  from: String,
  to: String,
  amount: Number,
  currency: String,
  status: { type: String, enum: ['paid', 'late', 'defaulted'], required: true },
  dueDate: Date,
  paidDate: Date,
  daysLate: { type: Number, default: 0 },
  tenantId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

paymentSchema.index({ from: 1, tenantId: 1 });
paymentSchema.index({ to: 1, tenantId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

// Health
app.get('/health', (_, res) => res.json({ status: 'healthy', service: 'trust-scorer', version: '1.0.0', timestamp: new Date().toISOString() }));
app.get('/health/ready', async (_, res) => {
  const status = mongoose.connection.readyState === 1 ? 'ready' : 'not_ready';
  res.status(status === 'ready' ? 200 : 503).json({ status });
});

app.get('/api/info', (_, res) => {
  res.json({
    service: 'trust-scorer',
    version: '1.0.0',
    description: 'Trust Scoring Service - Credit, Payment, Dispute, Delivery metrics',
    weights: { creditScore: '25%', paymentHistory: '25%', disputeRate: '25%', deliverySuccess: '25%' }
  });
});

// ============================================
// TRUST SCORE ENDPOINTS
// ============================================

/**
 * Get trust score
 */
app.get('/api/trust/:entityId', async (req, res) => {
  try {
    const { tenantId } = req.query;
    let trust = await TrustScore.findOne({ entityId: req.params.entityId, tenantId });

    if (!trust) {
      // Create default score
      trust = new TrustScore({
        entityId: req.params.entityId,
        type: 'company',
        score: 50,
        metrics: {
          creditScore: 50,
          paymentHistory: 50,
          disputeRate: 50,
          deliverySuccess: 50
        },
        tier: 'review',
        history: [],
        riskFlags: [],
        tenantId
      });
      await trust.save();
    }

    res.json({ success: true, data: trust });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Calculate trust score
 */
app.post('/api/trust/:entityId/calculate', async (req, res) => {
  try {
    const { tenantId } = req.query;
    const trust = await TrustScore.findOne({ entityId: req.params.entityId, tenantId });

    if (!trust) {
      return res.status(404).json({ success: false, error: 'Entity not found' });
    }

    // Recalculate from payment history
    const payments = await Payment.find({ to: req.params.entityId, tenantId });

    if (payments.length > 0) {
      const paid = payments.filter(p => p.status === 'paid').length;
      const late = payments.filter(p => p.status === 'late').length;
      const defaulted = payments.filter(p => p.status === 'defaulted').length;

      trust.metrics.paymentHistory = Math.round((paid / payments.length) * 100);
      trust.metrics.disputeRate = Math.round(((late + defaulted) / payments.length) * 100);
    }

    // Calculate weighted score
    trust.score = Math.round(
      trust.metrics.creditScore * 0.25 +
      trust.metrics.paymentHistory * 0.25 +
      trust.metrics.disputeRate * 0.25 +
      trust.metrics.deliverySuccess * 0.25
    );

    // Update tier
    if (trust.score >= 90) trust.tier = 'enterprise';
    else if (trust.score >= 80) trust.tier = 'verified';
    else if (trust.score >= 70) trust.tier = 'conditional';
    else trust.tier = 'review';

    // Add to history
    trust.history.unshift({
      score: trust.score,
      reason: 'Recalculated',
      timestamp: new Date()
    });
    trust.history = trust.history.slice(0, 100); // Keep last 100

    trust.updatedAt = new Date();
    await trust.save();

    res.json({ success: true, data: trust });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Update trust metrics
 */
app.put('/api/trust/:entityId', async (req, res) => {
  try {
    const { metrics, reason, tenantId } = req.body;
    const trust = await TrustScore.findOne({ entityId: req.params.entityId, tenantId });

    if (!trust) {
      return res.status(404).json({ success: false, error: 'Entity not found' });
    }

    if (metrics) {
      Object.assign(trust.metrics, metrics);

      // Recalculate score
      trust.score = Math.round(
        trust.metrics.creditScore * 0.25 +
        trust.metrics.paymentHistory * 0.25 +
        trust.metrics.disputeRate * 0.25 +
        trust.metrics.deliverySuccess * 0.25
      );

      trust.history.unshift({
        score: trust.score,
        reason: reason || 'Manual update',
        timestamp: new Date()
      });
    }

    trust.updatedAt = new Date();
    await trust.save();

    res.json({ success: true, data: trust });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Raise risk flag
 */
app.post('/api/trust/:entityId/flag', async (req, res) => {
  try {
    const { type, severity, description, tenantId } = req.body;
    const trust = await TrustScore.findOne({ entityId: req.params.entityId, tenantId });

    if (!trust) {
      return res.status(404).json({ success: false, error: 'Entity not found' });
    }

    trust.riskFlags.push({
      type,
      severity: severity || 'medium',
      description,
      raisedAt: new Date()
    });

    // Deduct score for high severity flags
    if (severity === 'high') {
      trust.score = Math.max(0, trust.score - 10);
    } else if (severity === 'medium') {
      trust.score = Math.max(0, trust.score - 5);
    }

    trust.updatedAt = new Date();
    await trust.save();

    res.json({ success: true, data: trust });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// PAYMENT ENDPOINTS
// ============================================

/**
 * Record payment
 */
app.post('/api/payments', async (req, res) => {
  try {
    const { from, to, amount, status, dueDate, paidDate, tenantId } = req.body;
    const paymentId = `PAY-${uuidv4().substring(0, 8).toUpperCase()}`;

    const daysLate = paidDate && dueDate
      ? Math.max(0, Math.ceil((new Date(paidDate).getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const payment = new Payment({
      paymentId,
      from,
      to,
      amount,
      currency: 'INR',
      status,
      dueDate,
      paidDate,
      daysLate,
      tenantId
    });

    await payment.save();

    // Recalculate trust score for recipient
    const trust = await TrustScore.findOne({ entityId: to, tenantId });
    if (trust) {
      const entityPayments = await Payment.find({ to, tenantId });
      const paid = entityPayments.filter(p => p.status === 'paid').length;
      trust.metrics.paymentHistory = Math.round((paid / entityPayments.length) * 100);
      trust.score = Math.round(
        trust.metrics.creditScore * 0.25 +
        trust.metrics.paymentHistory * 0.25 +
        trust.metrics.disputeRate * 0.25 +
        trust.metrics.deliverySuccess * 0.25
      );
      trust.history.unshift({
        score: trust.score,
        reason: `Payment ${status}`,
        timestamp: new Date()
      });
      await trust.save();
    }

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * List payments
 */
app.get('/api/payments', async (req, res) => {
  try {
    const { tenantId, from, to, status } = req.query;
    const filter: any = { tenantId };
    if (from) filter.from = from;
    if (to) filter.to = to;
    if (status) filter.status = status;

    const payments = await Payment.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: payments });
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
    console.log(`Trust Scorer running on port ${PORT}`);
  });
}).catch(err => {
  console.error('MongoDB connection failed:', err);
  process.exit(1);
});

export default app;
