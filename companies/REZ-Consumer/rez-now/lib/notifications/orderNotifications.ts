/**
 * Order Notifications Integration
 *
 * Sends notifications (WhatsApp, SMS, Email) after order events.
 * Import and call these functions after successful payment/confirmation.
 */

import { logger } from '@/lib/utils/logger';
import {
  sendWhatsAppReceipt,
  sendWhatsAppOrderConfirmation,
  buildReceiptFromOrder,
  WhatsAppReceipt,
} from './whatsapp';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OrderNotificationPayload {
  orderId: string;
  orderNumber: string;
  customerPhone: string;
  storeName: string;
  storePhone: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    customizations?: Record<string, string[]>;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  coinsEarned: number;
  tableNumber?: string;
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  paymentMethod?: string;
  reorderLink?: string;
}

// ── Notification Functions ─────────────────────────────────────────────────────

/**
 * Send order confirmation and receipt notifications
 *
 * Call this after successful payment to send:
 * - WhatsApp confirmation (immediate)
 * - WhatsApp receipt with QR (after short delay)
 */
export async function sendOrderNotifications(payload: OrderNotificationPayload): Promise<{
  whatsappConfirmation: boolean;
  whatsappReceipt: boolean;
}> {
  const results = {
    whatsappConfirmation: false,
    whatsappReceipt: false,
  };

  // Send WhatsApp order confirmation
  try {
    const confirmationResult = await sendWhatsAppOrderConfirmation(
      payload.customerPhone,
      payload.orderNumber,
      payload.storeName,
      payload.total
    );
    results.whatsappConfirmation = confirmationResult.success;
    logger.info('[OrderNotifications] WhatsApp confirmation sent', {
      orderId: payload.orderId,
      success: confirmationResult.success,
    });
  } catch (error) {
    logger.error('[OrderNotifications] WhatsApp confirmation failed', { error, orderId: payload.orderId });
  }

  // Send WhatsApp receipt after short delay (to ensure order is processed)
  setTimeout(async () => {
    try {
      const receipt = buildReceiptFromOrder(
        {
          id: payload.orderId,
          orderNumber: payload.orderNumber,
          items: payload.items,
          subtotal: payload.subtotal,
          gst: payload.tax,
          total: payload.total,
          customerPhone: payload.customerPhone,
          storeName: payload.storeName,
          storePhone: payload.storePhone,
          tableNumber: payload.tableNumber,
          orderType: payload.orderType,
          paymentMethod: payload.paymentMethod,
        },
        payload.coinsEarned,
        payload.reorderLink
      );

      const receiptResult = await sendWhatsAppReceipt(receipt);
      results.whatsappReceipt = receiptResult.success;
      logger.info('[OrderNotifications] WhatsApp receipt sent', {
        orderId: payload.orderId,
        success: receiptResult.success,
      });
    } catch (error) {
      logger.error('[OrderNotifications] WhatsApp receipt failed', { error, orderId: payload.orderId });
    }
  }, 2000); // 2 second delay

  return results;
}

/**
 * Send order status update notification
 *
 * Call this when order status changes (e.g., confirmed, preparing, ready, delivered)
 */
export async function sendOrderStatusNotification(
  phone: string,
  orderNumber: string,
  status: 'confirmed' | 'preparing' | 'ready' | 'delivered',
  storeName: string
): Promise<boolean> {
  const statusMessages: Record<string, string> = {
    confirmed: `Your order #${orderNumber} at ${storeName} has been confirmed! 🎉`,
    preparing: `Your order #${orderNumber} is being prepared! 👨‍🍳`,
    ready: `Your order #${orderNumber} is ready for pickup! ✅`,
    delivered: `Your order #${orderNumber} has been delivered. Enjoy your meal! 🍽️`,
  };

  const message = statusMessages[status];
  if (!message) {
    logger.warn('[OrderNotifications] Unknown status', { status });
    return false;
  }

  try {
    // Use the confirmation function for now
    // In production, create a dedicated status update function
    const result = await sendWhatsAppOrderConfirmation(
      phone,
      orderNumber,
      storeName,
      0 // No amount for status updates
    );

    logger.info('[OrderNotifications] Status notification sent', {
      orderNumber,
      status,
      success: result.success,
    });

    return result.success;
  } catch (error) {
    logger.error('[OrderNotifications] Status notification failed', { error, orderNumber, status });
    return false;
  }
}

// ── Integration Helpers ────────────────────────────────────────────────────────

/**
 * Get reorder link for an order
 */
export function getReorderLink(orderId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://reznow.app';
  return `${baseUrl}/order/${orderId}/reorder`;
}

// ── Export ─────────────────────────────────────────────────────────────────────

export default {
  sendOrderNotifications,
  sendOrderStatusNotification,
  getReorderLink,
};
