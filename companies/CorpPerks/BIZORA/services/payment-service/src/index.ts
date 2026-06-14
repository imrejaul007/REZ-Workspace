/**
 * BIZORA Payment Service
 * Razorpay + UPI Integration
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { z } from 'zod';

// ============================================================================
// Configuration
// ============================================================================

const PORT = parseInt(process.env.PORT || '4036', 10);
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';
const RAZORPAY_API = 'https://api.razorpay.com/v1';

// ============================================================================
// Types
// ============================================================================

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'failed' | 'refunded';
  method: string;
  customer: {
    name: string;
    email?: string;
    phone: string;
  };
  description?: string;
  receipt?: string;
  notes?: Record<string, string>;
  createdAt: Date;
  capturedAt?: Date;
  refundedAt?: Date;
}

interface Order {
  id: string;
  amount: number;
  currency: string;
  status: 'created' | 'paid' | 'expired';
  receipt: string;
  payments: Payment[];
  createdAt: Date;
}

interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  status: 'pending' | 'processed' | 'failed';
  reason?: string;
  createdAt: Date;
}

// ============================================================================
// Validation
// ============================================================================

const CreateOrderSchema = z.object({
  amount: z.number().min(100, 'Minimum amount is ₹1'),
  currency: z.string().default('INR'),
  receipt: z.string(),
  notes: z.record(z.string()).optional(),
  customer: z.object({
    name: z.string(),
    email: z.string().email().optional(),
    phone: z.string(),
  }),
});

const CreatePaymentSchema = z.object({
  orderId: z.string(),
  paymentMethod: z.string(),
});

const RefundSchema = z.object({
  paymentId: z.string(),
  amount: z.number().optional(),
  reason: z.string().optional(),
});

// ============================================================================
// Store
// ============================================================================

const orders = new Map<string, Order>();
const payments = new Map<string, Payment>();
const refunds = new Map<string, Refund>();

// ============================================================================
// Utility Functions
// ============================================================================

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!RAZORPAY_WEBHOOK_SECRET) return true;
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  return signature === expectedSignature;
}

async function razorpayRequest(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: Record<string, unknown>): Promise<unknown> {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    logger.info('[Razorpay] Mock request:', method, endpoint, data);
    return { mock: true };
  }

  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');

  const response = await fetch(`${RAZORPAY_API}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  return response.json();
}

// ============================================================================
// Express App
// ============================================================================

const app = express();
app.use(cors());
app.use(express.json());

// Raw body for webhook verification
app.use('/webhook/razorpay', express.raw({ type: 'application/json' }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'payment-service',
    timestamp: new Date().toISOString(),
    razorpayConfigured: !!(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET),
    orders: orders.size,
    payments: payments.size,
  });
});

// ============================================================================
// Payment Routes
// ============================================================================

// Create order
app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const data = CreateOrderSchema.parse(req.body);

    const orderId = generateId('order');

    // Create Razorpay order if configured
    let razorpayOrder: Record<string, unknown> | undefined;
    if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
      razorpayOrder = await razorpayRequest('/orders', 'POST', {
        amount: data.amount * 100, // Convert to paise
        currency: data.currency,
        receipt: data.receipt,
        notes: data.notes,
      }) as Record<string, unknown>;
    }

    const order: Order = {
      id: (razorpayOrder?.id as string) || orderId,
      amount: data.amount,
      currency: data.currency,
      status: 'created',
      receipt: data.receipt,
      payments: [],
      createdAt: new Date(),
    };

    orders.set(order.id, order);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      razorpayOrderId: razorpayOrder?.id,
      key: RAZORPAY_KEY_ID,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    logger.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get order
app.get('/api/orders/:id', (req: Request, res: Response) => {
  const order = orders.get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

// Verify payment
app.post('/api/payments/verify', async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment details' });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET || 'mock_secret')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Update order
    const order = orders.get(razorpay_order_id);
    if (order) {
      order.status = 'paid';
      orders.set(order.id, order);
    }

    res.json({
      success: true,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });
  } catch (error) {
    logger.error('Verify payment error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Capture payment
app.post('/api/payments/:id/capture', async (req: Request, res: Response) => {
  try {
    const payment = payments.get(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'authorized') {
      return res.status(400).json({ error: 'Payment not authorized' });
    }

    // Capture on Razorpay
    if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
      await razorpayRequest(`/payments/${req.params.id}/capture`, 'POST', {
        amount: payment.amount * 100,
      });
    }

    payment.status = 'captured';
    payment.capturedAt = new Date();
    payments.set(payment.id, payment);

    // Update order
    const order = orders.get(payment.orderId);
    if (order) {
      order.payments.push(payment);
      orders.set(order.id, order);
    }

    res.json(payment);
  } catch (error) {
    logger.error('Capture payment error:', error);
    res.status(500).json({ error: 'Failed to capture payment' });
  }
});

// Refund
app.post('/api/refunds', async (req: Request, res: Response) => {
  try {
    const data = RefundSchema.parse(req.body);

    const payment = payments.get(data.paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'captured') {
      return res.status(400).json({ error: 'Payment not captured' });
    }

    const refundId = generateId('refund');
    const refund: Refund = {
      id: refundId,
      paymentId: data.paymentId,
      amount: data.amount || payment.amount,
      status: 'pending',
      reason: data.reason,
      createdAt: new Date(),
    };

    // Process refund on Razorpay
    if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
      const razorpayRefund = await razorpayRequest('/refunds', 'POST', {
        payment_id: data.paymentId,
        amount: (data.amount || payment.amount) * 100,
        notes: data.reason ? { reason: data.reason } : undefined,
      }) as Record<string, unknown>;

      refund.id = (razorpayRefund.id as string) || refundId;
    }

    refunds.set(refund.id, refund);

    // Update payment
    payment.status = 'refunded';
    payment.refundedAt = new Date();
    payments.set(payment.id, payment);

    res.json(refund);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    logger.error('Refund error:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// Get refund
app.get('/api/refunds/:id', (req: Request, res: Response) => {
  const refund = refunds.get(req.params.id);
  if (!refund) {
    return res.status(404).json({ error: 'Refund not found' });
  }
  res.json(refund);
});

// ============================================================================
// UPI Routes
// ============================================================================

// Generate UPI QR code URL
app.post('/api/upi/generate', (req: Request, res: Response) => {
  try {
    const { amount, orderId, name, vpa } = req.body;

    // Generate UPI payment URL
    const upiUrl = `upi://pay?pa=${vpa || 'bizora@razorpay'}&pn=${encodeURIComponent(name || 'BIZORA')}&am=${amount}&cu=INR&tr=${orderId || generateId('upi')}`;

    // Generate QR code data URL (in production, use a QR library)
    const qrDataUrl = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="white" width="200" height="200"/><text x="100" y="100" text-anchor="middle" font-size="12">Scan UPI QR</text></svg>`;

    res.json({
      upiUrl,
      qrDataUrl,
      amount,
      vpa: vpa || 'bizora@razorpay',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate UPI QR' });
  }
});

// ============================================================================
// Webhook
// ============================================================================

app.post('/webhook/razorpay', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const payload = req.body.toString();

    // Verify webhook
    if (!verifyWebhookSignature(payload, signature)) {
      logger.error('[Payment] Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(payload);
    logger.info('[Payment] Webhook event:', event.event);

    const entity = event.payload?.entity;

    switch (event.event) {
      case 'order.paid':
        const paidOrder = orders.get(entity.id);
        if (paidOrder) {
          paidOrder.status = 'paid';
          orders.set(paidOrder.id, paidOrder);
        }
        break;

      case 'payment.authorized':
        const authPayment: Payment = {
          id: entity.id,
          orderId: entity.order_id,
          amount: entity.amount / 100,
          currency: entity.currency,
          status: 'authorized',
          method: entity.method,
          customer: entity.customer_email ? { name: entity.customer_name, email: entity.customer_email, phone: entity.customer_contact } : { name: 'Customer', phone: entity.customer_contact },
          description: entity.description,
          createdAt: new Date(entity.created_at * 1000),
        };
        payments.set(authPayment.id, authPayment);
        break;

      case 'payment.captured':
        const capturedPayment = payments.get(entity.id);
        if (capturedPayment) {
          capturedPayment.status = 'captured';
          capturedPayment.capturedAt = new Date();
          payments.set(capturedPayment.id, capturedPayment);
        }
        break;

      case 'payment.failed':
        const failedPayment = payments.get(entity.id);
        if (failedPayment) {
          failedPayment.status = 'failed';
          payments.set(failedPayment.id, failedPayment);
        }
        break;

      case 'refund.processed':
        const refund = refunds.get(entity.id);
        if (refund) {
          refund.status = 'processed';
          refunds.set(refund.id, refund);
        }
        break;
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('[Payment] Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ============================================================================
// Dashboard
// ============================================================================

app.get('/api/dashboard/stats', (_req: Request, res: Response) => {
  const allPayments = Array.from(payments.values());
  const allRefunds = Array.from(refunds.values());

  const stats = {
    totalPayments: allPayments.length,
    totalAmount: allPayments.filter(p => p.status === 'captured').reduce((sum, p) => sum + p.amount, 0),
    pendingPayments: allPayments.filter(p => p.status === 'authorized').length,
    failedPayments: allPayments.filter(p => p.status === 'failed').length,
    totalRefunds: allRefunds.filter(r => r.status === 'processed').reduce((sum, r) => sum + r.amount, 0),
    byMethod: allPayments.reduce((acc, p) => {
      acc[p.method] = (acc[p.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  res.json(stats);
});

// ============================================================================
// Start Server
// ============================================================================

app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   💳 BIZORA Payment Service                             ║
║   Razorpay + UPI Integration                          ║
║                                                           ║
║   Port: ${PORT}                                             ║
║   Status: Running                                      ║
║   Razorpay: ${RAZORPAY_KEY_ID ? '✅ Configured' : '⚠️ Mock Mode'}                            ║
║                                                           ║
║   Features:                                             ║
║   • Order creation                                    ║
║   • Payment verification                             ║
║   • UPI QR generation                                ║
║   • Refunds                                          ║
║   • Webhook handling                                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
