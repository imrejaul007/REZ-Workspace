import { logger } from ;
/**
 * RisnaEstate - Booking Service
 *
 * Uses RABTUL services:
 * - RABTUL Payment (4001) for Razorpay payments
 * - RABTUL Wallet (4004) for refunds
 * - RABTUL Notification (4011) for alerts
 */

import express, { Request, Response } from 'express';
import mongoose, { Schema, Document } from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 4120;

app.use(express.json());
app.use(cors());
app.use(helmet());

// =============================================
// RABTUL SERVICE URLS
// =============================================

const RABTUL = {
  payment: process.env.RABTUL_PAYMENT_URL || 'http://localhost:4001',
  wallet: process.env.RABTUL_WALLET_URL || 'http://localhost:4004',
  notification: process.env.RABTUL_NOTIFICATION_URL || 'http://localhost:4011',
  auth: process.env.RABTUL_AUTH_URL || 'http://localhost:4002',
};

// =============================================
// BOOKING STATUS FSM
// =============================================

const STATUS = {
  INITIATED: 'initiated',
  PAYMENT_PENDING: 'payment_pending',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  DOCUMENT_PENDING: 'document_pending',
  DOCUMENT_VERIFIED: 'document_verified',
  BOOKING_CONFIRMED: 'booking_confirmed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

const TRANSITIONS: Record<string, string[]> = {
  [STATUS.INITIATED]: [STATUS.PAYMENT_PENDING, STATUS.CANCELLED],
  [STATUS.PAYMENT_PENDING]: [STATUS.PAYMENT_CONFIRMED, STATUS.CANCELLED],
  [STATUS.PAYMENT_CONFIRMED]: [STATUS.DOCUMENT_PENDING, STATUS.BOOKING_CONFIRMED],
  [STATUS.DOCUMENT_PENDING]: [STATUS.DOCUMENT_VERIFIED, STATUS.CANCELLED],
  [STATUS.DOCUMENT_VERIFIED]: [STATUS.BOOKING_CONFIRMED],
  [STATUS.BOOKING_CONFIRMED]: [],
  [STATUS.CANCELLED]: [STATUS.REFUNDED],
  [STATUS.REFUNDED]: []
};

// =============================================
// SCHEMAS
// =============================================

const BookingSchema = new Schema({
  bookingId: { type: String, unique: true, index: true },
  userId: { type: String, index: true },
  propertyId: { type: String, index: true },
  unitId: String,
  brokerId: String,
  influencerId: String,
  bookingType: { type: String, enum: ['buy', 'rent', 'token'] },
  status: { type: String, enum: Object.values(STATUS), default: STATUS.INITIATED },
  amount: {
    base: Number,
    taxes: Number,
    total: Number,
    currency: { type: String, default: 'AED' }
  },
  payment: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    paidAt: Date
  },
  documents: [{
    type: String,
    url: String,
    status: { type: String, enum: ['pending', 'verified', 'rejected'] },
    uploadedAt: Date
  }],
  timeline: [{ status: String, timestamp: Date, note: String }],
  referralCode: String,
  createdAt: Date,
  updatedAt: Date
});

const Booking = mongoose.model('Booking', BookingSchema);

// Unit hold to prevent double booking
const UnitHoldSchema = new Schema({
  unitId: { type: String, unique: true },
  bookingId: String,
  expiresAt: Date
});

const UnitHold = mongoose.model('UnitHold', UnitHoldSchema);

// =============================================
// HELPER: RABTUL INTEGRATION
// =============================================

async function createRABTULPayment(booking: any) {
  const res = await fetch(`${RABTUL.payment}/api/payments/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || ''
    },
    body: JSON.stringify({
      orderId: booking.bookingId,
      amount: booking.amount.total * 100,
      currency: booking.amount.currency,
      customer: { id: booking.userId },
      notes: { propertyId: booking.propertyId }
    })
  });
  const data = await res.json();
  return data.order?.razorpayOrderId || data.orderId;
}

async function sendRABTULNotification(userId: string, title: string, body: string) {
  await fetch(`${RABTUL.notification}/api/notifications/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, type: 'push', title, message: body })
  }).catch(console.error);
}

async function processRABTULRefund(bookingId: string, amount: number) {
  await fetch(`${RABTUL.wallet}/api/wallet/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || ''
    },
    body: JSON.stringify({ orderId: bookingId, amount })
  }).catch(console.error);
}

async function creditRABTULWallet(userId: string, amount: number, type: string) {
  await fetch(`${RABTUL.wallet}/api/wallet/credit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || ''
    },
    body: JSON.stringify({ userId, amount, type, source: 'booking' })
  }).catch(console.error);
}

// =============================================
// API ROUTES
// =============================================

app.get('/health', (req, res) => res.json({ service: 'booking', status: 'ok' }));

/**
 * Create booking
 * POST /api/bookings
 */
app.post('/api/bookings', async (req: Request, res: Response) => {
  try {
    const { userId, propertyId, unitId, brokerId, referralCode } = req.body;
    if (!userId || !propertyId) {
      return res.status(400).json({ error: 'userId and propertyId required' });
    }

    const bookingId = `RB${Date.now().toString(36).toUpperCase()}`;

    // Hold unit (30 min)
    if (unitId) {
      const held = await UnitHold.findOneAndUpdate(
        { unitId, expiresAt: { $gt: new Date() } },
        { unitId, bookingId, expiresAt: new Date(Date.now() + 30 * 60000) },
        { upsert: true, new: true }
      );
      if (held && held.bookingId !== bookingId) {
        return res.status(409).json({ error: 'Unit already held' });
      }
    }

    const booking = new Booking({
      bookingId,
      userId,
      propertyId,
      unitId,
      brokerId,
      referralCode,
      status: STATUS.INITIATED,
      amount: { base: 2500000, taxes: 125000, total: 2625000, currency: 'AED' },
      timeline: [{ status: STATUS.INITIATED, timestamp: new Date(), note: 'Booking initiated' }]
    });

    await booking.save();

    res.json({ success: true, booking });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Initiate payment via RABTUL
 * POST /api/bookings/:id/pay
 */
app.post('/api/bookings/:id/pay', async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.id });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (!TRANSITIONS[booking.status]?.includes(STATUS.PAYMENT_PENDING)) {
      return res.status(400).json({ error: 'Invalid status transition' });
    }

    // Use RABTUL Payment Service
    const razorpayOrderId = await createRABTULPayment(booking);

    booking.status = STATUS.PAYMENT_PENDING;
    booking.payment.razorpayOrderId = razorpayOrderId;
    booking.timeline.push({ status: STATUS.PAYMENT_PENDING, timestamp: new Date(), note: 'Payment initiated' });
    await booking.save();

    res.json({ success: true, booking, razorpayOrderId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Confirm payment (webhook or callback)
 * POST /api/bookings/:id/confirm
 */
app.post('/api/bookings/:id/confirm', async (req: Request, res: Response) => {
  try {
    const { razorpayPaymentId, razorpaySignature } = req.body;
    const booking = await Booking.findOne({ bookingId: req.params.id });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Verify webhook signature
    if (razorpaySignature && process.env.RAZORPAY_WEBHOOK_SECRET) {
      const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(`${booking.payment.razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (expected !== razorpaySignature) {
        return res.status(400).json({ error: 'Invalid signature' });
      }
    }

    booking.status = STATUS.PAYMENT_CONFIRMED;
    booking.payment.razorpayPaymentId = razorpayPaymentId;
    booking.payment.paidAt = new Date();
    booking.timeline.push({ status: STATUS.PAYMENT_CONFIRMED, timestamp: new Date(), note: 'Payment confirmed' });
    await booking.save();

    await sendRABTULNotification(booking.userId, 'Payment Confirmed! 🎉', `Booking ${booking.bookingId} confirmed`);

    res.json({ success: true, booking });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Upload document
 * POST /api/bookings/:id/documents
 */
app.post('/api/bookings/:id/documents', async (req: Request, res: Response) => {
  try {
    const { type, url } = req.body;
    const booking = await Booking.findOne({ bookingId: req.params.id });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    booking.documents.push({ type, url, status: 'pending', uploadedAt: new Date() });
    booking.status = STATUS.DOCUMENT_PENDING;
    await booking.save();

    res.json({ success: true, booking });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Verify document
 * PATCH /api/bookings/:id/documents/:docId
 */
app.patch('/api/bookings/:id/documents/:docId', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findOne({ bookingId: req.params.id });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const doc = booking.documents.id(req.params.docId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    doc.status = status;
    await booking.save();

    res.json({ success: true, booking });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Confirm booking
 * POST /api/bookings/:id/confirm-booking
 */
app.post('/api/bookings/:id/confirm-booking', async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.id });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (!TRANSITIONS[booking.status]?.includes(STATUS.BOOKING_CONFIRMED)) {
      return res.status(400).json({ error: 'Cannot confirm from current status' });
    }

    booking.status = STATUS.BOOKING_CONFIRMED;
    booking.timeline.push({ status: STATUS.BOOKING_CONFIRMED, timestamp: new Date(), note: 'Booking confirmed!' });
    await booking.save();

    // Credit referral earnings
    if (booking.referralCode) {
      await creditRABTULWallet(booking.userId, 5000, 'referral_bonus');
    }

    await sendRABTULNotification(booking.userId, 'Booking Confirmed! 🏠', `Booking ${booking.bookingId} confirmed!`);

    res.json({ success: true, booking });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Cancel booking
 * POST /api/bookings/:id/cancel
 */
app.post('/api/bookings/:id/cancel', async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.id });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (!TRANSITIONS[booking.status]?.includes(STATUS.CANCELLED)) {
      return res.status(400).json({ error: 'Cannot cancel from current status' });
    }

    booking.status = STATUS.CANCELLED;
    booking.timeline.push({ status: STATUS.CANCELLED, timestamp: new Date(), note: req.body.reason || 'Cancelled' });
    await booking.save();

    // Release unit hold
    if (booking.unitId) {
      await UnitHold.deleteOne({ unitId: booking.unitId });
    }

    // Process refund via RABTUL
    if (booking.payment.razorpayPaymentId) {
      await processRABTULRefund(booking.bookingId, booking.amount.total);
    }

    await sendRABTULNotification(booking.userId, 'Booking Cancelled', `Booking ${booking.bookingId} cancelled`);

    res.json({ success: true, booking });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get booking
 * GET /api/bookings/:id
 */
app.get('/api/bookings/:id', async (req, res) => {
  const booking = await Booking.findOne({ bookingId: req.params.id });
  if (!booking) return res.status(404).json({ error: 'Not found' });
  res.json({ booking });
});

/**
 * Get user bookings
 * GET /api/bookings/user/:userId
 */
app.get('/api/bookings/user/:userId', async (req, res) => {
  const bookings = await Booking.find({ userId: req.params.userId }).sort({ createdAt: -1 });
  res.json({ bookings });
});

/**
 * Get stats
 * GET /api/bookings/stats
 */
app.get('/api/bookings/stats', async (req, res) => {
  const stats = await Booking.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount.total' } } }
  ]);
  const today = await Booking.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } });
  res.json({ stats, todayBookings: today });
});

// =============================================
// RAZORPAY WEBHOOK
// =============================================

app.post('/api/webhooks/razorpay', async (req, res) => {
  try {
    const event = req.body.event;
    const payload = req.body.payload;
    const orderId = payload?.order?.entity?.receipt;

    logger.info(`Webhook: ${event}`, { orderId });

    if (event === 'payment.captured' && orderId) {
      const booking = await Booking.findOne({ bookingId: orderId });
      if (booking) {
        booking.status = STATUS.PAYMENT_CONFIRMED;
        booking.payment.razorpayPaymentId = payload.payment.entity.id;
        booking.payment.paidAt = new Date();
        await booking.save();
        await sendRABTULNotification(booking.userId, 'Payment Confirmed! 🎉', `Booking ${booking.bookingId} confirmed`);
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    logger.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// START
// =============================================

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/risna-booking');
    logger.info('✅ Connected to MongoDB');
    await Booking.createIndexes();
    app.listen(PORT, () => logger.info(`🚀 Booking Service running on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;
