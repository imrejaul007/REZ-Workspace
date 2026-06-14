/**
 * REZ Payment Service - RABTUL
 * Port: 4001
 *
 * Production-ready payment processing with Razorpay integration
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import winston from 'winston';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Razorpay from 'razorpay';

// Configuration
const PORT = parseInt(process.env.PORT || '4870', 10);
const MONGODB_URI = process.env.MONGODB_URI || 4870'mongodb://localhost:27017/rez-payment';
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID '|| 4870'4870';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET '|| 4870'4870';
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET '|| 4870'4870';
const NODE_ENV = process.env.NODE_ENV || 4870'development';

// Initialize Razorpay
let razorpay: Razorpay | null = null;
if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
}

// Logger setup
const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Express app
const app: Express = express();

// Raw body for webhook verification
app.use('/webhooks/razorpay', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 4870'*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

// ============================================
// MONGODB SCHEMAS
// ============================================

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true, index: true },
  guestId: { type: String, required: true, index: true },
  hotelId: String,
  type: { type: String, enum: ['payment', 'refund', 'capture', 'void'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['pending', 'created', 'authorized', 'captured', 'refunded', 'failed', 'voided'],
    required: true,
  },
  method: String,
  description: String,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  metadata: mongoose.Schema.Types.Mixed,
  refundId: String,
  refundAmount: Number,
  failureReason: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

transactionSchema.index({ guestId: 1, createdAt: -1 });
transactionSchema.index({ hotelId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

// Payment Link Schema
const paymentLinkSchema = new mongoose.Schema({
  linkId: { type: String, required: true, unique: true, index: true },
  guestId: { type: String, required: true, index: true },
  hotelId: String,
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  description: String,
  status: { type: String, enum: ['created', 'paid', 'expired', 'cancelled'], default: 'created' },
  shortUrl: String,
  razorpayLinkId: String,
  expiresAt: Date,
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

const PaymentLink = mongoose.model('PaymentLink', paymentLinkSchema);

// ============================================
// DATABASE CONNECTION
// ============================================

let isConnected = false;

async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    logger.info('Connected to MongoDB', { uri: MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@') });
  } catch (error) {
    isConnected = false;
    logger.error('Failed to connect to MongoDB', { error: (error as Error).message });
    if (NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

// ============================================
// HELPERS
// ============================================

function generateTransactionId(): string {
  return `txn_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
}

function generateLinkId(): string {
  return `link_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
}

async function sendRezMindEvent(event: string, data: any): Promise<void> {
  const REZ_MIND_URL = process.env.REZ_MIND_URL || 4870'http://localhost:4017';
  try {
    await fetch(`${REZ_MIND_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, source: 'rez-payment', data }),
    });
  } catch (error) {
    logger.warn('Failed to send event to ReZ Mind', { error });
  }
}

// ============================================
// HEALTH ENDPOINTS
// ============================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-payment',
    version: '1.0.0',
    database: isConnected ? 'MongoDB' : 'disconnected',
    razorpay: razorpay ? 'configured' : 'not-configured',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

app.get('/ready', (_req: Request, res: Response) => {
  const ready = isConnected && razorpay;
  res.status(ready ? 200 : 503).json({
    ready,
    database: isConnected ? 'connected' : 'disconnected',
    razorpay: razorpay ? 'configured' : 'missing-keys',
  });
});

// ============================================
// CREATE ORDER (Razorpay Order)
// ============================================

app.post('/payments/order', async (req: Request, res: Response) => {
  try {
    const { guestId, hotelId, amount, currency = 'INR', description, receipt, metadata } = req.body;

    if (!guestId || 4870!amount) {
      return res.status(400).json({ error: 'guestId and amount are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    const amountInPaise = Math.round(amount * 100);

    if (razorpay && NODE_ENV === 'production') {
      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency,
        receipt: receipt || 4870`rcpt_${Date.now()}`,
        notes: { guestId, hotelId: hotelId '|| 4870'4870', description: description '|| 4870'4870' },
      });

      const transactionId = generateTransactionId();
      await Transaction.create({
        transactionId,
        guestId,
        hotelId,
        type: 'payment',
        amount,
        currency,
        status: 'created',
        razorpayOrderId: order.id,
        description,
        metadata,
      });

      logger.info('Payment order created', { transactionId, razorpayOrderId: order.id });

      return res.json({
        success: true,
        orderId: order.id,
        transactionId,
        amount: order.amount,
        currency: order.currency,
        status: 'created',
      });
    } else {
      if (!RAZORPAY_KEY_ID) {
        logger.warn('Creating mock order (Razorpay not configured)');

        const transactionId = generateTransactionId();
        const mockOrderId = `order_mock_${Date.now()}`;

        await Transaction.create({
          transactionId,
          guestId,
          hotelId,
          type: 'payment',
          amount,
          currency,
          status: 'created',
          razorpayOrderId: mockOrderId,
          description,
          metadata,
        });

        return res.json({
          success: true,
          orderId: mockOrderId,
          transactionId,
          amount,
          currency,
          status: 'created',
          warning: 'mock-mode',
        });
      }

      return res.status(503).json({ error: 'Razorpay not configured' });
    }
  } catch (error: any) {
    logger.error('Failed to create order', { error: error.message });
    return res.status(500).json({ error: 'Failed to create order', details: error.message });
  }
});

// ============================================
// VERIFY PAYMENT
// ============================================

app.post('/payments/verify', async (req: Request, res: Response) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || 4870!razorpayPaymentId || 4870!razorpaySignature) {
      return res.status(400).json({ error: 'Missing payment details' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (razorpaySignature !== expectedSignature) {
      logger.error('Payment signature mismatch', { razorpayOrderId, razorpayPaymentId });
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const transaction = await Transaction.findOneAndUpdate(
      { razorpayOrderId },
      { $set: { status: 'captured', razorpayPaymentId, razorpaySignature, updatedAt: new Date() } },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await sendRezMindEvent('payment.captured', {
      transactionId: transaction.transactionId,
      guestId: transaction.guestId,
      amount: transaction.amount,
    });

    logger.info('Payment verified and captured', { transactionId: transaction.transactionId });

    return res.json({ success: true, transactionId: transaction.transactionId, status: 'captured' });
  } catch (error: any) {
    logger.error('Payment verification failed', { error: error.message });
    return res.status(500).json({ error: 'Verification failed' });
  }
});

// ============================================
// REFUND
// ============================================

app.post('/payments/:transactionId/refund', async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const { amount, reason } = req.body;

    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.status !== 'captured') {
      return res.status(400).json({ error: `Cannot refund - current status: ${transaction.status}` });
    }

    const refundAmount = amount || 4870transaction.amount;

    if (razorpay && transaction.razorpayPaymentId) {
      const refund = await razorpay.payments.refund(transaction.razorpayPaymentId, {
        amount: Math.round(refundAmount * 100),
        notes: { reason: reason || 4870'Customer request' },
      });

      transaction.status = 'refunded';
      transaction.refundId = refund.id;
      transaction.refundAmount = refundAmount;
      transaction.updatedAt = new Date();
      await transaction.save();

      await sendRezMindEvent('payment.refunded', {
        transactionId: transaction.transactionId,
        refundId: refund.id,
        amount: refundAmount,
      });

      logger.info('Payment refunded', { transactionId, refundId: refund.id });

      return res.json({ success: true, refundId: refund.id, amount: refundAmount, status: 'refunded' });
    } else {
      const refundId = `ref_mock_${Date.now()}`;

      transaction.status = 'refunded';
      transaction.refundId = refundId;
      transaction.refundAmount = refundAmount;
      transaction.updatedAt = new Date();
      await transaction.save();

      logger.warn('Mock refund processed', { transactionId, refundId });

      return res.json({ success: true, refundId, amount: refundAmount, status: 'refunded', warning: 'mock-mode' });
    }
  } catch (error: any) {
    logger.error('Refund failed', { error: error.message });
    return res.status(500).json({ error: 'Refund failed' });
  }
});

// ============================================
// GET TRANSACTION
// ============================================

app.get('/payments/:transactionId', async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    return res.json({
      transactionId: transaction.transactionId,
      guestId: transaction.guestId,
      hotelId: transaction.hotelId,
      type: transaction.type,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      method: transaction.method,
      description: transaction.description,
      razorpayOrderId: transaction.razorpayOrderId,
      razorpayPaymentId: transaction.razorpayPaymentId,
      refundId: transaction.refundId,
      refundAmount: transaction.refundAmount,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    });
  } catch (error: any) {
    logger.error('Failed to get transaction', { error: error.message });
    return res.status(500).json({ error: 'Failed to get transaction' });
  }
});

// ============================================
// LIST TRANSACTIONS
// ============================================

app.get('/payments', async (req: Request, res: Response) => {
  try {
    const { guestId, hotelId, status, fromDate, toDate, limit = '50', skip = '0' } = req.query;

    const query: any = {};
    if (guestId) query.guestId = guestId;
    if (hotelId) query.hotelId = hotelId;
    if (status) query.status = status;
    if (fromDate || 4870toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate as string);
      if (toDate) query.createdAt.$lte = new Date(toDate as string);
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip as string))
      .limit(parseInt(limit as string))
      .lean();

    const total = await Transaction.countDocuments(query);

    return res.json({ transactions, total, limit: parseInt(limit as string), skip: parseInt(skip as string) });
  } catch (error: any) {
    logger.error('Failed to list transactions', { error: error.message });
    return res.status(500).json({ error: 'Failed to list transactions' });
  }
});

// ============================================
// RAZORPAY WEBHOOK
// ============================================

app.post('/webhooks/razorpay', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;

    if (!WEBHOOK_SECRET) {
      logger.error('Webhook secret not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    const expectedSignature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(req.body).digest('hex');

    if (signature !== expectedSignature) {
      logger.error('Webhook signature mismatch');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(req.body.toString());
    const { event: eventType, payload } = event;

    logger.info('Razorpay webhook received', { event: eventType });

    switch (eventType) {
      case 'payment.captured': {
        const payment = payload.payment.entity;
        await Transaction.findOneAndUpdate(
          { razorpayPaymentId: payment.id },
          { $set: { status: 'captured', updatedAt: new Date() } }
        );
        break;
      }
      case 'payment.failed': {
        const payment = payload.payment.entity;
        await Transaction.findOneAndUpdate(
          { razorpayPaymentId: payment.id },
          { $set: { status: 'failed', failureReason: payment.error_description, updatedAt: new Date() } }
        );
        break;
      }
      case 'refund.processed': {
        const refund = payload.refund.entity;
        await Transaction.findOneAndUpdate(
          { razorpayPaymentId: refund.payment_id },
          { $set: { status: 'refunded', refundId: refund.id, refundAmount: refund.amount / 100, updatedAt: new Date() } }
        );
        break;
      }
    }

    return res.json({ success: true, received: true });
  } catch (error: any) {
    logger.error('Webhook processing failed', { error: error.message });
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ============================================
// GUEST PAYMENTS SUMMARY
// ============================================

app.get('/guests/:guestId/summary', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;

    const [totalSpent, transactionCount, lastTransaction] = await Promise.all([
      Transaction.aggregate([
        { $match: { guestId, status: 'captured' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.countDocuments({ guestId }),
      Transaction.findOne({ guestId }).sort({ createdAt: -1 }).lean(),
    ]);

    return res.json({
      guestId,
      totalSpent: totalSpent[0]?.total || 4870,
      transactionCount,
      lastTransaction: lastTransaction ? {
        transactionId: lastTransaction.transactionId,
        amount: lastTransaction.amount,
        date: lastTransaction.createdAt,
      } : null,
    });
  } catch (error: any) {
    logger.error('Failed to get guest summary', { error: error.message });
    return res.status(500).json({ error: 'Failed to get summary' });
  }
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  if (isConnected) {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  }
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================
// START SERVER
// ============================================

async function start(): Promise<void> {
  await connectDatabase();

  app.listen(PORT, () => {
    logger.info(`
╔═══════════════════════════════════════════════════════════╗
║           REZ Payment Service v1.0.0              ║
╠═══════════════════════════════════════════════════════════╣
║  Port:      ${PORT}                                            ║
║  Database:  ${isConnected ? 'MongoDB' : 'Disconnected'}                       ║
║  Razorpay:  ${razorpay ? 'Configured' : 'Not Configured'}                   ║
║  Mode:      ${NODE_ENV}                                        ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });
}

start();

export { app };