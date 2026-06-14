/**
 * WhatsApp Notifications API Route
 *
 * POST /api/notifications/whatsapp/send - Send a WhatsApp receipt
 * POST /api/notifications/whatsapp/webhook - Receive WhatsApp status updates
 * GET  /api/notifications/whatsapp/webhook - WhatsApp webhook verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { logger } from '@/lib/utils/logger';
import {
  sendWhatsAppReceipt,
  sendWhatsAppReceiptWithQR,
  processWhatsAppWebhook,
  parseStatusWebhook,
  buildReceiptFromOrder,
  WhatsAppReceipt,
} from '@/lib/notifications/whatsapp';

// ── Webhook Verification ────────────────────────────────────────────────────────

const WHATSAPP_WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '';
const WHATSAPP_APP_SECRET = process.env.WHATSAPP_APP_SECRET || '';

/**
 * Verify WhatsApp webhook signature using HMAC-SHA256
 * Prevents spoofed webhook requests
 */
function verifyWhatsAppSignature(payload: string, signature: string): boolean {
  if (!WHATSAPP_APP_SECRET) {
    logger.warn('[WhatsApp Webhook] APP_SECRET not configured - skipping signature verification');
    return true; // Fail open in dev, but log warning
  }

  if (!signature) {
    return false;
  }

  const expectedSignature = createHmac('sha256', WHATSAPP_APP_SECRET)
    .update(payload)
    .digest('hex');

  try {
    const sigBuffer = Buffer.from(signature.replace('sha256=', ''), 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * GET /api/notifications/whatsapp
 * WhatsApp webhook verification endpoint
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  logger.info('[WhatsApp Webhook] Verification request received', { mode, token: token ? 'present' : 'missing' });

  // Verify webhook
  if (mode === 'subscribe' && token === WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    logger.info('[WhatsApp Webhook] Verification successful');
    return new NextResponse(challenge, { status: 200 });
  }

  logger.warn('[WhatsApp Webhook] Verification failed', { mode, tokenMatches: token === WHATSAPP_WEBHOOK_VERIFY_TOKEN });
  return new NextResponse('Forbidden', { status: 403 });
}

// ── Send Receipt ────────────────────────────────────────────────────────────────

/**
 * POST /api/notifications/whatsapp/send
 * Send a WhatsApp receipt
 */
export async function POST(req: NextRequest) {
  // Check if this is a webhook or a send request
  const pathname = req.nextUrl.pathname;

  if (pathname.endsWith('/webhook')) {
    return handleWebhook(req);
  }

  return handleSendReceipt(req);
}

async function handleSendReceipt(req: NextRequest) {
  try {
    const body = await req.json();

    // Support both full receipt and order-based receipt
    let receipt: WhatsAppReceipt;

    if (body.order) {
      // Build receipt from order object
      receipt = buildReceiptFromOrder(
        body.order,
        body.coinsEarned || 0,
        body.reorderLink
      );
    } else {
      // Use provided receipt directly
      receipt = body as WhatsAppReceipt;
    }

    // Validate required fields
    if (!receipt.phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    logger.info('[WhatsApp API] Sending receipt', {
      orderId: receipt.orderId,
      orderNumber: receipt.orderNumber,
    });

    // Send with QR code if image URL provided
    let result;
    if (body.qrCodeImageUrl) {
      result = await sendWhatsAppReceiptWithQR(receipt, body.qrCodeImageUrl);
    } else {
      result = await sendWhatsAppReceipt(receipt);
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('[WhatsApp API] Error sending receipt', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ── Webhook Handler ────────────────────────────────────────────────────────────

async function handleWebhook(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await req.text();

    // SECURITY: Verify WhatsApp webhook signature
    const signature = req.headers.get('x-hub-signature-256') || req.headers.get('x-whatsapp-signature');
    if (!verifyWhatsAppSignature(rawBody, signature || '')) {
      logger.warn('[WhatsApp Webhook] Invalid signature - possible spoofed request');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const body = JSON.parse(rawBody);

    logger.debug('[WhatsApp Webhook] Received webhook', { body });

    // Check if this is a status update
    const statusUpdate = parseStatusWebhook(body);
    if (statusUpdate) {
      logger.info('[WhatsApp Webhook] Status update received', {
        messageId: statusUpdate.messageId,
        status: statusUpdate.status,
      });

      // Update message status in database
      await updateWhatsAppMessageStatus(statusUpdate.messageId, statusUpdate.status);

      return NextResponse.json({ status: 'received' });
    }

    // Process incoming message
    const result = processWhatsAppWebhook(body);

    if (result.status === 'ok') {
      return NextResponse.json({ status: 'ok' });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }
  } catch (error) {
    logger.error('[WhatsApp Webhook] Error processing webhook', { error });
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

/**
 * Update WhatsApp message status in database
 */
async function updateWhatsAppMessageStatus(
  messageId: string,
  status: string
): Promise<void> {
  // Map WhatsApp status to internal status
  const statusMap: Record<string, string> = {
    sent: 'SENT',
    delivered: 'DELIVERED',
    read: 'READ',
    failed: 'FAILED',
  };

  const internalStatus = statusMap[status] || status.toUpperCase();

  try {
    // Update in notification_logs table
    logger.info('[WhatsApp] Message status updated', {
      messageId,
      status: internalStatus,
      whatsappStatus: status,
    });

    // Trigger order status updates if applicable
    // await prisma.notification.update({ where: { messageId }, data: { status: internalStatus } });
  } catch (error) {
    logger.error('[WhatsApp] Failed to update message status', { messageId, status, error });
  }
}
