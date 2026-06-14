/**
 * WhatsApp Business API - Receipt Notifications
 *
 * Sends WhatsApp receipt notifications after successful payment.
 * Uses WhatsApp Business API for template messages.
 */

import { logger } from '@/lib/utils/logger';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number; // in paise
  customizations?: Record<string, string[]>;
}

export interface WhatsAppReceipt {
  phone: string;
  orderId: string;
  orderNumber: string;
  storeName: string;
  storePhone: string;
  items: OrderItem[];
  subtotal: number; // in paise
  tax: number; // in paise
  total: number; // in paise
  coinsEarned: number;
  reorderLink: string;
  paymentMethod?: string;
  tableNumber?: string;
  orderType: 'dine_in' | 'takeaway' | 'delivery';
}

export interface WhatsAppStatus {
  messageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
}

export interface SendReceiptResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ── Configuration ──────────────────────────────────────────────────────────────

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';

// ── Utility Functions ─────────────────────────────────────────────────────────

/**
 * Format price from paise to INR string
 */
function formatPrice(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

/**
 * Format phone number for WhatsApp (ensure country code)
 */
function formatPhoneForWhatsApp(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  // Add 91 for India if not present
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }
  return digits;
}

/**
 * Generate order summary text for WhatsApp message
 */
function generateReceiptText(receipt: WhatsAppReceipt): string {
  const lines: string[] = [];

  lines.push(`🧾 *REZ Order Receipt*`);
  lines.push(`─────────────────`);
  lines.push(`📋 Order #${receipt.orderNumber}`);
  lines.push(`🏪 ${receipt.storeName}`);

  if (receipt.orderType === 'dine_in' && receipt.tableNumber) {
    lines.push(`🪑 Table: ${receipt.tableNumber}`);
  }

  lines.push(``);
  lines.push(`*Items Ordered:*`);

  for (const item of receipt.items) {
    const itemTotal = item.price * item.quantity;
    lines.push(`• ${item.quantity}x ${item.name}`);
    lines.push(`  ${formatPrice(itemTotal)}`);

    if (item.customizations) {
      for (const [groupName, options] of Object.entries(item.customizations)) {
        lines.push(`  ${groupName}: ${options.join(', ')}`);
      }
    }
  }

  lines.push(``);
  lines.push(`─────────────────`);
  lines.push(`Subtotal: ${formatPrice(receipt.subtotal)}`);
  lines.push(`Tax: ${formatPrice(receipt.tax)}`);
  lines.push(`─────────────────`);
  lines.push(`*Total: ${formatPrice(receipt.total)}*`);

  if (receipt.coinsEarned > 0) {
    lines.push(``);
    lines.push(`🪙 You earned ${receipt.coinsEarned} coins!`);
  }

  lines.push(``);
  lines.push(`─────────────────`);

  if (receipt.paymentMethod) {
    lines.push(`💳 Payment: ${receipt.paymentMethod}`);
  }

  lines.push(``);
  lines.push(`🔗 Reorder: ${receipt.reorderLink}`);
  lines.push(``);
  lines.push(`Questions? Contact us at ${receipt.storePhone}`);
  lines.push(``);
  lines.push(`_Powered by REZ_`);

  return lines.join('\n');
}

/**
 * Generate QR code URL for reorder
 */
function generateReorderQRUrl(orderId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://reznow.app';
  return `${baseUrl}/order/${orderId}/reorder`;
}

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * Send WhatsApp receipt via WhatsApp Business API
 */
export async function sendWhatsAppReceipt(receipt: WhatsAppReceipt): Promise<SendReceiptResult> {
  try {
    // Validate required fields
    if (!receipt.phone || !receipt.orderId) {
      return { success: false, error: 'Missing required fields: phone or orderId' };
    }

    // Check if WhatsApp API is configured
    if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
      logger.warn('[WhatsApp] WhatsApp API not configured, skipping receipt', {
        orderId: receipt.orderId,
      });
      return { success: false, error: 'WhatsApp API not configured' };
    }

    const formattedPhone = formatPhoneForWhatsApp(receipt.phone);
    const messageText = generateReceiptText(receipt);
    const reorderLink = receipt.reorderLink || generateReorderQRUrl(receipt.orderId);

    // Prepare the message payload with media (QR code)
    const qrCodeUrl = generateReorderQRUrl(receipt.orderId);

    const payload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'text',
      text: {
        preview_url: false,
        body: messageText,
      },
    };

    const response = await fetch(`${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('[WhatsApp] Failed to send receipt', {
        status: response.status,
        error: errorData,
        orderId: receipt.orderId,
      });
      return {
        success: false,
        error: `WhatsApp API error: ${response.status}`,
      };
    }

    const result = await response.json();

    logger.info('[WhatsApp] Receipt sent successfully', {
      messageId: result.messages?.[0]?.id,
      orderId: receipt.orderId,
      phone: formattedPhone.slice(-10), // Log last 10 digits only
    });

    return {
      success: true,
      messageId: result.messages?.[0]?.id,
    };
  } catch (error) {
    logger.error('[WhatsApp] Error sending receipt', {
      error,
      orderId: receipt.orderId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send WhatsApp receipt with image attachment (QR code)
 */
export async function sendWhatsAppReceiptWithQR(
  receipt: WhatsAppReceipt,
  qrCodeImageUrl: string
): Promise<SendReceiptResult> {
  try {
    if (!receipt.phone || !receipt.orderId) {
      return { success: false, error: 'Missing required fields: phone or orderId' };
    }

    if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
      logger.warn('[WhatsApp] WhatsApp API not configured, skipping receipt with QR');
      return { success: false, error: 'WhatsApp API not configured' };
    }

    const formattedPhone = formatPhoneForWhatsApp(receipt.phone);
    const messageText = generateReceiptText(receipt);

    // First send the text message
    const textPayload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'text',
      text: {
        preview_url: false,
        body: messageText,
      },
    };

    const textResponse = await fetch(`${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(textPayload),
    });

    if (!textResponse.ok) {
      const errorData = await textResponse.json().catch(() => ({}));
      logger.error('[WhatsApp] Failed to send text receipt', {
        status: textResponse.status,
        error: errorData,
      });
      return { success: false, error: `WhatsApp API error: ${textResponse.status}` };
    }

    const textResult = await textResponse.json();

    // Then send the QR code image
    const imagePayload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'image',
      image: {
        link: qrCodeImageUrl,
        caption: 'Scan to reorder your favorite items!',
      },
    };

    await fetch(`${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(imagePayload),
    });

    return {
      success: true,
      messageId: textResult.messages?.[0]?.id,
    };
  } catch (error) {
    logger.error('[WhatsApp] Error sending receipt with QR', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send a simple order confirmation WhatsApp message
 */
export async function sendWhatsAppOrderConfirmation(
  phone: string,
  orderNumber: string,
  storeName: string,
  total: number
): Promise<SendReceiptResult> {
  try {
    if (!phone) {
      return { success: false, error: 'Phone number is required' };
    }

    if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
      logger.warn('[WhatsApp] WhatsApp API not configured, skipping confirmation');
      return { success: false, error: 'WhatsApp API not configured' };
    }

    const formattedPhone = formatPhoneForWhatsApp(phone);

    const message = `✅ *Order Confirmed!*\n\n` +
      `Your order #${orderNumber} at ${storeName} has been received.\n\n` +
      `Total: ${formatPrice(total)}\n\n` +
      `We'll notify you when it's ready. Thank you for ordering with REZ! 🍽️`;

    const payload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'text',
      text: {
        preview_url: false,
        body: message,
      },
    };

    const response = await fetch(`${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return { success: false, error: `WhatsApp API error: ${response.status}` };
    }

    const result = await response.json();
    return { success: true, messageId: result.messages?.[0]?.id };
  } catch (error) {
    logger.error('[WhatsApp] Error sending order confirmation', { error });
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Process incoming WhatsApp webhook
 */
export function processWhatsAppWebhook(
  body: Record<string, unknown>
): { status: 'ok' | 'error'; message?: string } {
  try {
    // Verify webhook
    if ('challenge' in body) {
      return { status: 'ok', message: body.challenge as string };
    }

    const entry = (body.entry as Array<Record<string, unknown>>)?.[0];
    const changes = (entry?.changes as Array<Record<string, unknown>>)?.[0];
    const value = changes?.value as Record<string, unknown>;
    const messages = value?.messages as Array<Record<string, unknown>>;

    if (!messages || messages.length === 0) {
      return { status: 'ok' };
    }

    const message = messages[0];
    const from = message.from as string;
    const text = (message.text as Record<string, unknown>)?.body as string;
    const messageId = message.id as string;

    logger.info('[WhatsApp] Received webhook', {
      from,
      messageId,
      text: text?.slice(0, 50),
    });

    // Return acknowledgment
    return { status: 'ok' };
  } catch (error) {
    logger.error('[WhatsApp] Error processing webhook', { error });
    return { status: 'error', message: 'Failed to process webhook' };
  }
}

/**
 * Parse WhatsApp message status webhook
 */
export function parseStatusWebhook(
  body: Record<string, unknown>
): { messageId: string; status: WhatsAppStatus['status']; timestamp: string } | null {
  try {
    const entry = (body.entry as Array<Record<string, unknown>>)?.[0];
    const changes = (entry?.changes as Array<Record<string, unknown>>)?.[0];
    const value = changes?.value as Record<string, unknown>;
    const statuses = value?.statuses as Array<Record<string, unknown>>;

    if (!statuses || statuses.length === 0) {
      return null;
    }

    const statusUpdate = statuses[0];
    return {
      messageId: statusUpdate.id as string,
      status: statusUpdate.status as WhatsAppStatus['status'],
      timestamp: statusUpdate.timestamp as string,
    };
  } catch {
    return null;
  }
}

// ── Order Receipt Builder ──────────────────────────────────────────────────────

/**
 * Build WhatsAppReceipt from order data
 */
export function buildReceiptFromOrder(
  order: {
    id: string;
    orderNumber: string;
    items: OrderItem[];
    subtotal: number;
    gst: number;
    total: number;
    customerPhone: string | null;
    storeName: string;
    storePhone: string;
    tableNumber?: string | null;
    orderType?: 'dine_in' | 'takeaway' | 'delivery';
    paymentMethod?: string;
  },
  coinsEarned: number = 0,
  reorderLink?: string
): WhatsAppReceipt {
  return {
    phone: order.customerPhone || '',
    orderId: order.id,
    orderNumber: order.orderNumber,
    storeName: order.storeName,
    storePhone: order.storePhone,
    items: order.items,
    subtotal: order.subtotal,
    tax: order.gst,
    total: order.total,
    coinsEarned,
    reorderLink: reorderLink || generateReorderQRUrl(order.id),
    paymentMethod: order.paymentMethod,
    tableNumber: order.tableNumber || undefined,
    orderType: order.orderType || 'takeaway',
  };
}

// ── Export for order integration ──────────────────────────────────────────────

export default {
  sendWhatsAppReceipt,
  sendWhatsAppReceiptWithQR,
  sendWhatsAppOrderConfirmation,
  processWhatsAppWebhook,
  parseStatusWebhook,
  buildReceiptFromOrder,
};
