/**
 * Zero Checkout Service
 * Port: 3817
 *
 * Automated checkout and payment processing for StayOwn hotels.
 * Enables guests to check out without visiting the front desk.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createClient, RedisClientType } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

// Configuration
const PORT = process.env.PORT || 3817;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stayown';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const JWT_SECRET = process.env.JWT_SECRET || 'zero-checkout-secret';

// External service URLs
const BILLING_SERVICE_URL = process.env.BILLING_SERVICE_URL || 'http://localhost:3816';
const EVENT_BUS_URL = process.env.EVENT_BUS_URL || 'http://localhost:3812';
const PAYMENT_GATEWAY_URL = process.env.PAYMENT_GATEWAY_URL || 'http://localhost:4000';

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/zero-checkout.log' })
  ]
});

// Redis client
let redis: RedisClientType;

// Schemas
const CheckoutSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  hotelId: { type: String, required: true, index: true },
  bookingId: { type: String, required: true },
  guestId: { type: String, required: true, index: true },
  roomId: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'billing_calculated', 'payment_initiated', 'payment_completed', 'checkout_complete', 'failed'],
    default: 'pending'
  },
  billing: {
    roomCharges: { type: Number, default: 0 },
    additionalCharges: { type: Number, default: 0 },
    minibarCharges: { type: Number, default: 0 },
    restaurantCharges: { type: Number, default: 0 },
    spaCharges: { type: Number, default: 0 },
    laundryCharges: { type: Number, default: 0 },
    otherCharges: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    discounts: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' }
  },
  payment: {
    method: { type: String },
    transactionId: { type: String },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'refunded'] },
    gateway: { type: String },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed },
    paidAt: { type: Date }
  },
  invoice: {
    invoiceNumber: { type: String },
    generatedAt: { type: Date },
    pdfUrl: { type: String }
  },
  departureTime: { type: Date },
  actualDepartureTime: { type: Date },
  digitalKey: {
    active: { type: Boolean, default: false },
    expiresAt: { type: Date },
    revokedAt: { type: Date }
  },
  guestNotified: {
    billingReady: { type: Boolean, default: false },
    paymentSuccess: { type: Boolean, default: false },
    checkoutComplete: { type: Boolean, default: false }
  },
  metadata: {
    checkInTime: { type: Date },
    expectedCheckOutTime: { type: Date },
    numberOfNights: { type: Number },
    loyaltyPointsEarned: { type: Number, default: 0 },
    loyaltyPointsRedeemed: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const CheckoutSession = mongoose.model('CheckoutSession', CheckoutSessionSchema);

// Express App
const app = express();
app.use(cors());
app.use(express.json());

// Auth middleware
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).hotelId = decoded.hotelId || decoded.hotel_id;
    (req as any).guestId = decoded.guestId || decoded.guest_id;
    (req as any).userType = decoded.userType || 'guest';
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Helper functions
async function emitEvent(event: any): Promise<void> {
  try {
    await fetch(`${EVENT_BUS_URL}/emit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
  } catch (error: any) {
    logger.error('Failed to emit event', { error: error.message });
  }
}

async function getGuestBillingData(hotelId: string, bookingId: string): Promise<any> {
  try {
    const response = await fetch(`${BILLING_SERVICE_URL}/bookings/${bookingId}/charges`, {
      headers: { 'Authorization': `Bearer ${JWT_SECRET}` }
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error: any) {
    logger.error('Failed to fetch billing data', { error: error.message });
  }
  return null;
}

async function processPayment(amount: number, method: string, guestId: string): Promise<any> {
  try {
    const response = await fetch(`${PAYMENT_GATEWAY_URL}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        method,
        customerId: guestId,
        description: 'StayOwn Hotel Checkout'
      })
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error: any) {
    logger.error('Payment processing failed', { error: error.message });
  }
  return null;
}

async function generateInvoice(session: any): Promise<any> {
  const invoiceNumber = `INV-${session.hotelId}-${Date.now()}`;
  return {
    invoiceNumber,
    generatedAt: new Date(),
    pdfUrl: `/invoices/${invoiceNumber}.pdf`
  };
}

// Routes

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'zero-checkout',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Initialize checkout session
app.post('/checkout/init', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { hotelId, guestId } = req as any;
    const { bookingId, roomId } = req.body;

    // Check if session already exists
    const existingSession = await CheckoutSession.findOne({
      bookingId,
      status: { $nin: ['checkout_complete', 'failed'] }
    });

    if (existingSession) {
      return res.json({
        sessionId: existingSession.sessionId,
        status: existingSession.status,
        message: 'Checkout session already exists'
      });
    }

    // Create new session
    const sessionId = uuidv4();
    const session = new CheckoutSession({
      sessionId,
      hotelId,
      bookingId,
      guestId,
      roomId,
      status: 'pending'
    });

    await session.save();

    // Get billing data
    const billingData = await getGuestBillingData(hotelId, bookingId);
    if (billingData) {
      session.billing = billingData;
      session.status = 'billing_calculated';
    }

    // Schedule auto-checkout (default: 11:00 AM)
    const scheduledDeparture = new Date();
    scheduledDeparture.setHours(11, 0, 0, 0);
    session.departureTime = scheduledDeparture;
    session.metadata.checkInTime = new Date();
    session.metadata.expectedCheckOutTime = scheduledDeparture;

    await session.save();

    // Emit event
    await emitEvent({
      type: 'checkout.session.created',
      source: 'zero-checkout',
      hotelId,
      guestId,
      roomId,
      payload: { sessionId, bookingId }
    });

    logger.info('Checkout session created', { sessionId, bookingId, guestId });

    res.status(201).json({
      sessionId,
      status: session.status,
      billing: session.billing,
      departureTime: session.departureTime
    });
  } catch (error: any) {
    logger.error('Failed to create checkout session', { error: error.message });
    res.status(500).json({ error: 'Failed to initiate checkout' });
  }
});

// Get checkout session status
app.get('/checkout/session/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await CheckoutSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      sessionId: session.sessionId,
      status: session.status,
      billing: session.billing,
      payment: session.payment,
      invoice: session.invoice,
      departureTime: session.departureTime,
      digitalKey: session.digitalKey
    });
  } catch (error: any) {
    logger.error('Failed to get checkout session', { error: error.message });
    res.status(500).json({ error: 'Failed to get checkout session' });
  }
});

// Refresh billing (for real-time updates)
app.post('/checkout/session/:sessionId/refresh-billing', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await CheckoutSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const billingData = await getGuestBillingData(session.hotelId, session.bookingId);
    if (billingData) {
      session.billing = billingData;
      await session.save();
    }

    res.json({
      sessionId,
      billing: session.billing
    });
  } catch (error: any) {
    logger.error('Failed to refresh billing', { error: error.message });
    res.status(500).json({ error: 'Failed to refresh billing' });
  }
});

// Initiate payment
app.post('/checkout/session/:sessionId/pay', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { method } = req.body; // 'upi', 'card', 'wallet', 'saved_card'

    const session = await CheckoutSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status === 'checkout_complete') {
      return res.status(400).json({ error: 'Checkout already completed' });
    }

    // Update status
    session.status = 'payment_initiated';
    session.payment = {
      method,
      status: 'processing',
      gateway: 'razorpay'
    };
    await session.save();

    // Process payment
    const paymentResult = await processPayment(session.billing.total, method, session.guestId);

    if (paymentResult && paymentResult.success) {
      session.payment.status = 'completed';
      session.payment.transactionId = paymentResult.transactionId;
      session.payment.gatewayResponse = paymentResult;
      session.payment.paidAt = new Date();
      session.status = 'payment_completed';
    } else {
      session.payment.status = 'failed';
      session.status = 'failed';
    }

    await session.save();

    // Emit events
    await emitEvent({
      type: session.payment.status === 'completed' ? 'checkout.payment.completed' : 'checkout.payment.failed',
      source: 'zero-checkout',
      hotelId: session.hotelId,
      guestId: session.guestId,
      payload: {
        sessionId,
        transactionId: session.payment.transactionId,
        amount: session.billing.total
      }
    });

    logger.info('Payment processed', {
      sessionId,
      status: session.payment.status,
      transactionId: session.payment.transactionId
    });

    res.json({
      sessionId,
      status: session.status,
      payment: session.payment,
      billing: session.billing
    });
  } catch (error: any) {
    logger.error('Failed to process payment', { error: error.message });
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// Complete checkout
app.post('/checkout/session/:sessionId/complete', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await CheckoutSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'payment_completed') {
      return res.status(400).json({ error: 'Payment must be completed first' });
    }

    // Generate invoice
    const invoice = await generateInvoice(session);
    session.invoice = invoice;
    session.status = 'checkout_complete';
    session.actualDepartureTime = new Date();

    // Calculate loyalty points
    const nightlyRate = session.billing.roomCharges / (session.metadata.numberOfNights || 1);
    session.metadata.loyaltyPointsEarned = Math.floor(nightlyRate / 10);

    await session.save();

    // Revoke digital key
    session.digitalKey = {
      active: false,
      expiresAt: session.departureTime,
      revokedAt: new Date()
    };
    await session.save();

    // Emit checkout complete event
    await emitEvent({
      type: 'guest.departure.checked-out',
      source: 'zero-checkout',
      hotelId: session.hotelId,
      guestId: session.guestId,
      roomId: session.roomId,
      payload: {
        sessionId,
        bookingId: session.bookingId,
        invoiceNumber: invoice.invoiceNumber,
        loyaltyPointsEarned: session.metadata.loyaltyPointsEarned
      }
    });

    logger.info('Checkout completed', { sessionId, guestId: session.guestId });

    res.json({
      success: true,
      sessionId,
      invoice,
      loyaltyPointsEarned: session.metadata.loyaltyPointsEarned,
      message: 'Checkout completed successfully. Thank you for staying with us!'
    });
  } catch (error: any) {
    logger.error('Failed to complete checkout', { error: error.message });
    res.status(500).json({ error: 'Failed to complete checkout' });
  }
});

// Auto-checkout trigger (called by scheduler)
app.post('/checkout/auto-process', async (req: Request, res: Response) => {
  try {
    const { hotelId, sessionId } = req.body;

    // Find sessions ready for auto-checkout
    const query: any = {
      status: 'billing_calculated',
      departureTime: { $lte: new Date() }
    };

    if (hotelId) query.hotelId = hotelId;
    if (sessionId) query.sessionId = sessionId;

    const sessions = await CheckoutSession.find(query);

    const results = [];
    for (const session of sessions) {
      try {
        // Process with saved payment method
        if (session.guestId) {
          const savedMethod = await redis.get(`guest:${session.guestId}:default_payment`);
          if (savedMethod) {
            session.status = 'payment_initiated';
            session.payment = {
              method: savedMethod,
              status: 'processing',
              gateway: 'razorpay'
            };
            await session.save();

            // Auto-charge
            const paymentResult = await processPayment(session.billing.total, savedMethod, session.guestId);

            if (paymentResult && paymentResult.success) {
              session.payment.status = 'completed';
              session.payment.transactionId = paymentResult.transactionId;
              session.payment.paidAt = new Date();
              session.status = 'checkout_complete';
              session.actualDepartureTime = new Date();

              const invoice = await generateInvoice(session);
              session.invoice = invoice;

              session.digitalKey = {
                active: false,
                expiresAt: session.departureTime,
                revokedAt: new Date()
              };

              await session.save();

              results.push({ sessionId: session.sessionId, status: 'completed' });
            } else {
              session.status = 'failed';
              await session.save();
              results.push({ sessionId: session.sessionId, status: 'failed' });
            }
          }
        }
      } catch (error: any) {
        logger.error('Auto-checkout failed for session', { sessionId: session.sessionId, error: error.message });
        results.push({ sessionId: session.sessionId, status: 'error', error: error.message });
      }
    }

    res.json({ processed: results.length, results });
  } catch (error: any) {
    logger.error('Auto-checkout processing failed', { error: error.message });
    res.status(500).json({ error: 'Failed to process auto-checkout' });
  }
});

// Get invoice
app.get('/checkout/invoice/:invoiceNumber', async (req: Request, res: Response) => {
  try {
    const { invoiceNumber } = req.params;

    const session = await CheckoutSession.findOne({ 'invoice.invoiceNumber': invoiceNumber });
    if (!session) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({
      invoice: session.invoice,
      billing: session.billing,
      guestId: session.guestId,
      hotelId: session.hotelId,
      roomId: session.roomId,
      checkInTime: session.metadata.checkInTime,
      checkOutTime: session.actualDepartureTime
    });
  } catch (error: any) {
    logger.error('Failed to get invoice', { error: error.message });
    res.status(500).json({ error: 'Failed to get invoice' });
  }
});

// Extend stay (request checkout time extension)
app.post('/checkout/session/:sessionId/extend', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { newDepartureTime } = req.body;

    const session = await CheckoutSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Update departure time
    session.departureTime = new Date(newDepartureTime);
    session.metadata.expectedCheckOutTime = session.departureTime;

    await session.save();

    // Emit event
    await emitEvent({
      type: 'guest.departure.extension-requested',
      source: 'zero-checkout',
      hotelId: session.hotelId,
      guestId: session.guestId,
      payload: {
        sessionId,
        newDepartureTime: session.departureTime
      }
    });

    res.json({
      sessionId,
      newDepartureTime: session.departureTime,
      message: 'Checkout time extended successfully'
    });
  } catch (error: any) {
    logger.error('Failed to extend checkout', { error: error.message });
    res.status(500).json({ error: 'Failed to extend checkout' });
  }
});

// Dashboard stats (for hotel staff)
app.get('/dashboard/stats', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.query;

    const query: any = {};
    if (hotelId) query.hotelId = hotelId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await CheckoutSession.aggregate([
      { $match: { hotelId: hotelId as string } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$billing.total' }
        }
      }
    ]);

    const todayCheckouts = await CheckoutSession.countDocuments({
      hotelId: hotelId as string,
      departureTime: { $lte: new Date(today.getTime() + 86400000) },
      status: { $ne: 'checkout_complete' }
    });

    const totalRevenue = await CheckoutSession.aggregate([
      { $match: { hotelId: hotelId as string, 'payment.status': 'completed' } },
      { $group: { _id: null, total: { $sum: '$billing.total' } } }
    ]);

    res.json({
      statusBreakdown: stats,
      todayPendingCheckouts: todayCheckouts,
      totalRevenue: totalRevenue[0]?.total || 0,
      timestamp: new Date()
    });
  } catch (error: any) {
    logger.error('Failed to get dashboard stats', { error: error.message });
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Start server
async function start(): Promise<void> {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Connect to Redis
    redis = createClient({ url: REDIS_URL });
    await redis.connect();
    logger.info('Connected to Redis');

    app.listen(PORT, () => {
      logger.info(`Zero Checkout Service started on port ${PORT}`);
      logger.info(💳 Zero Checkout Service running on port ${PORT}`);
    });
  } catch (error: any) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

start();
