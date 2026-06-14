/**
 * REZ Verify QR - Payment Integration (Razorpay)
 * Handles payments for warranty subscriptions, insurance, and deposits
 */

import express, { Request, Response } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import logger from './utils/logger';

const router = express.Router();

// ============================================
// RAZORPAY CONFIGURATION
// ============================================

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

const RAZORPAY_API = 'https://api.razorpay.com/v1';
const RAZORPAY_WEBHOOK_API = 'https://webhook.razorpay.com/v1';

// ============================================
// TYPES
// ============================================

interface PaymentLink {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: 'created' | 'active' | 'completed' | 'cancelled' | 'expired';
  customer: {
    name: string;
    email?: string;
    phone: string;
  };
 short_url: string;
  created_at: number;
  expire_by?: number;
}

interface Order {
  id: string;
  amount: number;
  currency: string;
  status: 'created' | 'attempted' | 'paid';
  receipt?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getAuthHeader(): string {
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
  return `Basic ${auth}`;
}

function verifyWebhookSignature(body: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// ============================================
// PAYMENT LINK APIs
// ============================================

/**
 * POST /api/payments/create-link
 * Create a payment link for warranty subscription, insurance, or deposit
 */
router.post('/create-link', async (req: Request, res: Response) => {
  const {
    amount,
    currency = 'INR',
    description,
    customer_name,
    customer_email,
    customer_phone,
    purpose,  // 'warranty_subscription' | 'insurance' | 'deposit' | 'express_replacement'
    reference_id,
    metadata
  } = req.body;

  if (!amount || !customer_phone || !purpose) {
    return res.status(400).json({ error: 'Amount, phone, and purpose are required' });
  }

  // Amount must be in paise
  const amountInPaise = Math.round(amount * 100);

  try {
    const response = await axios.post(
      `${RAZORPAY_API}/payment-links`,
      {
        amount: amountInPaise,
        currency,
        description: description || `Verify QR - ${purpose}`,
        customer: {
          name: customer_name,
          email: customer_email,
          contact: customer_phone.startsWith('+') ? customer_phone : `+91${customer_phone}`
        },
        accept_partial: false,
        notify: {
          sms: true,
          email: !!customer_email
        },
        callback_url: `${process.env.APP_URL || 'https://verify.rez.money'}/payment/callback`,
        callback_method: 'get',
        reference_id,
        notes: {
          purpose,
          ...metadata
        }
      },
      {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json'
        }
      }
    );

    const paymentLink: PaymentLink = response.data;

    res.json({
      success: true,
      payment_link_id: paymentLink.id,
      short_url: paymentLink.short_url,
      amount: paymentLink.amount,
      currency: paymentLink.currency,
      status: paymentLink.status,
      expires_at: paymentLink.expire_by ? new Date(paymentLink.expire_by * 1000) : null
    });

  } catch (error) {
    console.error('Razorpay create link error:', error.response?.data || error);
    res.status(500).json({
      error: 'Failed to create payment link',
      details: error.response?.data?.error?.description
    });
  }
});

/**
 * GET /api/payments/link/:id
 * Get payment link status
 */
router.get('/link/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const response = await axios.get(`${RAZORPAY_API}/payment-links/${id}`, {
      headers: { 'Authorization': getAuthHeader() }
    });

    const paymentLink = response.data;

    res.json({
      id: paymentLink.id,
      amount: paymentLink.amount / 100,
      currency: paymentLink.currency,
      status: paymentLink.status,
      customer: paymentLink.customer,
      short_url: paymentLink.short_url,
      created_at: new Date(paymentLink.created_at * 1000),
      payments: paymentLink.payments?.map((p) => ({
        id: p.id,
        amount: p.amount / 100,
        status: p.status,
        method: p.method
      })) || []
    });

  } catch (error) {
    console.error('Razorpay get link error:', error);
    res.status(500).json({ error: 'Failed to get payment link' });
  }
});

/**
 * POST /api/payments/link/:id/cancel
 * Cancel a payment link
 */
router.post('/link/:id/cancel', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await axios.post(
      `${RAZORPAY_API}/payment-links/${id}/cancel`,
      {},
      { headers: { 'Authorization': getAuthHeader() } }
    );

    res.json({ success: true, message: 'Payment link cancelled' });

  } catch (error) {
    console.error('Razorpay cancel link error:', error);
    res.status(500).json({ error: 'Failed to cancel payment link' });
  }
});

// ============================================
// ORDER APIs
// ============================================

/**
 * POST /api/payments/create-order
 * Create an order for checkout
 */
router.post('/create-order', async (req: Request, res: Response) => {
  const {
    amount,
    currency = 'INR',
    receipt,
    purpose,
    product_id,
    user_id
  } = req.body;

  if (!amount) {
    return res.status(400).json({ error: 'Amount is required' });
  }

  const amountInPaise = Math.round(amount * 100);

  try {
    const response = await axios.post(
      `${RAZORPAY_API}/orders`,
      {
        amount: amountInPaise,
        currency,
        receipt: receipt || `vqr_${Date.now()}`,
        notes: {
          purpose: purpose || 'verify_qr_payment',
          product_id: product_id || '',
          user_id: user_id || ''
        }
      },
      {
        headers: { 'Authorization': getAuthHeader() }
      }
    );

    const order: Order = response.data;

    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount / 100,
      currency: order.currency,
      status: order.status,
      receipt: order.receipt
    });

  } catch (error) {
    console.error('Razorpay create order error:', error);
    res.status(500).json({
      error: 'Failed to create order',
      details: error.response?.data?.error?.description
    });
  }
});

/**
 * GET /api/payments/order/:id
 * Get order details
 */
router.get('/order/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const response = await axios.get(`${RAZORPAY_API}/orders/${id}`, {
      headers: { 'Authorization': getAuthHeader() }
    });

    const order = response.data;

    res.json({
      id: order.id,
      amount: order.amount / 100,
      currency: order.currency,
      status: order.status,
      attempts: order.attempts,
      created_at: new Date(order.created_at * 1000)
    });

  } catch (error) {
    console.error('Razorpay get order error:', error);
    res.status(500).json({ error: 'Failed to get order' });
  }
});

// ============================================
// PAYMENT VERIFICATION
// ============================================

/**
 * POST /api/payments/verify
 * Verify payment signature and process
 */
router.post('/verify', async (req: Request, res: Response) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    purpose,
    reference_id
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment details' });
  }

  // Verify signature
  const generatedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generatedSignature !== razorpay_signature) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    // Get payment details
    const paymentResponse = await axios.get(
      `${RAZORPAY_API}/payments/${razorpay_payment_id}`,
      { headers: { 'Authorization': getAuthHeader() } }
    );

    const payment = paymentResponse.data;

    // Process based on purpose
    const result = await processSuccessfulPayment({
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      amount: payment.amount / 100,
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      purpose,
      reference_id
    });

    res.json({
      success: true,
      verified: true,
      ...result
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// ============================================
// WEBHOOK HANDLER
// ============================================

/**
 * POST /api/payments/webhook
 * Handle Razorpay webhook events
 */
router.post('/webhook', async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;

  if (!signature) {
    return res.status(400).json({ error: 'Missing signature' });
  }

  // Verify webhook signature
  const body = JSON.stringify(req.body);
  if (!verifyWebhookSignature(body, signature)) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const event = req.body.event;
  const payload = req.body.payload;

  try {
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload.payment);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload.payment);
        break;

      case 'refund.created':
        await handleRefundCreated(payload.refund);
        break;

      case 'refund.processed':
        await handleRefundProcessed(payload.refund);
        break;

      default:
        logger.info(`Unhandled webhook event: ${event}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ============================================
// WEBHOOK EVENT HANDLERS
// ============================================

async function handlePaymentCaptured(payment) {
  logger.info(`Payment captured: ${payment.id}, Amount: ${payment.amount / 100}`);

  // Get payment link details if this was from a link
  if (payment.payment_link_id) {
    try {
      const linkResponse = await axios.get(
        `${RAZORPAY_API}/payment-links/${payment.payment_link_id}`,
        { headers: { 'Authorization': getAuthHeader() } }
      );

      const link = linkResponse.data;
      const purpose = link.notes?.purpose;

      // Process based on purpose
      if (purpose === 'warranty_subscription') {
        await activateWarrantySubscription(link.notes);
      } else if (purpose === 'insurance') {
        await activateInsurancePolicy(link.notes);
      } else if (purpose === 'deposit' || purpose === 'express_replacement') {
        await confirmExpressReplacement(link.notes, payment.id);
      }
    } catch (e) {
      console.error('Error processing captured payment:', e);
    }
  }

  // Track to intelligence
  try {
    await axios.post(
      `${process.env.INTELLIGENCE_API || 'https://rez-intelligence.onrender.com'}/api/intent/track`,
      {
        user_id: 'system',
        intent_type: 'payment_completed',
        entities: {
          payment_id: payment.id,
          amount: payment.amount / 100,
          currency: payment.currency
        },
        action: 'capture'
      }
    );
  } catch (e) {
    logger.warn('Service call failed', { error: e instanceof Error ? e.message : String(e) });
  }
}

async function handlePaymentFailed(payment) {
  logger.info(`Payment failed: ${payment.id}`);

  // Log failure for analytics
  try {
    await axios.post(
      `${process.env.INTELLIGENCE_API || 'https://rez-intelligence.onrender.com'}/api/intent/track`,
      {
        user_id: 'system',
        intent_type: 'payment_failed',
        entities: {
          payment_id: payment.id,
          error_code: payment.error_code,
          error_description: payment.error_description
        },
        action: 'failure'
      }
    );
  } catch (e) {
    logger.warn('Service call failed', { error: e instanceof Error ? e.message : String(e) });
  }
}

async function handleRefundCreated(refund) {
  logger.info(`Refund created: ${refund.id}, Amount: ${refund.amount / 100}`);
}

async function handleRefundProcessed(refund) {
  logger.info(`Refund processed: ${refund.id}`);

  // Credit wallet
  try {
    await axios.post(
      `${process.env.WALLET_API || 'https://rez-wallet.onrender.com'}/api/refund`,
      {
        user_id: refund.notes?.user_id,
        amount: refund.amount / 100,
        reason: 'Payment refund',
        reference_id: refund.id
      }
    );
  } catch (e) {
    console.error('Error crediting refund:', e);
  }
}

// ============================================
// PAYMENT PROCESSING HELPERS
// ============================================

async function processSuccessfulPayment(data: {
  payment_id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  purpose: string;
  reference_id: string;
}) {
  const result: unknown = {
    payment_id: data.payment_id,
    amount: data.amount
  };

  switch (data.purpose) {
    case 'warranty_subscription':
      result.subscription = await activateWarrantySubscriptionFromPayment(data);
      break;

    case 'insurance':
      result.policy = await activateInsuranceFromPayment(data);
      break;

    case 'deposit':
    case 'express_replacement':
      result.replacement = await confirmExpressReplacementFromPayment(data);
      break;
  }

  return result;
}

async function activateWarrantySubscriptionFromPayment(data) {
  // This would activate the warranty subscription
  return {
    subscription_id: data.reference_id,
    status: 'active',
    activated_at: new Date()
  };
}

async function activateInsuranceFromPayment(data) {
  return {
    policy_id: data.reference_id,
    status: 'active',
    activated_at: new Date()
  };
}

async function confirmExpressReplacementFromPayment(data) {
  return {
    replacement_id: data.reference_id,
    status: 'deposit_received',
    payment_id: data.payment_id
  };
}

async function activateWarrantySubscription(notes) {
  console.log('Activating warranty subscription:', notes);
}

async function activateInsurancePolicy(notes) {
  console.log('Activating insurance policy:', notes);
}

async function confirmExpressReplacement(notes, paymentId: string) {
  console.log('Confirming express replacement:', notes, paymentId);
}

// ============================================
// REFUND APIs
// ============================================

/**
 * POST /api/payments/refund
 * Initiate a refund
 */
router.post('/refund', async (req: Request, res: Response) => {
  const { payment_id, amount, reason } = req.body;

  if (!payment_id) {
    return res.status(400).json({ error: 'Payment ID is required' });
  }

  try {
    const refundData: unknown = {
      notes: { reason: reason || 'Customer request' }
    };

    if (amount) {
      refundData.amount = Math.round(amount * 100); // Partial refund
    }

    const response = await axios.post(
      `${RAZORPAY_API}/payments/${payment_id}/refund`,
      refundData,
      { headers: { 'Authorization': getAuthHeader() } }
    );

    const refund = response.data;

    res.json({
      success: true,
      refund_id: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
      created_at: new Date(refund.created_at * 1000)
    });

  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({
      error: 'Failed to initiate refund',
      details: error.response?.data?.error?.description
    });
  }
});

/**
 * GET /api/payments/refund/:id
 * Get refund status
 */
router.get('/refund/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const response = await axios.get(`${RAZORPAY_API}/refunds/${id}`, {
      headers: { 'Authorization': getAuthHeader() }
    });

    const refund = response.data;

    res.json({
      id: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
      created_at: new Date(refund.created_at * 1000),
      speed_processed: refund.speed_processed
    });

  } catch (error) {
    console.error('Get refund error:', error);
    res.status(500).json({ error: 'Failed to get refund' });
  }
});

export default router;
