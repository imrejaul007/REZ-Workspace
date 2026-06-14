import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createServiceLogger } from '../config/logger';

const logger = createServiceLogger('razorpay');

let instance: Razorpay | null = null;

/** PAY-010 FIX: Typed wrapper for the Razorpay payments sub-interface.
 * Razorpay's TypeScript types are incomplete for `.payments`. We cast through
 * `unknown` to ensure we only expose the methods we actually call.
 */
interface RazorpayPayments {
  capture(paymentId: string, amount: number, currency: string): Promise<unknown>;
  refund(paymentId: string, options: { amount?: number; notes?: Record<string, string>; speed?: string }): Promise<unknown>;
  fetch(paymentId: string): Promise<unknown>;
}

function getRazorpay(): Razorpay {
  if (!instance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET required');
    instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
    logger.info('Razorpay instance initialized');
  }
  return instance;
}

function payments(): RazorpayPayments {
  return getRazorpay().payments as unknown as RazorpayPayments;
}

const TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${TIMEOUT_MS}ms`)), TIMEOUT_MS),
    ),
  ]);
}

/**
 * Creates a Razorpay order for payment processing.
 * @param amount - Payment amount in paisa (smallest currency unit)
 * @param receipt - Unique receipt identifier for idempotency
 * @param notes - Optional key-value notes attached to the order
 * @returns Razorpay order response object
 */
export async function createOrder(
  amount: number,
  receipt: string,
  notes?: Record<string, unknown>,
): Promise<unknown> {
  const rz = getRazorpay();
  const options = {
    amount: Math.round(amount * 100), // rupees → paise
    currency: process.env.RAZORPAY_CURRENCY || 'INR',
    receipt,
    notes: notes || {},
  };

  logger.info('Creating order', { amount: `₹${amount}`, receipt });
  const order = await withTimeout(rz.orders.create(options), 'createOrder');
  logger.info('Order created', { orderId: order.id });
  return order;
}

/**
 * Verifies the Razorpay payment signature for client-side payment confirmation.
 * Uses HMAC-SHA256 with the Razorpay secret.
 * @param orderId - The Razorpay order ID
 * @param paymentId - The Razorpay payment ID from the client
 * @param signature - The signature string from the client
 * @returns true if the signature is valid, false otherwise
 */
export function verifySignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error('RAZORPAY_KEY_SECRET required');

  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  // Use timingSafeEqual to prevent timing-based signature oracle attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false; // different lengths — definitely invalid
  }
}

/**
 * Verifies the Razorpay webhook signature (HMAC-SHA256) from the webhook payload.
 * Ensures the webhook originated from Razorpay and has not been tampered with.
 * @param rawBody - The raw request body (Buffer or string) as received
 * @param signature - The X-Razorpay-Signature header value
 * @returns true if the signature is valid, false otherwise
 */
export function verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error('RAZORPAY_WEBHOOK_SECRET required');

  // rawBody must be the exact bytes Razorpay signed — NOT JSON.stringify(req.body).
  // Express re-serialization changes whitespace/key-order and breaks the HMAC.
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Captures a previously authorized Razorpay payment.
 * @param paymentId - The Razorpay payment ID
 * @param amount - The amount to capture in paisa
 * @returns Razorpay capture response
 */
export async function capturePayment(paymentId: string, amount: number): Promise<unknown> {
  logger.info('Capturing payment', { paymentId, amount });
  return withTimeout(payments().capture(paymentId, Math.round(amount * 100), 'INR'), 'capturePayment');
}

/**
 * Initiates a refund for a captured Razorpay payment at normal speed.
 * @param paymentId - The Razorpay payment ID
 * @param amount - The amount to refund in rupees (converted to paisa internally)
 * @param notes - Optional key-value notes for the refund record
 * @returns Razorpay refund response
 */
export async function initiateRefund(paymentId: string, amount: number, notes?: Record<string, string>) {
  logger.info('Initiating refund', { paymentId, amount });
  return withTimeout(
    payments().refund(paymentId, {
      amount: Math.round(amount * 100),
      notes: notes || {},
      speed: 'normal',
    }),
    'initiateRefund',
  );
}

/**
 * Fetches the details of a Razorpay payment by its payment ID.
 * @param paymentId - The Razorpay payment ID
 * @returns Razorpay payment details
 */
export async function getPaymentDetails(paymentId: string): Promise<unknown> {
  return withTimeout(payments().fetch(paymentId), 'getPaymentDetails');
}
