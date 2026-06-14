/**
 * Profile Integration Service
 *
 * Handles cross-vertical profile updates when orders are completed.
 * Calls REZ Auth Profile Service to record transactions and update LTV.
 */

import { logger } from '../config/logger';

const AUTH_SERVICE_URL = process.env.REZ_AUTH_SERVICE_URL || 'http://localhost:4002';

function getInternalToken(): string {
  try {
    const raw = process.env.INTERNAL_SERVICE_TOKENS_JSON;
    const parsed = raw ? JSON.parse(raw) as Record<string, string> : {};
    if (parsed['order-service']) return parsed['order-service'];
  } catch { /* ignore */ }

  if (process.env.INTERNAL_SERVICE_TOKEN) {
    return process.env.INTERNAL_SERVICE_TOKEN;
  }

  return '';
}

async function fetchJson<T>(url: string, options: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const resp = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!resp.ok) {
      const error = await resp.text();
      throw new Error(`HTTP ${resp.status}: ${error}`);
    }

    return await resp.json() as T;
  } finally {
    clearTimeout(timer);
  }
}

export type OrderVertical = 'hotel' | 'restaurant' | 'fashion' | 'pharmacy' | 'retail' | 'd2c';

export interface ProfileUpdateParams {
  userId: string;
  phone: string;
  vertical: OrderVertical;
  amount: number;
  merchantId: string;
  category?: string;
}

/**
 * Record a transaction in user profile after successful delivery
 */
export async function recordProfileTransaction(params: ProfileUpdateParams): Promise<void> {
  const token = getInternalToken();
  if (!token) {
    logger.warn('[ProfileIntegration] No internal token - skipping profile update');
    return;
  }

  try {
    const url = `${AUTH_SERVICE_URL}/internal/profile/transaction`;
    const response = await fetchJson<{ success: boolean; message?: string }>(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-service': 'order-service',
          'x-internal-token': token,
        },
        body: JSON.stringify({
          userId: params.userId,
          phone: params.phone,
          vertical: params.vertical,
          amount: params.amount,
          merchantId: params.merchantId,
          category: params.category || 'general',
        }),
      }
    );

    if (response.success) {
      logger.info('[ProfileIntegration] Transaction recorded', {
        userId: params.userId,
        vertical: params.vertical,
        amount: params.amount,
      });
    } else {
      logger.warn('[ProfileIntegration] Failed to record transaction', { message: response.message });
    }
  } catch (err) {
    // Don't fail the order if profile update fails
    logger.error('[ProfileIntegration] Profile update failed', {
      userId: params.userId,
      error: err.message,
    });
  }
}

/**
 * Record user engagement (app open)
 */
export async function recordProfileEngagement(userId: string, phone: string): Promise<void> {
  const token = getInternalToken();
  if (!token) return;

  try {
    const url = `${AUTH_SERVICE_URL}/internal/profile/engagement`;
    await fetchJson(`${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-service': 'order-service',
        'x-internal-token': token,
      },
      body: JSON.stringify({ userId, phone }),
    });
  } catch (err) {
    logger.error('[ProfileIntegration] Engagement update failed', { userId, error: err.message });
  }
}

/**
 * Map order type to vertical
 */
export function getVerticalFromOrder(orderType?: string): OrderVertical {
  const type = orderType?.toLowerCase() || '';

  if (type.includes('hotel') || type.includes('stay') || type.includes('room')) return 'hotel';
  if (type.includes('restaurant') || type.includes('food') || type.includes('delivery') || type.includes('dining')) return 'restaurant';
  if (type.includes('fashion') || type.includes('clothing') || type.includes('apparel')) return 'fashion';
  if (type.includes('pharmacy') || type.includes('medicine') || type.includes('health')) return 'pharmacy';
  if (type.includes('retail') || type.includes('shop')) return 'retail';

  return 'd2c';
}
