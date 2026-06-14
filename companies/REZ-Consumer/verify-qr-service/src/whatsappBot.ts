/**
 * REZ Verify QR - WhatsApp Bot Integration
 * WhatsApp commerce for warranty verification and claims
 */

import express, { Request, Response } from 'express';
import logger from './utils/logger';
import crypto from 'crypto';
import axios from 'axios';

const router = express.Router();

// WhatsApp Cloud API configuration
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const WHATSAPP_WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'verify_qr_webhook';

// Templates
const TEMPLATES = {
  verification_result: {
    name: 'verification_result',
    language: { code: 'en' },
    components: [
      {
        type: 'header',
        parameters: [{ type: 'text', text: '{{1}}' }]
      },
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{2}}' },
          { type: 'text', text: '{{3}}' },
          { type: 'text', text: '{{4}}' }
        ]
      },
      {
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [{ type: 'text', text: '{{5}}' }]
      }
    ]
  },
  warranty_activated: {
    name: 'warranty_activated',
    language: { code: 'en' },
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{1}}' },
          { type: 'text', text: '{{2}}' },
          { type: 'text', text: '{{3}}' }
        ]
      }
    ]
  },
  claim_updates: {
    name: 'claim_updates',
    language: { code: 'en' },
    components: [
      {
        type: 'header',
        parameters: [{ type: 'text', text: '{{1}}' }]
      },
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{2}}' },
          { type: 'text', text: '{{3}}' },
          { type: 'text', text: '{{4}}' }
        ]
      }
    ]
  },
  express_replacement_initiated: {
    name: 'express_replacement_initiated',
    language: { code: 'en' },
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{1}}' },
          { type: 'text', text: '{{2}}' },
          { type: 'text', text: '{{3}}' }
        ]
      }
    ]
  },
  resale_verification_complete: {
    name: 'resale_verification_complete',
    language: { code: 'en' },
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{1}}' },
          { type: 'text', text: '{{2}}' },
          { type: 'text', text: '{{3}}' }
        ]
      }
    ]
  },
  product_recall: {
    name: 'product_recall',
    language: { code: 'en' },
    components: [
      {
        type: 'header',
        parameters: [{ type: 'text', text: '{{1}}' }]
      },
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{2}}' },
          { type: 'text', text: '{{3}}' },
          { type: 'text', text: '{{4}}' }
        ]
      }
    ]
  },
  reminder_service_booking: {
    name: 'reminder_service_booking',
    language: { code: 'en' },
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{1}}' },
          { type: 'text', text: '{{2}}' },
          { type: 'text', text: '{{3}}' }
        ]
      }
    ]
  }
};

// ============================================
// WEBHOOK SETUP
// ============================================

/**
 * GET /api/whatsapp/webhook
 * Webhook verification for WhatsApp
 */
router.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    logger.info('WhatsApp webhook verified');
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
});

/**
 * POST /api/whatsapp/webhook
 * Receive WhatsApp messages
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { entry } = req.body;

    if (!entry || !entry[0]?.changes) {
      return res.status(200).send('OK');
    }

    const changes = entry[0].changes;
    const value = changes[0]?.value;

    if (!value?.messages) {
      return res.status(200).send('OK');
    }

    const message = value.messages[0];

    if (message.type === 'text') {
      await handleIncomingMessage(message, value.metadata?.phone_number_id);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(500).send('Internal error');
  }
});

/**
 * POST /api/whatsapp/send
 * Send a message via WhatsApp
 */
router.post('/send', async (req: Request, res: Response) => {
  const { phone, template, params, user_id } = req.body;

  if (!phone || !template) {
    return res.status(400).json({ error: 'Phone and template are required' });
  }

  try {
    const templateConfig = TEMPLATES[template as keyof typeof TEMPLATES];
    if (!templateConfig) {
      return res.status(400).json({ error: 'Invalid template name' });
    }

    // Format phone number (ensure it starts with country code)
    const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;

    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: templateConfig
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Log message for analytics
    try {
      await axios.post(`${process.env.INTELLIGENCE_API || 'https://rez-intelligence.onrender.com'}/api/intent/track`, {
        user_id: user_id || 'whatsapp_user',
        intent_type: 'whatsapp_message_sent',
        entities: { template, phone: formattedPhone },
        action: 'send'
      });
    } catch (e) {
    logger.warn('WhatsApp bot service call failed', { error: e instanceof Error ? e.message : String(e) });
  }

    res.json({
      success: true,
      message_id: response.data.messages?.[0]?.id
    });

  } catch (error) {
    console.error('WhatsApp send error:', error.response?.data || error);
    res.status(500).json({
      error: 'Failed to send message',
      details: error.response?.data?.error?.message
    });
  }
});

/**
 * POST /api/whatsapp/send-document
 * Send a document (certificate, invoice)
 */
router.post('/send-document', async (req: Request, res: Response) => {
  const { phone, caption, document_url, user_id } = req.body;

  try {
    const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;

    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'document',
        document: {
          link: document_url,
          caption
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      message_id: response.data.messages?.[0]?.id
    });

  } catch (error) {
    console.error('WhatsApp document send error:', error);
    res.status(500).json({ error: 'Failed to send document' });
  }
});

// ============================================
// MESSAGE HANDLERS
// ============================================

async function handleIncomingMessage(message, phoneId: string) {
  const from = message.from;
  const text = message.text?.body?.toLowerCase() || '';

  // Simple command handling
  if (text.startsWith('/verify ')) {
    const serial = text.replace('/verify ', '').trim();
    await handleVerifyCommand(from, serial);
  } else if (text.startsWith('/claim ')) {
    const claimId = text.replace('/claim ', '').trim();
    await handleClaimCommand(from, claimId);
  } else if (text === '/help') {
    await sendHelpMessage(from);
  } else if (text === '/status') {
    await sendStatusMessage(from);
  } else {
    await sendWelcomeMessage(from);
  }
}

async function handleVerifyCommand(phone: string, serial: string) {
  try {
    const response = await axios.post(
      `${process.env.VERIFY_API_URL || 'http://localhost:4003'}/api/verify`,
      { serial_number: serial },
      { timeout: 5000 }
    );

    const result = response.data;

    let message = '';
    if (result.status === 'AUTHENTIC') {
      message = `✅ *Product Verified*\n\n`;
      message += `Brand: ${result.brand}\n`;
      message += `Model: ${result.model}\n`;
      message += `Verification Count: ${result.verification_count}\n`;
      message += `Warranty: ${result.warranty_status}`;
    } else {
      message = `⚠️ *Verification Failed*\n\n`;
      message += `This product could not be verified.\n`;
      message += `Please contact support.`;
    }

    await sendTextMessage(phone, message);

  } catch (error) {
    await sendTextMessage(phone, '❌ Unable to verify. Please try again later.');
  }
}

async function handleClaimCommand(phone: string, claimId: string) {
  try {
    const response = await axios.get(
      `${process.env.VERIFY_API_URL || 'http://localhost:4003'}/api/claim/${claimId}`,
      { timeout: 5000 }
    );

    const claim = response.data;

    let message = `📋 *Claim Status*\n\n`;
    message += `Claim ID: ${claimId}\n`;
    message += `Status: ${claim.status}\n`;

    if (claim.status === 'approved') {
      message += `\n✅ Your claim has been approved!\n`;
      message += `You'll receive your replacement soon.`;
    } else if (claim.status === 'in_repair') {
      message += `\n🔧 Your device is being repaired.\n`;
      message += `Estimated completion: Check app for updates.`;
    }

    await sendTextMessage(phone, message);

  } catch (error) {
    await sendTextMessage(phone, '❌ Unable to fetch claim status. Please try again later.');
  }
}

async function sendHelpMessage(phone: string) {
  const message = `📖 *Verify QR Help*\n\n`;
  message += `*Commands:*\n`;
  message += `/verify <serial> - Verify product\n`;
  message += `/claim <claim_id> - Check claim status\n`;
  message += `/status - View warranty status\n`;
  message += `/help - Show this message\n\n`;
  message += `Or scan a QR code on your product!`;

  await sendTextMessage(phone, message);
}

async function sendStatusMessage(phone: string) {
  const message = `📊 *Your Warranty Status*\n\n`;
  message += `Visit: https://verify.rez.money\n`;
  message += `to view all your warranties and claims.`;

  await sendTextMessage(phone, message);
}

async function sendWelcomeMessage(phone: string) {
  const message = `👋 *Welcome to Verify QR!*\n\n`;
  message += `Verify your products and manage warranties easily.\n\n`;
  message += `*Quick Actions:*\n`;
  message += `• Type /verify <serial> to verify\n`;
  message += `• Type /help for all commands\n`;
  message += `• Scan a QR code on your product`;

  await sendTextMessage(phone, message);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function sendTextMessage(phone: string, text: string) {
  try {
    const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;

    await axios.post(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: { body: text }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
  }
}

// ============================================
// TEMPLATE MANAGEMENT
// ============================================

/**
 * GET /api/whatsapp/templates
 * List available message templates
 */
router.get('/templates', (req: Request, res: Response) => {
  const templates = Object.entries(TEMPLATES).map(([key, value]) => ({
    name: key,
    template_name: value.name,
    language: value.language.code
  }));

  res.json({ templates });
});

/**
 * POST /api/whatsapp/templates
 * Register a new template
 */
router.post('/templates', async (req: Request, res: Response) => {
  const { name, category = 'UTILITY' } = req.body;

  // This would normally use the Facebook Graph API to register templates
  // For now, we'll just acknowledge the request

  res.json({
    success: true,
    message: `Template '${name}' acknowledged. Use WhatsApp Business API to register.`,
    category
  });
});

export default router;
