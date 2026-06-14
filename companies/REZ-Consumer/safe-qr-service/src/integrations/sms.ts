import axios from 'axios';
import { config } from '../config';
import logger from '../utils/logger';

/**
 * SMS Integration via RABTUL Notifications Service
 * Fallback for users without smartphones
 */

interface SMSPayload {
  to: string;
  message: string;
  template?: string;
}

const TEMPLATES = {
  new_scan: {
    templateId: 'SAFE_QR_SCAN',
    message: '📍 Your Safe QR {shortcode} was scanned! View messages in ReZ Safe QR app.',
  },
  new_message: {
    templateId: 'SAFE_QR_MESSAGE',
    message: '💬 New message for {itemName}: "{preview}" - Reply in ReZ Safe QR app.',
  },
  lost_mode: {
    templateId: 'SAFE_QR_LOST',
    message: '⚠️ Lost mode activated for {itemName} ({shortcode}). Help others find it!',
  },
  item_found: {
    templateId: 'SAFE_QR_FOUND',
    message: '🎉 Great news! Your {itemName} has been found. Mark as resolved in app.',
  },
  karma_earned: {
    templateId: 'SAFE_QR_KARMA',
    message: '⭐ You earned {points} karma points! Total: {total} points. Keep helping!',
  },
};

/**
 * Send SMS via RABTUL Notifications
 */
export async function sendSMS(
  payload: SMSPayload
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const client = axios.create({
      baseURL: config.notifications.url,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': config.internalToken,
      },
    });

    // Format phone number (India format)
    let phone = payload.to.replace(/\D/g, '');
    if (phone.length === 10) {
      phone = '91' + phone;
    }
    if (!phone.startsWith('91') && !phone.startsWith('+')) {
      phone = '91' + phone;
    }

    const response = await client.post('/api/sms/send', {
      to: phone,
      message: payload.message,
      templateId: payload.template,
    });

    return {
      success: true,
      messageId: response.data?.messageId,
    };
  } catch (error) {
    logger.error('SMS send failed:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
}

/**
 * Safe QR specific SMS notifications
 */
export const safeQRSMS = {
  /**
   * Notify owner when QR is scanned
   */
  async onScan(
    ownerPhone: string,
    shortcode: string,
    itemName: string
  ): Promise<{ success: boolean }> {
    const template = TEMPLATES.new_scan;
    const message = template.message
      .replace('{shortcode}', shortcode)
      .replace('{itemName}', itemName);

    return sendSMS({
      to: ownerPhone,
      message,
      template: template.templateId,
    });
  },

  /**
   * Notify owner of new message
   */
  async onNewMessage(
    ownerPhone: string,
    itemName: string,
    preview: string
  ): Promise<{ success: boolean }> {
    const template = TEMPLATES.new_message;
    const truncated = preview.length > 50 ? preview.substring(0, 50) + '...' : preview;
    const message = template.message
      .replace('{itemName}', itemName)
      .replace('{preview}', truncated);

    return sendSMS({
      to: ownerPhone,
      message,
      template: template.templateId,
    });
  },

  /**
   * Notify when lost mode activated
   */
  async onLostModeActivated(
    ownerPhone: string,
    itemName: string,
    shortcode: string
  ): Promise<{ success: boolean }> {
    const template = TEMPLATES.lost_mode;
    const message = template.message
      .replace('{itemName}', itemName)
      .replace('{shortcode}', shortcode);

    return sendSMS({
      to: ownerPhone,
      message,
      template: template.templateId,
    });
  },

  /**
   * Notify when item is found
   */
  async onFound(
    ownerPhone: string,
    itemName: string
  ): Promise<{ success: boolean }> {
    const template = TEMPLATES.item_found;
    const message = template.message.replace('{itemName}', itemName);

    return sendSMS({
      to: ownerPhone,
      message,
      template: template.templateId,
    });
  },

  /**
   * Notify of karma earned
   */
  async onKarmaEarned(
    ownerPhone: string,
    points: number,
    totalPoints: number
  ): Promise<{ success: boolean }> {
    const template = TEMPLATES.karma_earned;
    const message = template.message
      .replace('{points}', points.toString())
      .replace('{total}', totalPoints.toString());

    return sendSMS({
      to: ownerPhone,
      message,
      template: template.templateId,
    });
  },
};
