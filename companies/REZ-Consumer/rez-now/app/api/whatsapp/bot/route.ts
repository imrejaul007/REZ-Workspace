/**
 * WhatsApp Bot Webhook API Route
 *
 * Receives and processes incoming WhatsApp messages.
 * POST /api/whatsapp/bot
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { logger } from '@/lib/utils/logger';
import { processWhatsAppMessage, WhatsAppBotMessage, WhatsAppBotResponse } from '@/lib/whatsapp/bot';

// ── WhatsApp API Configuration ─────────────────────────────────────────────────

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const WHATSAPP_APP_SECRET = process.env.WHATSAPP_APP_SECRET || '';

/**
 * Verify WhatsApp webhook signature using HMAC-SHA256
 * Prevents spoofed webhook requests
 */
function verifyWhatsAppSignature(payload: string, signature: string): boolean {
  if (!WHATSAPP_APP_SECRET) {
    logger.warn('[WhatsApp Bot] APP_SECRET not configured - skipping signature verification');
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

// ── Message Sending ─────────────────────────────────────────────────────────────

/**
 * Send a response message via WhatsApp API
 */
export async function sendWhatsAppMessage(
  to: string,
  response: WhatsAppBotResponse
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    logger.warn('[WhatsApp Bot] API not configured');
    return { success: false, error: 'WhatsApp API not configured' };
  }

  try {
    let payload: Record<string, unknown>;

    if (response.type === 'text') {
      payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: {
          preview_url: false,
          body: response.content as string,
        },
      };
    } else if (response.type === 'interactive') {
      const interactive = response.content as {
        type: 'button' | 'list';
        header?: string;
        body: string;
        footer?: string;
        buttons?: Array<{ id: string; title: string }>;
        sections?: Array<{
          title: string;
          rows: Array<{ id: string; title: string; description?: string }>;
        }>;
      };

      if (interactive.type === 'button') {
        payload = {
          messaging_product: 'whatsapp',
          to,
          type: 'interactive',
          interactive: {
            type: 'buttons',
            header: interactive.header ? { type: 'text', text: interactive.header } : undefined,
            body: { text: interactive.body },
            footer: interactive.footer ? { text: interactive.footer } : undefined,
            buttons: interactive.buttons?.map(btn => ({
              type: 'reply',
              reply: { id: btn.id, title: btn.title.slice(0, 20) },
            })),
          },
        };
      } else {
        payload = {
          messaging_product: 'whatsapp',
          to,
          type: 'interactive',
          interactive: {
            type: 'list',
            header: interactive.header ? { type: 'text', text: interactive.header } : undefined,
            body: { text: interactive.body },
            footer: interactive.footer ? { text: interactive.footer } : undefined,
            action: {
              button: 'Menu Options',
              sections: interactive.sections?.map(section => ({
                title: section.title.slice(0, 20),
                rows: section.rows.map(row => ({
                  id: row.id,
                  title: row.title.slice(0, 24),
                  description: row.description?.slice(0, 72),
                })),
              })),
            },
          },
        };
      }
    } else {
      return { success: false, error: 'Unsupported message type' };
    }

    const response_wa = await fetch(`${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response_wa.ok) {
      const error = await response_wa.json();
      logger.error('[WhatsApp Bot] Failed to send message', { error });
      return { success: false, error: `API error: ${response_wa.status}` };
    }

    const result = await response_wa.json();
    return { success: true, messageId: result.messages?.[0]?.id };
  } catch (error) {
    logger.error('[WhatsApp Bot] Error sending message', { error });
    return { success: false, error: 'Failed to send message' };
  }
}

// ── Webhook Verification ────────────────────────────────────────────────────────

const WHATSAPP_WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '';

/**
 * GET - Webhook verification
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    logger.info('[WhatsApp Bot] Webhook verified');
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

// ── Message Processing ─────────────────────────────────────────────────────────

/**
 * POST - Process incoming messages
 */
export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await req.text();

    // SECURITY: Verify WhatsApp webhook signature
    const signature = req.headers.get('x-hub-signature-256') || req.headers.get('x-whatsapp-signature');
    if (!verifyWhatsAppSignature(rawBody, signature || '')) {
      logger.warn('[WhatsApp Bot] Invalid signature - possible spoofed request');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const body = JSON.parse(rawBody);

    // Extract message from webhook
    const entry = (body.entry as Array<Record<string, unknown>>)?.[0];
    const changes = (entry?.changes as Array<Record<string, unknown>>)?.[0];
    const value = changes?.value as Record<string, unknown>;
    const messages = value?.messages as Array<Record<string, unknown>>;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ status: 'ok' });
    }

    const msg = messages[0];
    const from = msg.from as string;
    const messageId = msg.id as string;
    const msgType = msg.type as string;

    logger.info('[WhatsApp Bot] Received message', {
      from: from.slice(-10),
      messageId,
      type: msgType,
    });

    // Only process text messages for now
    if (msgType !== 'text') {
      return NextResponse.json({ status: 'ok' });
    }

    const text = (msg.text as Record<string, unknown>)?.body as string;

    // Create message object
    const message: WhatsAppBotMessage = {
      from,
      messageId,
      type: 'text',
      text,
      timestamp: new Date().toISOString(),
    };

    // Process message and get response
    const response = processWhatsAppMessage(message);

    // Send response
    const sendResult = await sendWhatsAppMessage(from, response);

    if (sendResult.success) {
      logger.info('[WhatsApp Bot] Response sent', { messageId: sendResult.messageId });
    } else {
      logger.error('[WhatsApp Bot] Failed to send response', { error: sendResult.error });
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    logger.error('[WhatsApp Bot] Error processing webhook', { error });
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
