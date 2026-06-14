import axios, { AxiosInstance } from 'axios';
import { createLogger } from './logger';

const logger = createLogger({ serviceName: 'whatsapp-api' });

export interface WhatsAppConfig {
  apiUrl?: string;
  apiToken?: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  webhookVerifyToken?: string;
}

export interface SendMessageOptions {
  to: string;
  body?: string;
  mediaUrl?: string;
  caption?: string;
  templateName?: string;
  templateVariables?: Record<string, string>;
  replyToMessageId?: string;
  typingTime?: number;
}

export interface SendTemplateOptions {
  templateName: string;
  to: string;
  variables: Record<string, string>;
  headerMediaUrl?: string;
  footer?: string;
  buttons?: Array<{ type: string; text: string; url?: string; phoneNumber?: string }>;
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        to?: string;
        from?: string;
        type: string;
        timestamp?: string;
        text?: { body: string };
        image?: { id: string; mime_type: string; sha256: string; url?: string; caption?: string };
        audio?: { id: string; mime_type: string; sha256: string; voice: boolean };
        video?: { id: string; mime_type: string; sha256: string; url?: string; caption?: string };
        document?: { id: string; mime_type: string; sha256: string; filename: string; url?: string; caption?: string };
        location?: { latitude: number; longitude: number; name?: string; address?: string };
        contacts?: Array<{ profile: { name: string }; phones: string[] }>;
        reaction?: { message_id: string; emoji: string };
        referral?: { source: string; source_id: string; media_url?: string };
        button?: { payload: string };
        context?: { from: string; id: string };
        errors?: Array<{ code: number; title: string; message?: string; error_data?: { details: string } }>;
      };
      field: string;
    }>;
  }>;
}

/**
 * WhatsApp Business API Client
 * Uses Meta WhatsApp Cloud API for sending messages
 */
export class WhatsAppAPI {
  private client: AxiosInstance;
  private config: WhatsAppConfig;

  constructor(config: WhatsAppConfig) {
    this.config = config;

    this.client = axios.create({
      baseURL: config.apiUrl || 'https://graph.facebook.com/v18.0',
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Send a text message
   */
  async sendText(to: string, body: string, options?: { replyTo?: string; typingTime?: number }): Promise<{ messageId: string }> {
    try {
      const payload: any = {
        messaging_product: 'whatsapp',
        to: this.formatPhoneNumber(to),
        type: 'text',
        text: { body },
      };

      if (options?.replyTo) {
        payload.context = { message_id: options.replyTo };
      }

      const response = await this.client.post(`${this.config.phoneNumberId}/messages`, payload);
      const messageId = response.data.messages[0].id;

      // Simulate typing delay if requested
      if (options?.typingTime && options.typingTime > 0) {
        await this.sendTypingIndicator(to, true);
        await new Promise(resolve => setTimeout(resolve, options.typingTime!));
        await this.sendTypingIndicator(to, false);
      }

      logger.info(`WhatsApp text sent to ${to}`, { messageId });
      return { messageId };
    } catch (error) {
      logger.error(`Failed to send WhatsApp text to ${to}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Send media (image, video, audio, document)
   */
  async sendMedia(
    to: string,
    mediaType: 'image' | 'video' | 'audio' | 'document',
    mediaUrl: string,
    options?: { caption?: string; filename?: string; replyTo?: string }
  ): Promise<{ messageId: string }> {
    try {
      const payload: any = {
        messaging_product: 'whatsapp',
        to: this.formatPhoneNumber(to),
        type: mediaType,
        [mediaType]: {
          link: mediaUrl,
          ...(options?.caption && { caption: options.caption }),
          ...(options?.filename && mediaType === 'document' && { filename: options.filename }),
        },
      };

      if (options?.replyTo) {
        payload.context = { message_id: options.replyTo };
      }

      const response = await this.client.post(`${this.config.phoneNumberId}/messages`, payload);
      const messageId = response.data.messages[0].id;

      logger.info(`WhatsApp ${mediaType} sent to ${to}`, { messageId });
      return { messageId };
    } catch (error) {
      logger.error(`Failed to send WhatsApp ${mediaType} to ${to}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Send a button template message
   */
  async sendButtons(to: string, body: string, buttons: Array<{ type: string; text: string; url?: string; phoneNumber?: string }>): Promise<{ messageId: string }> {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: this.formatPhoneNumber(to),
        type: 'interactive',
        interactive: {
          type: 'buttons',
          body: { text: body },
          buttons: buttons.map(btn => ({
            type: btn.type,
            ...(btn.type === 'url' && btn.url && { url: btn.url }),
            ...(btn.type === 'phone_number' && btn.phoneNumber && { phone_number: btn.phoneNumber }),
            ...(btn.type === 'reply' && { reply: { id: `btn_${btn.text.toLowerCase().replace(/\s+/g, '_')}`, title: btn.text } }),
          })),
        },
      };

      const response = await this.client.post(`${this.config.phoneNumberId}/messages`, payload);
      logger.info(`WhatsApp buttons sent to ${to}`, { messageId: response.data.messages[0].id });
      return { messageId: response.data.messages[0].id };
    } catch (error) {
      logger.error(`Failed to send WhatsApp buttons to ${to}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Send a list message
   */
  async sendList(
    to: string,
    header: string,
    body: string,
    footer: string,
    buttonText: string,
    sections: Array<{ title: string; rows: Array<{ id: string; title: string; description?: string }> }>
  ): Promise<{ messageId: string }> {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: this.formatPhoneNumber(to),
        type: 'interactive',
        interactive: {
          type: 'list',
          header: { type: 'text', text: header },
          body: { text: body },
          footer: { text: footer },
          action: {
            button: buttonText,
            sections,
          },
        },
      };

      const response = await this.client.post(`${this.config.phoneNumberId}/messages`, payload);
      logger.info(`WhatsApp list sent to ${to}`, { messageId: response.data.messages[0].id });
      return { messageId: response.data.messages[0].id };
    } catch (error) {
      logger.error(`Failed to send WhatsApp list to ${to}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Send session-specific template via WhatsApp Agent Service
   */
  async sendTemplate(options: SendTemplateOptions): Promise<{ messageId: string }> {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: this.formatPhoneNumber(options.to),
        type: 'template',
        template: {
          name: options.templateName,
          language: { code: 'en' },
          components: [
            ...(Object.keys(options.variables).length > 0 && {
              type: 'body',
              parameters: Object.values(options.variables).map(value => ({
                type: 'text',
                text: value,
              })),
            }),
            ...(options.headerMediaUrl && {
              type: 'header',
              parameters: [
                {
                  type: 'image',
                  image: { link: doc.imageLink },
                },
              ],
            }),
            ...(options.footer && {
              type: 'footer',
              parameters: [{ type: 'text', text: options.footer }],
            }),
            ...(options.buttons && {
              type: 'button',
              ...(options.buttons[0].type === 'url' && {
                index: '0',
              }),
              ...(options.buttons[0].type === 'phone_number' && {
                index: '0',
              }),
            }),
          ],
        },
      };

      const response = await this.client.post(`${this.config.phoneNumberId}/messages`, payload);
      logger.info(`WhatsApp template "${options.templateName}" sent to ${options.to}`, {
        messageId: response.data.messages[0].id,
      });
      return { messageId: response.data.messages[0].id };
    } catch (error) {
      logger.error(`Failed to send WhatsApp template "${options.templateName}" to ${options.to}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.client.post(`${this.config.phoneNumberId}/messages`, {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      });
      logger.info(`WhatsApp message marked as read: ${messageId}`);
    } catch (error) {
      logger.error(`Failed to mark message as read: ${messageId}`, error);
    }
  }

  /**
   * Typing indicator (optional - WhatsApp may not support)
   */
  async sendTypingIndicator(to: string, isTyping: boolean): Promise<void> {
    try {
      // Note: WhatsApp Cloud API doesn't support typing indicators natively
      // This would need to be implemented via Venom/Baileys for local instances
      logger.debug(`Typing indicator ${isTyping ? 'on' : 'off'} for ${to} (not supported in Cloud API)`);
    } catch (error) {
      // Silently fail - not critical
    }
  }

  /**
   * Upload media to WhatsApp and get permanent URL
   */
  async uploadMedia(fileUrl: string, type: 'image' | 'video' | 'audio' | 'document'): Promise<{ mediaId: string; url: string }> {
    try {
      // For Media URL from external sources, we use the URL directly
      // For uploaded files, we need to POST the file first
      const mediaId = `prepared_media_${Date.now()}`;
      return { mediaId, url: fileUrl };
    } catch (error) {
      logger.error('Failed to prepare media:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get message status
   */
  async getMessageStatus(messageId: string): Promise<{ status: string }> {
    try {
      const response = await this.client.get(`${this.config.phoneNumberId}/messages/${messageId}`);
      return { status: response.data.status };
    } catch (error) {
      logger.error(`Failed to get message status for ${messageId}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Verify webhook
   */
  verifyWebhook(mode: string, token: string, challenge: string): boolean {
    return mode === 'subscribe' && token === this.config.webhookVerifyToken;
  }

  /**
   * Parse incoming webhook message
   */
  parseWebhookMessage(payload: WhatsAppWebhookPayload) {
    const messages: Array<{
      from: string;
      type: string;
      body?: string;
      mediaUrl?: string;
      caption?: string;
      location?: { latitude: number; longitude: number };
      context?: { from: string; id: string };
    }> = [];

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;

        if (value.messages) {
          for (const msg of value.messages) {
            const message: any = {
              from: msg.from,
              type: msg.type,
            };

            if (msg.text) message.body = msg.text.body;
            if (msg.image) { message.mediaUrl = msg.image.url; message.caption = msg.image.caption; }
            if (msg.video) { message.mediaUrl = msg.video.url; message.caption = msg.video.caption; }
            if (msg.audio) message.mediaUrl = msg.audio.url;
            if (msg.document) { message.mediaUrl = msg.document.url; message.caption = msg.document.caption; }
            if (msg.location) message.location = { latitude: msg.location.latitude, longitude: msg.location.longitude };
            if (value.context) message.context = value.context;

            messages.push(message);
          }
        }
      }
    }

    return messages;
  }

  /**
   * Format phone number to international format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // Add country code for Indian numbers if not present
    if (cleaned.startsWith('0')) {
      cleaned = '91' + cleaned.substring(1);
    } else if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }

    return cleaned;
  }

  /**
   * Handle errors and return typed errors
   */
  private handleError(error: any): Error {
    if (error.response) {
      const { status, data } = error.response;
      logger.error(`WhatsApp API error: ${status}`, data);

      if (data.error?.code === 100) {
        throw new Error('PARAMETER_CANNOT_BE_EMPTY: Phone number is required');
      } else if (data.error?.code === 131030) {
        throw new Error('PHONE_NUMBER_NOT_IN_ADDRESS_book: Receiver not exists');
      } else if (data.error?.code === 132001) {
        throw new Error('REcipient is not a valid WhatsApp user');
      } else if (data.error?.code === 131026) {
        throw new Error('Template not approved or missing');
      }

      throw new Error(data.error?.message || `WhatsApp API error: ${status}`);
    }

    if (error.code === 'ECONNABORTED') {
      throw new Error('WhatsApp API timeout');
    }

    return error;
  }
}

/**
 * Axios retry interceptor
 */
axios.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config;
    if (!config || config.__retryCount >= 3) {
      return Promise.reject(error);
    }

    config.__retryCount = config.__retryCount || 0;
    config.__retryCount++;

    const delay = Math.pow(2, config.__retryCount) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    return axios(config);
  }
);

export default WhatsAppAPI;
