/**
 * REZ Mind Service - Payment Service Integration
 * Sends payment events to REZ Mind Event Platform
 */

import { logger } from '../utils/logger';

const REZ_MIND_URL = process.env.REZ_MIND_URL || 'http://localhost:4008';

interface PaymentEvent {
  merchant_id: string;
  transaction_id: string;
  amount: number;
  order_id?: string;
  payment_method?: string;
  status: 'success' | 'failed';
}

/**
 * Send payment event to REZ Mind (fire-and-forget)
 */
export async function sendPaymentToRezMind(payment: PaymentEvent): Promise<void> {
  try {
    const endpoint = payment.status === 'success'
      ? '/webhook/merchant/payment'
      : '/webhook/merchant/payment';

    await fetch(`${REZ_MIND_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payment,
        source: 'rez-payment-service',
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    // Fire-and-forget, log but don't fail
    logger.error('[REZ Mind] Payment event failed:', { error });
  }
}
