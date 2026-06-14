import axios from 'axios';
import { config } from '../config';
import logger from '../utils/logger';

/**
 * WhatsApp Integration via ReZ WhatsApp Commerce Service
 * Sends notifications and messages via WhatsApp
 */

interface WhatsAppMessage {
  to: string;
  template: string;
  params?: Record<string, string>;
  language?: string;
}

interface WhatsAppTemplate {
  name: string;
  components: Array<{
    type: 'header' | 'body' | 'button';
    text?: string;
    parameters?: Array<{ type: string; text?: string }>;
  }>;
}

// Pre-defined templates
const templates: Record<string, WhatsAppTemplate> = {
  new_scan: {
    name: 'safe_qr_scanned',
    components: [
      { type: 'body', parameters: [{ type: 'text', text: '{{1}}' }] },
    ],
  },
  lost_mode_activated: {
    name: 'safe_qr_lost_activated',
    components: [
      { type: 'body', parameters: [{ type: 'text', text: '{{1}}' }] },
    ],
  },
  new_message: {
    name: 'safe_qr_new_message',
    components: [
      { type: 'body', parameters: [{ type: 'text', text: '{{1}}' }] },
    ],
  },
  contact_request: {
    name: 'safe_qr_contact_request',
    components: [
      { type: 'body', parameters: [{ type: 'text', text: '{{1}}' }] },
    ],
  },
  item_found: {
    name: 'safe_qr_item_found',
    components: [
      { type: 'body', parameters: [{ type: 'text', text: '{{1}}' }] },
    ],
  },
  karma_earned: {
    name: 'safe_qr_karma_earned',
    components: [
      { type: 'body', parameters: [{ type: 'text', text: '{{1}}' }] },
    ],
  },
};

/**
 * Send WhatsApp message via ReZ WhatsApp Commerce
 */
export async function sendWhatsAppMessage(
  payload: WhatsAppMessage
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const client = axios.create({
      baseURL: config.whatsapp.url,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': config.internalToken,
      },
    });

    const template = templates[payload.template];
    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    const response = await client.post('/api/messages', {
      messaging_product: 'whatsapp',
      to: payload.to,
      type: 'template',
      template: {
        name: template.name,
        language: { code: payload.language || 'en' },
        components: template.components.map((c) => ({
          type: c.type,
          ...(c.text ? { text: c.text } : {}),
          ...(c.parameters
            ? {
                parameters: c.parameters.map((p) => ({
                  type: p.type,
                  ...(p.text ? { text: p.text } : {}),
                })),
              }
            : {}),
        })),
      },
    });

    return {
      success: true,
      messageId: response.data?.messages?.[0]?.id,
    };
  } catch (error) {
    logger.error('WhatsApp send failed:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
}

/**
 * Safe QR specific WhatsApp notifications
 */
export const safeQRWhatsApp = {
  /**
   * Notify owner when QR is scanned
   */
  async onScan(
    ownerPhone: string,
    itemName: string,
    mode: string
  ): Promise<{ success: boolean }> {
    return sendWhatsAppMessage({
      to: ownerPhone,
      template: 'new_scan',
      params: { '1': itemName },
    });
  },

  /**
   * Notify owner when lost mode is activated
   */
  async onLostModeActivated(
    ownerPhone: string,
    itemName: string
  ): Promise<{ success: boolean }> {
    return sendWhatsAppMessage({
      to: ownerPhone,
      template: 'lost_mode_activated',
      params: { '1': itemName },
    });
  },

  /**
   * Notify owner of new message
   */
  async onNewMessage(
    ownerPhone: string,
    finderName: string
  ): Promise<{ success: boolean }> {
    return sendWhatsAppMessage({
      to: ownerPhone,
      template: 'new_message',
      params: { '1': finderName },
    });
  },

  /**
   * Notify owner of contact request
   */
  async onContactRequest(
    ownerPhone: string,
    requesterName: string
  ): Promise<{ success: boolean }> {
    return sendWhatsAppMessage({
      to: ownerPhone,
      template: 'contact_request',
      params: { '1': requesterName },
    });
  },

  /**
   * Notify owner when item is found
   */
  async onFound(
    ownerPhone: string,
    helperName: string
  ): Promise<{ success: boolean }> {
    return sendWhatsAppMessage({
      to: ownerPhone,
      template: 'item_found',
      params: { '1': helperName },
    });
  },

  /**
   * Notify user of karma earned
   */
  async onKarmaEarned(
    userPhone: string,
    points: number,
    reason: string
  ): Promise<{ success: boolean }> {
    return sendWhatsAppMessage({
      to: userPhone,
      template: 'karma_earned',
      params: { '1': `+${points} karma points! ${reason}` },
    });
  },
};
