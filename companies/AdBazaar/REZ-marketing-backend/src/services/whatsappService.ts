import logger from 'utils/logger.js';

import axios from 'axios';

const API_URL = 'https://graph.facebook.com/v18.0';

interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookVerifyToken: string;
}

interface TemplateComponent {
  type: 'header' | 'body' | 'footer' | 'buttons';
  text?: string;
  format?: string;
  parameters?: { key: string; value: string }[];
}

interface WhatsAppMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text' | 'template';
  recipient_type?: 'individual';
  text?: { body: string };
  template?: {
    name: string;
    language: { code: string };
    components: TemplateComponent[];
  };
}

export class WhatsAppService {
  private config: WhatsAppConfig;

  constructor(config: WhatsAppConfig) {
    this.config = config;
  }

  async sendMessage(phone: string, message: string): Promise<unknown> {
    const payload: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to: this.formatPhone(phone),
      recipient_type: 'individual',
      type: 'text',
      text: { body: message }
    };

    return this.send(payload);
  }

  async sendTemplateMessage(
    phone: string,
    templateName: string,
    components: TemplateComponent[]
  ): Promise<unknown> {
    const payload: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to: this.formatPhone(phone),
      recipient_type: 'individual',
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en_US' },
        components
      }
    };

    return this.send(payload);
  }

  private async send(payload: WhatsAppMessage): Promise<unknown> {
    const url = `${API_URL}/${this.config.phoneNumberId}/messages`;

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info(`WhatsApp message sent to ${payload.to}`);
      return response.data;
    } catch (error) {
      logger.error('WhatsApp send error:', error.response?.data || error.message);
      throw error;
    }
  }

  private formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `91${digits}`;
    }
    return digits;
  }

  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.config.webhookVerifyToken) {
      logger.info('Webhook verified');
      return challenge;
    }
    return null;
  }

  async handleIncomingMessage(payload): Promise<void> {
    const message = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return;

    const event = {
      from: message.from,
      type: message.type,
      text: message.text?.body,
      timestamp: new Date(parseInt(message.timestamp) * 1000)
    };

    logger.info('WhatsApp message received:', event);

    // Emit event for processing
    // eventEmitter.emit('whatsapp:message', event);
  }
}

// Template messages
export const WHATSAPP_TEMPLATES = {
  order_confirmation: {
    name: 'order_confirmation',
    category: 'ORDER_UPDATE',
    components: [
      { type: 'header', format: 'text', text: 'Order Confirmed! 🎉' },
      { type: 'body', text: 'Hi {{1}}, your order #{{2}} is confirmed. Total: ₹{{3}}' },
      { type: 'footer', text: 'Thank you for ordering!' }
    ]
  },
  abandoned_cart: {
    name: 'abandoned_cart_reminder',
    category: 'MARKETING',
    components: [
      { type: 'header', format: 'text', text: 'Complete Your Order! 🛒' },
      { type: 'body', text: 'Don\'t forget your cart! Use code {{1}} for {{2}}% off.' }
    ]
  },
  birthday: {
    name: 'birthday_wish',
    category: 'MARKETING',
    components: [
      { type: 'header', format: 'text', text: '🎂 Happy Birthday!' },
      { type: 'body', text: 'Hi {{1}}! Here\'s a special gift for you!' }
    ]
  }
};
