/**
 * Profile Integration Service for Payment Service
 *
 * Records profile transactions when payments are captured successfully.
 */

import { createServiceLogger } from '../config/logger';

const logger = createServiceLogger('profile-integration');

// SECURITY FIX: Fail at startup instead of silently falling back to localhost
const AUTH_SERVICE_URL = process.env.REZ_AUTH_SERVICE_URL;
if (!AUTH_SERVICE_URL) {
  throw new Error('REZ_AUTH_SERVICE_URL environment variable is required');
}

function getInternalToken(): string {
  try {
    const raw = process.env.INTERNAL_SERVICE_TOKENS_JSON;
    const parsed = raw ? JSON.parse(raw) as Record<string, string> : {};
    if (parsed['payment-service']) return parsed['payment-service'];
  } catch { /* ignore */ }

  if (process.env.INTERNAL_SERVICE_TOKEN) {
    return process.env.INTERNAL_SERVICE_TOKEN;
  }

  return '';
}

interface PaymentProfileData {
  userId: string;
  phone: string;
  amount: number;
  merchantId: string;
  vertical: 'hotel' | 'restaurant' | 'fashion' | 'pharmacy' | 'retail' | 'd2c';
  category?: string;
  orderId?: string;
}

export async function recordPaymentProfileUpdate(payment: PaymentProfileData): Promise<void> {
  const token = getInternalToken();
  if (!token) {
    logger.warn('No internal token - skipping profile update');
    return;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const resp = await fetch(`${AUTH_SERVICE_URL}/internal/profile/transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-service': 'payment-service',
        'x-internal-token': token,
      },
      body: JSON.stringify({
        userId: payment.userId,
        phone: payment.phone,
        vertical: payment.vertical,
        amount: payment.amount,
        merchantId: payment.merchantId,
        category: payment.category || 'payment',
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (resp.ok) {
      logger.info('Payment profile update recorded', {
        userId: payment.userId,
        amount: payment.amount,
        vertical: payment.vertical,
      });
    } else {
      const error = await resp.text();
      logger.warn('Payment profile update failed', { status: resp.status, error });
    }
  } catch (err) {
    // Don't fail payment if profile update fails
    logger.error('Payment profile update error', { userId: payment.userId, error: err.message });
  }
}

export function mapPaymentTypeToVertical(paymentType?: string): 'hotel' | 'restaurant' | 'fashion' | 'pharmacy' | 'retail' | 'd2c' {
  const type = (paymentType || '').toLowerCase();

  if (type.includes('hotel') || type.includes('room') || type.includes('stay')) return 'hotel';
  if (type.includes('restaurant') || type.includes('food') || type.includes('dining')) return 'restaurant';
  if (type.includes('fashion') || type.includes('clothing') || type.includes('apparel')) return 'fashion';
  if (type.includes('pharmacy') || type.includes('medicine') || type.includes('health')) return 'pharmacy';
  if (type.includes('retail') || type.includes('shop')) return 'retail';

  return 'd2c';
}
