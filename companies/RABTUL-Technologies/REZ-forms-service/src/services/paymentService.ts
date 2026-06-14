/**
 * REZ Forms - Payment Service
 * Stripe integration for payment fields
 */

import Stripe from 'stripe';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'canceled';
  receiptUrl?: string;
  metadata: Record<string, string>;
}

export interface PaymentConfig {
  stripeSecretKey: string;
  webhookSecret: string;
}

// Initialize Stripe
let stripe: Stripe | null = null;

export function initStripe(config: PaymentConfig): Stripe {
  stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2023-10-16',
  });
  return stripe;
}

/**
 * Create payment intent
 */
export async function createPaymentIntent(
  amount: number,
  currency: string = 'inr',
  metadata: Record<string, string> = {}
): Promise<PaymentIntent> {
  if (!stripe) {
    throw new Error('Stripe not initialized. Call initStripe() first.');
  }

  // Convert to smallest currency unit (paise for INR, cents for USD)
  const amountInSmallestUnit = currency === 'inr' ? amount * 100 : amount * 100;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInSmallestUnit,
    currency: currency.toLowerCase(),
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return {
    id: paymentIntent.id,
    amount,
    currency,
    status: paymentIntent.status as 'succeeded' | 'pending' | 'failed' | 'canceled',
    receiptUrl: paymentIntent.receipt_email || undefined,
    metadata: paymentIntent.metadata,
  };
}

/**
 * Get payment intent
 */
export async function getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent | null> {
  if (!stripe) {
    throw new Error('Stripe not initialized. Call initStripe() first.');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: paymentIntent.status as 'succeeded' | 'pending' | 'failed' | 'canceled',
      receiptUrl: paymentIntent.receipt_email || undefined,
      metadata: paymentIntent.metadata,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Cancel payment intent
 */
export async function cancelPaymentIntent(paymentIntentId: string): Promise<boolean> {
  if (!stripe) {
    throw new Error('Stripe not initialized. Call initStripe() first.');
  }

  try {
    await stripe.paymentIntents.cancel(paymentIntentId);
    return true;
  } catch (error) {
    console.error('Failed to cancel payment:', error);
    return false;
  }
}

/**
 * Create refund
 */
export async function createRefund(
  paymentIntentId: string,
  amount?: number // Optional partial refund
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  if (!stripe) {
    return { success: false, error: 'Stripe not initialized' };
  }

  try {
    const params: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      params.amount = amount * 100; // Convert to paise/cents
    }

    const refund = await stripe.refunds.create(params);
    return { success: true, refundId: refund.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event | null {
  if (!stripe) {
    console.error('Stripe not initialized');
    return null;
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return null;
  }
}

/**
 * Get client secret for frontend
 */
export async function getClientSecret(amount: number, currency: string = 'inr'): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe not initialized. Call initStripe() first.');
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Convert to paise
    currency: currency.toLowerCase(),
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return paymentIntent.client_secret || '';
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'inr'): string {
  const symbols: Record<string, string> = {
    inr: '₹',
    usd: '$',
    eur: '€',
    gbp: '£',
  };

  const symbol = symbols[currency.toLowerCase()] || currency.toUpperCase();
  return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Supported currencies
 */
export const SUPPORTED_CURRENCIES = [
  { code: 'inr', name: 'Indian Rupee', symbol: '₹' },
  { code: 'usd', name: 'US Dollar', symbol: '$' },
  { code: 'eur', name: 'Euro', symbol: '€' },
  { code: 'gbp', name: 'British Pound', symbol: '£' },
  { code: 'sgd', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'aud', name: 'Australian Dollar', symbol: 'A$' },
];

/**
 * Payment status labels
 */
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  succeeded: 'Payment Successful',
  pending: 'Payment Pending',
  requires_payment_method: 'Payment Required',
  requires_confirmation: 'Confirmation Required',
  requires_action: 'Action Required',
  processing: 'Processing',
  canceled: 'Payment Canceled',
  failed: 'Payment Failed',
};