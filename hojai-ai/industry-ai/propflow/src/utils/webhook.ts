/**
 * PROPFLOW - SDK & Webhook Helpers
 * Integration helpers for webhooks and HOJAI sync
 */

import axios from 'axios';
import { config } from '../config';
import { logger } from '../config/logger';

const INTERNAL_TOKEN = config.internalServiceToken;

export async function triggerWebhook(event: string, payload: any): Promise<void> {
  try {
    await axios.post(
      `${config.integrations.webhookServiceUrl}/api/events`,
      { event, payload, source: 'propflow' },
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN, 'Content-Type': 'application/json' } }
    );
    logger.info(`Webhook triggered: ${event}`);
  } catch (error: any) {
    logger.error(`Webhook error (${event}):`, error.message);
  }
}

export async function syncToHOJAI(entityType: string, action: string, data: any): Promise<void> {
  try {
    await axios.post(
      `${config.integrations.hojaiUrl}/api/sync`,
      { entityType, action, source: 'propflow', data, timestamp: new Date().toISOString() },
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN, 'Content-Type': 'application/json' } }
    );
    logger.info(`Synced to HOJAI: ${entityType}/${action}`);
  } catch (error: any) {
    if (error.response?.status !== 404) {
      logger.error(`HOJAI sync error:`, error.message);
    }
  }
}

export async function sendNotification(phone: string, message: string, channel: 'sms' | 'whatsapp' = 'sms'): Promise<void> {
  try {
    const endpoint = channel === 'whatsapp' ? '/api/whatsapp/send' : '/api/sms/send';
    await axios.post(
      `${config.integrations.notificationServiceUrl}${endpoint}`,
      channel === 'whatsapp' ? { to: phone, template: 'notification', variables: { message } } : { to: phone, message },
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    logger.error(`Notification error:`, error.message);
  }
}
