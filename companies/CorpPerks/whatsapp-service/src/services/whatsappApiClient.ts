import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

export interface TemplateComponent {
  type: string;
  parameters: {
    type: string;
    text?: string;
    image?: { link: string; caption?: string };
    document?: { link: string; caption?: string; filename: string };
  }[];
}

export interface WhatsAppTemplate {
  name: string;
  language: {
    code: string;
  };
  components?: TemplateComponent[];
}

export interface WhatsAppMessagePayload {
  messaging_product: string;
  recipient_type: string;
  to: string;
  type: string;
  text?: {
    preview_url: boolean;
    body: string;
  };
  template?: WhatsAppTemplate;
  interactive?: {
    type: string;
    header?: {
      type: string;
      text?: string;
      image?: { link: string };
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: {
      buttons: {
        type: string;
        reply: {
          title: string;
          id: string;
        };
      }[];
    };
  };
}

export interface WhatsAppApiResponse {
  messaging_product: string;
  contacts: Array<{
    wa_id: string;
    input: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

export class WhatsAppApiClient {
  private client: AxiosInstance;
  private phoneNumberId: string;

  constructor() {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
      logger.warn('WhatsApp API credentials not configured - running in mock mode');
    }

    this.phoneNumberId = phoneNumberId || 'mock-phone-id';
    this.client = axios.create({
      baseURL: 'https://graph.facebook.com/v18.0',
      headers: {
        'Authorization': `Bearer ${accessToken || 'mock-token'}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Send a text message
   */
  async sendTextMessage(
    to: string,
    body: string,
    options?: { previewUrl?: boolean; interactive?: boolean }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const payload: WhatsAppMessagePayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: {
          preview_url: options?.previewUrl ?? false,
          body,
        },
      };

      const response = await this.sendMessage(payload);

      return {
        success: true,
        messageId: response.messages?.[0]?.id,
      };
    } catch (error) {
      logger.error('Failed to send text message:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Send a template message
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = 'en',
    components?: TemplateComponent[]
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const template: WhatsAppTemplate = {
        name: templateName,
        language: {
          code: languageCode,
        },
      };

      if (components) {
        template.components = components;
      }

      const payload: WhatsAppMessagePayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'template',
        template,
      };

      const response = await this.sendMessage(payload);

      return {
        success: true,
        messageId: response.messages?.[0]?.id,
      };
    } catch (error) {
      logger.error('Failed to send template message:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Send an interactive message with buttons
   */
  async sendInteractiveMessage(
    to: string,
    body: string,
    buttons: { id: string; title: string }[],
    header?: { type: 'text'; text: string }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const payload: WhatsAppMessagePayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'interactive',
        interactive: {
          type: 'button',
          header: header ? { type: 'text', text: header.text } : undefined,
          body: { text: body },
          action: {
            buttons: buttons.map((btn) => ({
              type: 'reply',
              reply: {
                title: btn.title,
                id: btn.id,
              },
            })),
          },
        },
      };

      const response = await this.sendMessage(payload);

      return {
        success: true,
        messageId: response.messages?.[0]?.id,
      };
    } catch (error) {
      logger.error('Failed to send interactive message:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Send a media message
   */
  async sendMediaMessage(
    to: string,
    mediaUrl: string,
    mediaType: 'image' | 'document' | 'video' | 'audio',
    caption?: string,
    filename?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const basePayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: mediaType,
      };

      let payload: Record<string, unknown>;

      if (mediaType === 'image') {
        payload = { ...basePayload, image: { link: mediaUrl, caption } };
      } else if (mediaType === 'document') {
        payload = { ...basePayload, document: { link: mediaUrl, caption, filename } };
      } else if (mediaType === 'video') {
        payload = { ...basePayload, video: { link: mediaUrl, caption } };
      } else {
        payload = { ...basePayload, audio: { link: mediaUrl } };
      }

      const response = await this.client.post<WhatsAppApiResponse>(
        `/${this.phoneNumberId}/messages`,
        payload
      );

      return {
        success: true,
        messageId: response.data.messages?.[0]?.id,
      };
    } catch (error) {
      logger.error('Failed to send media message:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get message status from WhatsApp API
   */
  async getMessageStatus(messageId: string): Promise<{
    status: string;
    timestamp: string;
  } | null> {
    try {
      const response = await this.client.get(`/${this.phoneNumberId}/messages/${messageId}`);
      return {
        status: response.data.status,
        timestamp: response.data.timestamp,
      };
    } catch (error) {
      logger.error('Failed to get message status:', error);
      return null;
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<boolean> {
    try {
      await this.client.post('/me/messages', {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      });
      return true;
    } catch (error) {
      logger.error('Failed to mark message as read:', error);
      return false;
    }
  }

  /**
   * Internal method to send message via API
   */
  private async sendMessage(payload: WhatsAppMessagePayload): Promise<WhatsAppApiResponse> {
    // Mock mode if credentials not configured
    if (!process.env.WHATSAPP_ACCESS_TOKEN) {
      logger.info('Mock mode: Would send WhatsApp message', { payload });
      return {
        messaging_product: 'whatsapp',
        contacts: [{ wa_id: payload.to, input: payload.to }],
        messages: [{ id: `mock-${Date.now()}` }],
      };
    }

    const response = await this.client.post<WhatsAppApiResponse>(
      `/${this.phoneNumberId}/messages`,
      payload
    );

    return response.data;
  }
}

export const whatsAppApiClient = new WhatsAppApiClient();
