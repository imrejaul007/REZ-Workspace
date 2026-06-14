/**
 * Webhook Integration Service for REZ-support-copilot
 *
 * Sends webhook notifications when:
 * - Order is created
 * - Order status changes
 */

import { createServiceLogger } from '../config/logger';

const logger = createServiceLogger('webhook-integration');

// Support Copilot webhook URL
const SUPPORT_COPILOT_URL = process.env.SUPPORT_COPILOT_WEBHOOK_URL || 'https://REZ-support-copilot.onrender.com';
const WEBHOOK_TIMEOUT = 5000;

/**
 * Send webhook notification when an order is created
 */
export async function notifyOrderCreated(order: {
  id: string;
  userId: string;
  merchantId: string;
  items: Array<{ name?: string; quantity: number; price: number; productId?: string }>;
  total: number;
}): Promise<void> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT);

    const response = await fetch(`${SUPPORT_COPILOT_URL}/webhooks/order/created`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        userId: order.userId,
        merchantId: order.merchantId,
        items: order.items.map(item => ({
          name: item.name || item.productId || 'Unknown',
          quantity: item.quantity,
          price: item.price,
        })),
        total: order.total,
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    logger.info('[Webhook] Order created notification sent', { orderId: order.id });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn('[Webhook] Order created notification timed out', { orderId: order.id });
    } else {
      logger.warn('[Webhook] Failed to send order created notification', {
        orderId: order.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

/**
 * Send webhook notification when order status changes
 */
export async function notifyOrderStatusChange(order: {
  id: string;
  userId: string;
  merchantId?: string;
}, oldStatus: string, newStatus: string): Promise<void> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT);

    const response = await fetch(`${SUPPORT_COPILOT_URL}/webhooks/order/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        userId: order.userId,
        merchantId: order.merchantId,
        oldStatus,
        newStatus,
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    logger.info('[Webhook] Order status change notification sent', {
      orderId: order.id,
      oldStatus,
      newStatus,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn('[Webhook] Order status change notification timed out', {
        orderId: order.id,
        oldStatus,
        newStatus,
      });
    } else {
      logger.warn('[Webhook] Failed to send order status change notification', {
        orderId: order.id,
        oldStatus,
        newStatus,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
