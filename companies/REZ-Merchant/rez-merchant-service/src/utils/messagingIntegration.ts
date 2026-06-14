/**
 * UNIFIED MESSAGING INTEGRATION
 * Connects Merchant Service to WhatsApp/SMS/Push Services
 */

import axios, { AxiosError } from 'axios';
import { logger } from '../config/logger';

const UNIFIED_MESSAGING_URL = process.env.UNIFIED_MESSAGING_URL || 'http://localhost:4025';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

// Fail-closed: prevent calls if token is not configured
if (!INTERNAL_TOKEN) {
  throw new Error('INTERNAL_SERVICE_TOKEN environment variable is required for internal service authentication');
}

// Response type for WhatsApp number lookup
interface WhatsAppNumber {
  merchantId: string;
  phoneNumber: string;
  wabaId: string;
  status: string;
}

// Response type for channel routing results
interface ChannelRoutingResult {
  channel: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send WhatsApp message to a customer
 */
export async function sendWhatsAppMessage(
  to: string,
  body: string,
  merchantId: string,
  options?: {
    imageUrl?: string;
    template?: string;
    buttons?: { id: string; text: string }[];
  }
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const response = await axios.post(`${UNIFIED_MESSAGING_URL}/api/send/whatsapp`, {
      to,
      body,
      merchantId,
      ...options,
    }, {
      headers: {
        'x-internal-token': INTERNAL_TOKEN,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    return response.data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Messaging] WhatsApp failed:', message);
    return { success: false, error: message };
  }
}

/**
 * Send SMS to a customer
 */
export async function sendSMS(
  to: string,
  message: string,
  merchantId: string
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const response = await axios.post(`${UNIFIED_MESSAGING_URL}/api/send/sms`, {
      to,
      message,
      merchantId,
    }, {
      headers: {
        'x-internal-token': INTERNAL_TOKEN,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    return response.data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Messaging] SMS failed:', message);
    return { success: false, error: message };
  }
}

/**
 * Send Push notification to a customer
 */
export async function sendPushNotification(
  deviceToken: string,
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  },
  merchantId: string
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const response = await axios.post(`${UNIFIED_MESSAGING_URL}/api/send/push`, {
      token: deviceToken,
      notification,
      merchantId,
    }, {
      headers: {
        'x-internal-token': INTERNAL_TOKEN,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    return response.data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Messaging] Push failed:', message);
    return { success: false, error: message };
  }
}

/**
 * Send email to a customer
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  merchantId: string
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const response = await axios.post(`${UNIFIED_MESSAGING_URL}/api/send/email`, {
      to,
      subject,
      html,
      merchantId,
    }, {
      headers: {
        'x-internal-token': INTERNAL_TOKEN,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    return response.data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Messaging] Email failed:', message);
    return { success: false, error: message };
  }
}

/**
 * Send channel-routed message (AI-powered)
 */
export async function sendChannelRoutedMessage(
  userId: string,
  phone: string,
  email: string,
  deviceToken: string,
  temperature: 'hot' | 'warm' | 'cold',
  urgency: 'critical' | 'high' | 'medium' | 'low',
  payload: {
    type: 'marketing' | 'transactional' | 'support' | 'reminder' | 'offer';
    title?: string;
    body: string;
    imageUrl?: string;
    actionUrl?: string;
    actionText?: string;
  },
  merchantId: string
): Promise<ChannelRoutingResult[]> {
  try {
    const response = await axios.post(`${UNIFIED_MESSAGING_URL}/api/route`, {
      userId,
      phone,
      email,
      deviceToken,
      temperature,
      urgency,
      payload,
      merchantId,
    }, {
      headers: {
        'x-internal-token': INTERNAL_TOKEN,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    return (response.data.results || []) as ChannelRoutingResult[];
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Messaging] Route failed:', message);
    return [];
  }
}

/**
 * Get merchant's WhatsApp number
 */
export async function getMerchantWhatsAppNumber(
  merchantId: string
): Promise<{
  phoneNumber: string;
  wabaId: string;
  status: string;
} | null> {
  try {
    const response = await axios.get(`${UNIFIED_MESSAGING_URL}/api/merchant/whatsapp/numbers`, {
      params: { merchantId },
      headers: {
        'x-internal-token': INTERNAL_TOKEN,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });

    const numbers = (response.data.data || []) as WhatsAppNumber[];
    return numbers.find((n) => n.merchantId === merchantId) || null;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Messaging] Get WhatsApp number failed:', message);
    return null;
  }
}

/**
 * Register merchant for WhatsApp Business
 */
export async function registerMerchantWhatsApp(
  merchantId: string,
  businessName: string,
  phoneNumber: string
): Promise<{
  success: boolean;
  whatsappId?: string;
  error?: string;
}> {
  try {
    const response = await axios.post(`${UNIFIED_MESSAGING_URL}/api/merchant/whatsapp/numbers`, {
      merchantId,
      businessName,
      phoneNumber,
      config: {
        businessName,
        autoReply: true,
        aiAssistant: true,
        aiPersona: 'helpful_assistant',
      },
    }, {
      headers: {
        'x-internal-token': INTERNAL_TOKEN,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    return { success: true, whatsappId: response.data.data?.id };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Messaging] Register WhatsApp failed:', message);
    return { success: false, error: message };
  }
}

/**
 * Get messaging analytics for merchant
 */
export async function getMessagingAnalytics(
  merchantId: string
): Promise<{
  whatsapp: { sent: number; delivered: number; read: number };
  sms: { sent: number; delivered: number };
  email: { sent: number; opened: number };
  push: { sent: number; clicked: number };
}> {
  try {
    const response = await axios.get(`${UNIFIED_MESSAGING_URL}/api/messaging/analytics`, {
      params: { merchantId },
      headers: {
        'x-internal-token': INTERNAL_TOKEN,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    return response.data.data || {
      whatsapp: { sent: 0, delivered: 0, read: 0 },
      sms: { sent: 0, delivered: 0 },
      email: { sent: 0, opened: 0 },
      push: { sent: 0, clicked: 0 },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Messaging] Get analytics failed:', message);
    return {
      whatsapp: { sent: 0, delivered: 0, read: 0 },
      sms: { sent: 0, delivered: 0 },
      email: { sent: 0, opened: 0 },
      push: { sent: 0, clicked: 0 },
    };
  }
}

/**
 * Send bulk message to customer segment
 */
export async function sendBulkMessage(
  segment: 'hot' | 'warm' | 'cold' | 'all',
  payload: {
    type: string;
    title?: string;
    body: string;
    imageUrl?: string;
  },
  merchantId: string,
  customerIds: string[]
): Promise<{
  total: number;
  sent: number;
  failed: number;
}> {
  try {
    const response = await axios.post(`${UNIFIED_MESSAGING_URL}/api/broadcast/segment`, {
      segment,
      payload,
      merchantId,
      customerIds,
    }, {
      headers: {
        'x-internal-token': INTERNAL_TOKEN,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });

    return response.data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Messaging] Bulk send failed:', message);
    return { total: customerIds.length, sent: 0, failed: customerIds.length };
  }
}
