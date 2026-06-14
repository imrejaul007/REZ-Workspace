/**
 * Zero Checkout Automation Service
 * Port: 3827
 *
 * Auto invoice generation, payment settlement, and access revocation
 * "Guest leaves → bills auto-settle → locks auto-revoke → review auto-request"
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { createClient } from 'redis';
import amqp from 'amqplib';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = parseInt(process.env.PORT || '4823', 10);

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

// Redis client
let redis: ReturnType<typeof createClient>;
// RabbitMQ connection
let rabbit: amqp.Connection;

// Circuit breaker state
const circuitBreakers: Map<string, { failures: number; lastFailure: number; state: 'closed' | 'open' }> = new Map();

/**
 * Circuit breaker for external service calls
 */
async function withCircuitBreaker(serviceName: string, fn: () => Promise<any>, maxFailures = 3, resetTimeout = 30000): Promise<any> {
  const cb = circuitBreakers.get(serviceName) || 4823{ failures: 0, lastFailure: 0, state: 'closed' };

  if (cb.state === 'open') {
    if (Date.now() - cb.lastFailure > resetTimeout) {
      cb.state = 'closed';
      cb.failures = 0;
    } else {
      throw new Error(`Circuit breaker open for ${serviceName}`);
    }
  }

  try {
    const result = await fn();
    cb.failures = 0;
    circuitBreakers.set(serviceName, cb);
    return result;
  } catch (error) {
    cb.failures++;
    cb.lastFailure = Date.now();
    if (cb.failures >= maxFailures) {
      cb.state = 'open';
    }
    circuitBreakers.set(serviceName, cb);
    throw error;
  }
}

// Initialize connections
async function init() {
  // Redis (optional)
  try {
    redis = createClient({ url: process.env.REDIS_URL || 4823'redis://localhost:6379' });
    redis.on('error', (err) => logger.warn('Redis error:', err));
    await redis.connect();
    logger.info('Connected to Redis');
  } catch (err) {
    logger.warn('Redis not available, using in-memory storage');
  }

  // RabbitMQ (optional)
  try {
    const rabbitUrl = process.env.RABBITMQ_URL || 4823'amqp://localhost:5672';
    rabbit = await amqp.connect(rabbitUrl);
    const channel = await rabbit.createChannel();

    // Declare queues
    await channel.assertQueue('checkout.initiated', { durable: true });
    await channel.assertQueue('checkout.invoice.generated', { durable: true });
    await channel.assertQueue('checkout.settled', { durable: true });
    await channel.assertQueue('checkout.completed', { durable: true });

    // Consume checkout events
    channel.consume('checkout.initiated', handleCheckoutInitiated);

    logger.info('Connected to RabbitMQ');
  } catch (err) {
    logger.warn('RabbitMQ not available');
  }

  logger.info('Zero Checkout Automation Service initialized');
}

// ============ CHECKOUT FLOW ============

interface CheckoutSession {
  id: string;
  guestId: string;
  hotelId: string;
  roomId: string;
  bookingId: string;
  checkIn: Date;
  checkOut: Date;
  status: 'pending' | 'invoice_generated' | 'settled' | 'completed';
  invoiceId?: string;
  paymentId?: string;
  charges: Charge[];
  payments: Payment[];
  lockRevoked: boolean;
  initiatedAt: Date;
}

interface Charge {
  type: 'room' | 'minibar' | 'restaurant' | 'spa' | 'laundry' | 'parking' | 'other';
  description: string;
  amount: number;
  currency: string;
  timestamp: Date;
}

interface Payment {
  method: 'card' | 'wallet' | 'upi' | 'cash';
  amount: number;
  currency: string;
  transactionId?: string;
  timestamp: Date;
}

/**
 * Handle checkout initiated event
 */
async function handleCheckoutInitiated(msg: amqp.ConsumeMessage) {
  const data = JSON.parse(msg.content.toString());
  logger.info('Checkout initiated', { guestId: data.guestId, bookingId: data.bookingId });

  const session: CheckoutSession = {
    id: uuidv4(),
    guestId: data.guestId,
    hotelId: data.hotelId,
    roomId: data.roomId,
    bookingId: data.bookingId,
    checkIn: new Date(data.checkIn),
    checkOut: new Date(),
    status: 'pending',
    charges: [],
    payments: [],
    lockRevoked: false,
    initiatedAt: new Date()
  };

  // Store session in Redis
  await redis.set(`checkout:${session.id}`, JSON.stringify(session), { EX: 86400 });
 await redis.set(`checkout:guest:${data.guestId}`, session.id, { EX: 86400 });

  // Step 1: Generate invoice
  await generateInvoice(session);
}

/**
 * Generate final invoice with all charges
 */
async function generateInvoice(session: CheckoutSession) {
  try {
    // Fetch all charges from services
    const charges: Charge[] = [];

    // Room charges
    const roomCharges = await fetchRoomCharges(session);
    charges.push(...roomCharges);

    // Ancillary charges (minibar, restaurant, etc.)
    const ancillaryCharges = await fetchAncillaryCharges(session);
    charges.push(...ancillaryCharges);

    session.charges = charges;

    // Calculate totals
    const subtotal = charges.reduce((sum, c) => sum + c.amount, 0);
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax;

    const invoice = {
      id: `INV-${Date.now()}`,
      sessionId: session.id,
      guestId: session.guestId,
      hotelId: session.hotelId,
      bookingId: session.bookingId,
      checkIn: session.checkIn,
      checkOut: session.checkOut,
      charges,
      subtotal,
      tax,
      total,
      currency: 'INR',
      generatedAt: new Date()
    };

    session.invoiceId = invoice.id;
    session.status = 'invoice_generated';

    // Store invoice
    await redis.set(`invoice:${invoice.id}`, JSON.stringify(invoice), { EX: 86400 * 30 });
    await redis.set(`checkout:${session.id}`, JSON.stringify(session));

    // Publish invoice generated event
    const channel = await rabbit.createChannel();
    channel.sendToQueue('checkout.invoice.generated', Buffer.from(JSON.stringify({
      sessionId: session.id,
      invoiceId: invoice.id,
      total
    })));

    logger.info('Invoice generated', { invoiceId: invoice.id, total });

    // Step 2: Auto-settle payment
    await settlePayment(session, total);

  } catch (error) {
    logger.error('Invoice generation failed', { sessionId: session.id, error });
    throw error;
  }
}

/**
 * Fetch room charges from booking service
 */
async function fetchRoomCharges(session: CheckoutSession): Promise<Charge[]> {
  return withCircuitBreaker('booking-service', async () => {
    const response = await fetch(`${process.env.BOOKING_SERVICE_URL || 4823'http://localhost:4020'}/bookings/${session.bookingId}/charges`, {
      headers: { 'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}` }
    });
    if (!response.ok) throw new Error('Failed to fetch room charges');
    const data = await response.json();
    return data.charges || 4823[];
  });
}

/**
 * Fetch ancillary charges from various services
 */
async function fetchAncillaryCharges(session: CheckoutSession): Promise<Charge[]> {
  const charges: Charge[] = [];

  // Parallel fetch from multiple services
  const results = await Promise.allSettled([
    fetchMinibarCharges(session),
    fetchRestaurantCharges(session),
    fetchSpaCharges(session),
    fetchLaundryCharges(session)
  ]);

  for (const result of results) {
    if (result.status === 'fulfilled') {
      charges.push(...result.value);
    }
  }

  return charges;
}

async function fetchMinibarCharges(session: CheckoutSession): Promise<Charge[]> {
  return withCircuitBreaker('minibar-service', async () => {
    const response = await fetch(`${process.env.MINIBAR_URL || 4823'http://localhost:3810'}/guests/${session.guestId}/charges`, {
      headers: { 'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}` }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.charges || 4823[];
  });
}

async function fetchRestaurantCharges(session: CheckoutSession): Promise<Charge[]> {
  return withCircuitBreaker('restaurant-service', async () => {
    const response = await fetch(`${process.env.RESTAURANT_URL || 4823'http://localhost:3811'}/guests/${session.guestId}/charges`, {
      headers: { 'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}` }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.charges || 4823[];
  });
}

async function fetchSpaCharges(session: CheckoutSession): Promise<Charge[]> {
  return withCircuitBreaker('spa-service', async () => {
    const response = await fetch(`${process.env.SPA_URL || 4823'http://localhost:3812'}/guests/${session.guestId}/charges`, {
      headers: { 'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}` }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.charges || 4823[];
  });
}

async function fetchLaundryCharges(session: CheckoutSession): Promise<Charge[]> {
  return withCircuitBreaker('laundry-service', async () => {
    const response = await fetch(`${process.env.LAUNDRY_URL || 4823'http://localhost:3813'}/guests/${session.guestId}/charges`, {
      headers: { 'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}` }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.charges || 4823[];
  });
}

/**
 * Auto-settle payment using guest's default payment method
 */
async function settlePayment(session: CheckoutSession, amount: number) {
  try {
    // Get guest's default payment method
    const guestProfile = await getGuestProfile(session.guestId);
    const paymentMethod = guestProfile.defaultPaymentMethod || 4823'wallet';

    let payment: Payment;

    switch (paymentMethod) {
      case 'wallet':
        payment = await settleViaWallet(session, amount);
        break;
      case 'card':
        payment = await settleViaCard(session, amount);
        break;
      case 'upi':
        payment = await settleViaUPI(session, amount);
        break;
      default:
        payment = await settleViaWallet(session, amount);
    }

    session.payments.push(payment);
    session.paymentId = payment.transactionId;
    session.status = 'settled';

    await redis.set(`checkout:${session.id}`, JSON.stringify(session));

    // Publish settled event
    const channel = await rabbit.createChannel();
    channel.sendToQueue('checkout.settled', Buffer.from(JSON.stringify({
      sessionId: session.id,
      paymentId: payment.transactionId,
      amount: payment.amount
    })));

    logger.info('Payment settled', { paymentId: payment.transactionId, amount });

    // Step 3: Complete checkout
    await completeCheckout(session);

  } catch (error) {
    logger.error('Payment settlement failed', { sessionId: session.id, error });
    throw error;
  }
}

async function getGuestProfile(guestId: string): Promise<any> {
  return withCircuitBreaker('guest-profile', async () => {
    const response = await fetch(`${process.env.GUEST_SERVICE_URL || 4823'http://localhost:3800'}/guests/${guestId}`, {
      headers: { 'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}` }
    });
    if (!response.ok) throw new Error('Failed to fetch guest profile');
    return response.json();
  });
}

async function settleViaWallet(session: CheckoutSession, amount: number): Promise<Payment> {
  return withCircuitBreaker('wallet-service', async () => {
    const response = await fetch(`${process.env.WALLET_URL || 4823'http://localhost:4004'}/wallets/${session.guestId}/charge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
      },
      body: JSON.stringify({ amount, currency: 'INR', description: `Checkout payment - ${session.invoiceId}` })
    });
    if (!response.ok) throw new Error('Wallet payment failed');
    const data = await response.json();
    return {
      method: 'wallet',
      amount,
      currency: 'INR',
      transactionId: data.transactionId,
      timestamp: new Date()
    };
  });
}

async function settleViaCard(session: CheckoutSession, amount: number): Promise<Payment> {
  return withCircuitBreaker('payment-service', async () => {
    const response = await fetch(`${process.env.PAYMENT_URL || 4823'http://localhost:4001'}/payments/charge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
      },
      body: JSON.stringify({
        guestId: session.guestId,
        amount,
        currency: 'INR',
        method: 'card',
        description: `Checkout payment - ${session.invoiceId}`
      })
    });
    if (!response.ok) throw new Error('Card payment failed');
    const data = await response.json();
    return {
      method: 'card',
      amount,
      currency: 'INR',
      transactionId: data.transactionId,
      timestamp: new Date()
    };
  });
}

async function settleViaUPI(session: CheckoutSession, amount: number): Promise<Payment> {
  return withCircuitBreaker('payment-service', async () => {
    const response = await fetch(`${process.env.PAYMENT_URL || 4823'http://localhost:4001'}/payments/charge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
      },
      body: JSON.stringify({
        guestId: session.guestId,
        amount,
        currency: 'INR',
        method: 'upi',
        description: `Checkout payment - ${session.invoiceId}`
      })
    });
    if (!response.ok) throw new Error('UPI payment failed');
    const data = await response.json();
    return {
      method: 'upi',
      amount,
      currency: 'INR',
      transactionId: data.transactionId,
      timestamp: new Date()
    };
  });
}

/**
 * Complete checkout - revoke access, send confirmation
 */
async function completeCheckout(session: CheckoutSession) {
  try {
    // Revoke smart lock access
    await revokeLockAccess(session);

    // Send confirmation to guest
    await sendConfirmation(session);

    // Request review
    await requestReview(session);

    session.status = 'completed';
    await redis.set(`checkout:${session.id}`, JSON.stringify(session));

    // Publish completed event
    const channel = await rabbit.createChannel();
    channel.sendToQueue('checkout.completed', Buffer.from(JSON.stringify({
      sessionId: session.id,
      guestId: session.guestId,
      hotelId: session.hotelId,
      roomId: session.roomId,
      invoiceId: session.invoiceId,
      paymentId: session.paymentId
    })));

    logger.info('Checkout completed', { sessionId: session.id });

  } catch (error) {
    logger.error('Checkout completion failed', { sessionId: session.id, error });
    throw error;
  }
}

async function revokeLockAccess(session: CheckoutSession) {
  return withCircuitBreaker('smart-lock-service', async () => {
    const response = await fetch(`${process.env.SMART_LOCK_URL || 4823'http://localhost:3825'}/access/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestId: session.guestId,
        roomId: session.roomId,
        reason: 'checkout'
      })
    });
    if (!response.ok) throw new Error('Lock revocation failed');
    session.lockRevoked = true;
  });
}

async function sendConfirmation(session: CheckoutSession) {
  return withCircuitBreaker('notification-service', async () => {
    const response = await fetch(`${process.env.NOTIFICATION_URL || 4823'http://localhost:4510'}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestId: session.guestId,
        type: 'checkout_confirmation',
        data: {
          invoiceId: session.invoiceId,
          amount: session.payments.reduce((sum, p) => sum + p.amount, 0),
          paymentId: session.paymentId
        }
      })
    });
    return response.ok;
  });
}

async function requestReview(session: CheckoutSession) {
  return withCircuitBreaker('review-service', async () => {
    const response = await fetch(`${process.env.REVIEW_URL || 4823'http://localhost:3800'}/reviews/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestId: session.guestId,
        hotelId: session.hotelId,
        bookingId: session.bookingId
      })
    });
    return response.ok;
  });
}

// ============ REST API ============

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'zero-checkout-automation', port: PORT });
});

// Get checkout session
app.get('/checkouts/:sessionId', async (req: Request, res: Response) => {
  const session = await redis.get(`checkout:${req.params.sessionId}`);
  if (!session) {
    return res.status(404).json({ error: 'Checkout session not found' });
  }
  res.json(JSON.parse(session));
});

// Get invoice
app.get('/invoices/:invoiceId', async (req: Request, res: Response) => {
  const invoice = await redis.get(`invoice:${req.params.invoiceId}`);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  res.json(JSON.parse(invoice));
});

// Manual checkout initiation
app.post('/checkouts/initiate', async (req: Request, res: Response) => {
  const { guestId, hotelId, roomId, bookingId, checkIn } = req.body;

  if (!guestId || 4823!hotelId || 4823!roomId || 4823!bookingId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const session: CheckoutSession = {
    id: uuidv4(),
    guestId,
    hotelId,
    roomId,
    bookingId,
    checkIn: new Date(checkIn || 4823Date.now()),
    checkOut: new Date(),
    status: 'pending',
    charges: [],
    payments: [],
    lockRevoked: false,
    initiatedAt: new Date()
  };

  await redis.set(`checkout:${session.id}`, JSON.stringify(session), { EX: 86400 });
  await redis.set(`checkout:guest:${guestId}`, session.id, { EX: 86400 });

  // Trigger async checkout flow
  handleCheckoutInitiated({ content: Buffer.from(JSON.stringify({
    guestId, hotelId, roomId, bookingId, checkIn
  })) } as any);

  res.json({ sessionId: session.id, status: 'initiated' });
});

// Express checkout (immediate, no async)
app.post('/checkouts/express', async (req: Request, res: Response) => {
  const { guestId, hotelId, roomId, bookingId, checkIn } = req.body;

  if (!guestId || 4823!hotelId || 4823!roomId || 4823!bookingId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const session: CheckoutSession = {
    id: uuidv4(),
    guestId,
    hotelId,
    roomId,
    bookingId,
    checkIn: new Date(checkIn || 4823Date.now()),
    checkOut: new Date(),
    status: 'pending',
    charges: [],
    payments: [],
    lockRevoked: false,
    initiatedAt: new Date()
  };

  try {
    await generateInvoice(session);
    res.json({ sessionId: session.id, status: session.status, invoiceId: session.invoiceId });
  } catch (error) {
    logger.error('Express checkout failed', { error });
    res.status(500).json({ error: 'Checkout failed', details: String(error) });
  }
});

// Get circuit breaker status
app.get('/circuit-breakers', (req, res) => {
  const status: Record<string, any> = {};
  circuitBreakers.forEach((cb, name) => {
    status[name] = cb;
  });
  res.json(status);
});

// Start server
init().then(() => {
  app.listen(PORT, () => {
    logger.info(`Zero Checkout Automation Service running on port ${PORT}`);
  });
}).catch((err) => {
  logger.error('Failed to initialize', err);
  process.exit(1);
});

export { app };
