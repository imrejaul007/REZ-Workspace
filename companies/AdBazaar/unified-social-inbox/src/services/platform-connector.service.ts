import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { Platform, PlatformUser } from '../types';
import { createModuleLogger } from 'utils/logger.js';

const logger = createModuleLogger('PlatformConnector');

interface SendMessageResult {
  platformMessageId: string;
  success: boolean;
  error?: string;
}

interface WebhookData {
  platform: Platform;
  event: string;
  data: Record<string, unknown>;
}

export class PlatformConnectorService {
  private instagramClient: AxiosInstance | null = null;
  private twitterClient: AxiosInstance | null = null;
  private linkedinClient: AxiosInstance | null = null;
  private whatsappClient: AxiosInstance | null = null;
  private facebookClient: AxiosInstance | null = null;

  constructor() {
    this.initializeClients();
  }

  private initializeClients(): void {
    // Instagram client
    if (config.instagram.accessToken) {
      this.instagramClient = axios.create({
        baseURL: config.instagram.apiUrl,
        timeout: 10000,
      });
    }

    // Twitter client
    if (config.twitter.bearerToken) {
      this.twitterClient = axios.create({
        baseURL: config.twitter.apiUrl,
        timeout: 10000,
        headers: {
          Authorization: `Bearer ${config.twitter.bearerToken}`,
        },
      });
    }

    // LinkedIn client
    if (config.linkedin.accessToken) {
      this.linkedinClient = axios.create({
        baseURL: config.linkedin.apiUrl,
        timeout: 10000,
        headers: {
          Authorization: `Bearer ${config.linkedin.accessToken}`,
        },
      });
    }

    // WhatsApp/Facebook client
    if (config.whatsapp.phoneNumberId && config.facebook.accessToken) {
      this.whatsappClient = axios.create({
        baseURL: config.whatsapp.apiUrl,
        timeout: 10000,
      });
    }

    // Facebook client
    if (config.facebook.accessToken) {
      this.facebookClient = axios.create({
        baseURL: config.facebook.apiUrl,
        timeout: 10000,
      });
    }
  }

  /**
   * Send message via platform
   */
  async sendMessage(data: {
    platform: Platform;
    platformConversationId: string;
    content: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video' | 'audio';
    recipientId: string;
  }): Promise<string> {
    try {
      switch (data.platform) {
        case 'instagram':
          return this.sendInstagramMessage(data);
        case 'twitter':
          return this.sendTwitterMessage(data);
        case 'linkedin':
          return this.sendLinkedInMessage(data);
        case 'whatsapp':
          return this.sendWhatsAppMessage(data);
        case 'facebook':
          return this.sendFacebookMessage(data);
        default:
          throw new Error(`Unsupported platform: ${data.platform}`);
      }
    } catch (error) {
      logger.error('Failed to send message via platform', { error, platform: data.platform });
      throw error;
    }
  }

  /**
   * Send Instagram Direct Message
   */
  private async sendInstagramMessage(data: {
    platformConversationId: string;
    content: string;
    mediaUrl?: string;
    recipientId: string;
  }): Promise<string> {
    if (!this.instagramClient || !config.instagram.accessToken) {
      throw new Error('Instagram not configured');
    }

    try {
      const payload: Record<string, unknown> = {
        recipient: { id: data.recipientId },
        message: { text: data.content },
      };

      // Handle media messages
      if (data.mediaUrl) {
        const mediaResponse = await this.instagramClient.post(
          `${config.instagram.accessToken}/messages`,
          {
            recipient: { id: data.recipientId },
            message: {
              attachment: {
                type: data.mediaType || 'image',
                payload: { url: data.mediaUrl },
              },
            },
          },
          {
            params: { access_token: config.instagram.accessToken },
          }
        );
        return mediaResponse.data.message_id;
      }

      const response = await this.instagramClient.post(
        `${config.instagram.accessToken}/messages`,
        payload,
        {
          params: { access_token: config.instagram.accessToken },
        }
      );

      return response.data.message_id;
    } catch (error) {
      logger.error('Failed to send Instagram message', { error, data });
      throw error;
    }
  }

  /**
   * Send Twitter/X Direct Message
   */
  private async sendTwitterMessage(data: {
    platformConversationId: string;
    content: string;
    mediaUrl?: string;
    recipientId: string;
  }): Promise<string> {
    if (!this.twitterClient) {
      throw new Error('Twitter not configured');
    }

    try {
      const response = await this.twitterClient.post(
        '/direct_messages/events/new',
        {
          event: {
            type: 'message_create',
            message_create: {
              target: { recipient_id: data.recipientId },
              message_data: {
                text: data.content,
                ...(data.mediaUrl && {
                  attachment: {
                    type: 'media',
                    media: { id: data.mediaUrl },
                  },
                }),
              },
            },
          },
        }
      );

      return response.data.event.id;
    } catch (error) {
      logger.error('Failed to send Twitter message', { error, data });
      throw error;
    }
  }

  /**
   * Send LinkedIn Direct Message
   */
  private async sendLinkedInMessage(data: {
    platformConversationId: string;
    content: string;
    mediaUrl?: string;
    recipientId: string;
  }): Promise<string> {
    if (!this.linkedinClient) {
      throw new Error('LinkedIn not configured');
    }

    try {
      const response = await this.linkedinClient.post(
        '/messages',
        {
          recipients: [data.recipientId],
          subject: '',
          body: data.content,
        }
      );

      return response.data.id;
    } catch (error) {
      logger.error('Failed to send LinkedIn message', { error, data });
      throw error;
    }
  }

  /**
   * Send WhatsApp Message
   */
  private async sendWhatsAppMessage(data: {
    platformConversationId: string;
    content: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video' | 'audio';
    recipientId: string;
  }): Promise<string> {
    if (!this.whatsappClient || !config.whatsapp.phoneNumberId || !config.facebook.accessToken) {
      throw new Error('WhatsApp not configured');
    }

    try {
      const payload: Record<string, unknown> = {
        messaging_product: 'whatsapp',
        to: data.recipientId,
        type: data.mediaUrl ? data.mediaType || 'image' : 'text',
      };

      if (data.mediaUrl) {
        payload[typeof data.mediaType === 'string' ? data.mediaType : 'image'] = {
          link: data.mediaUrl,
          caption: data.content,
        };
      } else {
        payload.text = { body: data.content };
      }

      const response = await this.whatsappClient.post(
        `/${config.whatsapp.phoneNumberId}/messages`,
        payload,
        {
          params: { access_token: config.facebook.accessToken },
        }
      );

      return response.data.messages[0].id;
    } catch (error) {
      logger.error('Failed to send WhatsApp message', { error, data });
      throw error;
    }
  }

  /**
   * Send Facebook Page Message
   */
  private async sendFacebookMessage(data: {
    platformConversationId: string;
    content: string;
    mediaUrl?: string;
    recipientId: string;
  }): Promise<string> {
    if (!this.facebookClient || !config.facebook.accessToken) {
      throw new Error('Facebook not configured');
    }

    try {
      const payload: Record<string, unknown> = {
        recipient: { id: data.recipientId },
        message: { text: data.content },
      };

      const response = await this.facebookClient.post(
        '/me/messages',
        payload,
        {
          params: { access_token: config.facebook.accessToken },
        }
      );

      return response.data.message_id;
    } catch (error) {
      logger.error('Failed to send Facebook message', { error, data });
      throw error;
    }
  }

  /**
   * Verify webhook token
   */
  verifyWebhook(platform: Platform, token: string): boolean {
    switch (platform) {
      case 'whatsapp':
        return token === config.whatsapp.webhookVerifyToken;
      case 'instagram':
        return token === config.instagram.appSecret;
      default:
        return false;
    }
  }

  /**
   * Parse webhook payload
   */
  parseWebhook(platform: Platform, body: unknown): WebhookData | null {
    try {
      switch (platform) {
        case 'whatsapp':
          return this.parseWhatsAppWebhook(body);
        case 'instagram':
          return this.parseInstagramWebhook(body);
        case 'facebook':
          return this.parseFacebookWebhook(body);
        default:
          logger.warn('Webhook parsing not implemented for platform', { platform });
          return null;
      }
    } catch (error) {
      logger.error('Failed to parse webhook', { error, platform });
      return null;
    }
  }

  private parseWhatsAppWebhook(body: unknown): WebhookData | null {
    const data = body as Record<string, unknown>;
    const entry = (data.entry as unknown[])?.[0] as Record<string, unknown>;
    const changes = (entry?.changes as unknown[]) as Array<Record<string, unknown>>;
    const change = changes?.[0];
    const value = change?.value as Record<string, unknown>;
    const messages = value?.messages as Array<Record<string, unknown>>;

    if (!messages?.length) return null;

    const message = messages[0];
    return {
      platform: 'whatsapp',
      event: 'message',
      data: {
        messageId: message.id,
        from: message.from,
        type: message.type,
        text: (message as Record<string, unknown>).text,
        timestamp: message.timestamp,
      },
    };
  }

  private parseInstagramWebhook(body: unknown): WebhookData | null {
    const data = body as Record<string, unknown>;
    const entry = (data.entry as unknown[]) as Array<Record<string, unknown>>;
    const instagramEntry = entry?.[0];
    const messaging = instagramEntry?.messaging as Array<Record<string, unknown>>;
    const message = messaging?.[0];

    if (!message) return null;

    return {
      platform: 'instagram',
      event: 'message',
      data: {
        senderId: (message.sender as Record<string, unknown>)?.id,
        recipientId: (message.recipient as Record<string, unknown>)?.id,
        messageId: (message.message as Record<string, unknown>)?.mid,
        text: (message.message as Record<string, unknown>)?.text,
        timestamp: message.timestamp,
      },
    };
  }

  private parseFacebookWebhook(body: unknown): WebhookData | null {
    const data = body as Record<string, unknown>;
    const entry = (data.entry as unknown[]) as Array<Record<string, unknown>>;
    const fbEntry = entry?.[0];
    const messaging = fbEntry?.messaging as Array<Record<string, unknown>>;
    const message = messaging?.[0];

    if (!message) return null;

    return {
      platform: 'facebook',
      event: 'message',
      data: {
        senderId: (message.sender as Record<string, unknown>)?.id,
        recipientId: (message.recipient as Record<string, unknown>)?.id,
        messageId: (message.message as Record<string, unknown>)?.mid,
        text: (message.message as Record<string, unknown>)?.text,
        timestamp: message.timestamp,
      },
    };
  }

  /**
   * Get user profile from platform
   */
  async getUserProfile(platform: Platform, userId: string): Promise<PlatformUser | null> {
    try {
      switch (platform) {
        case 'instagram':
          return this.getInstagramProfile(userId);
        case 'twitter':
          return this.getTwitterProfile(userId);
        case 'linkedin':
          return this.getLinkedInProfile(userId);
        case 'facebook':
          return this.getFacebookProfile(userId);
        default:
          return null;
      }
    } catch (error) {
      logger.error('Failed to get user profile', { error, platform, userId });
      return null;
    }
  }

  private async getInstagramProfile(userId: string): Promise<PlatformUser | null> {
    if (!this.instagramClient || !config.instagram.accessToken) return null;

    try {
      const response = await this.instagramClient.get(`/${userId}`, {
        params: { access_token: config.instagram.accessToken },
      });

      return {
        platformUserId: response.data.id,
        username: response.data.username,
        displayName: response.data.name || response.data.username,
        profileImage: response.data.profile_picture_url,
        followerCount: response.data.followers_count,
      };
    } catch {
      return null;
    }
  }

  private async getTwitterProfile(userId: string): Promise<PlatformUser | null> {
    if (!this.twitterClient) return null;

    try {
      const response = await this.twitterClient.get(`/users/${userId}`, {
        params: { 'user.fields': 'profile_image_url,public_metrics' },
      });

      const user = response.data.data;
      return {
        platformUserId: user.id,
        username: user.username,
        displayName: user.name,
        profileImage: user.profile_image_url,
        followerCount: user.public_metrics?.followers_count,
      };
    } catch {
      return null;
    }
  }

  private async getLinkedInProfile(userId: string): Promise<PlatformUser | null> {
    if (!this.linkedinClient) return null;

    try {
      const response = await this.linkedinClient.get(`/people/${userId}`, {
        params: { projection: '(id,localizedFirstName,localizedLastName,profilePicture)' },
      });

      return {
        platformUserId: response.data.id,
        username: response.data.id,
        displayName: `${response.data.localizedFirstName} ${response.data.localizedLastName}`,
        profileImage: response.data.profilePicture?.displayImage,
      };
    } catch {
      return null;
    }
  }

  private async getFacebookProfile(userId: string): Promise<PlatformUser | null> {
    if (!this.facebookClient || !config.facebook.accessToken) return null;

    try {
      const response = await this.facebookClient.get(`/${userId}`, {
        params: {
          access_token: config.facebook.accessToken,
          fields: 'name,picture,followers_count',
        },
      });

      return {
        platformUserId: response.data.id,
        username: response.data.id,
        displayName: response.data.name,
        profileImage: response.data.picture?.data?.url,
        followerCount: response.data.followers_count,
      };
    } catch {
      return null;
    }
  }
}
