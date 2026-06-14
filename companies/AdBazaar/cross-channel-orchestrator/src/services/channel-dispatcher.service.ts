import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { logger } from './logger.service';
import { Channel, WhatsAppContent, SMSContent, EmailContent, PushContent } from '../types';
import { redisService } from './redis.service';

interface SendRequest {
  campaignId: string;
  recipients: string[];
  content: WhatsAppContent | SMSContent | EmailContent | PushContent | undefined;
  budget: number;
}

interface SendResponse {
  success: boolean;
  messageId?: string;
  channel: Channel;
  sent: number;
  failed: number;
  cost: number;
  error?: string;
}

interface ChannelClient {
  client: AxiosInstance;
  config: typeof config.channels.whatsapp;
}

/**
 * Channel Dispatcher Service
 * Handles sending messages to different channels (WhatsApp, SMS, Email, Push)
 */
export class ChannelDispatcher {
  private clients: Map<Channel, ChannelClient> = new Map();
  private queue: Map<Channel, SendRequest[]> = new Map();
  private processing: Map<Channel, boolean> = new Map();

  constructor() {
    this.initializeClients();
  }

  /**
   * Initialize channel clients
   */
  private initializeClients(): void {
    // WhatsApp client
    this.clients.set('whatsapp', {
      client: this.createClient('whatsapp'),
      config: config.channels.whatsapp,
    });

    // SMS client
    this.clients.set('sms', {
      client: this.createClient('sms'),
      config: config.channels.sms,
    });

    // Email client
    this.clients.set('email', {
      client: this.createClient('email'),
      config: config.channels.email,
    });

    // Push client
    this.clients.set('push', {
      client: this.createClient('push'),
      config: config.channels.push,
    });

    // Initialize queues
    for (const channel of ['whatsapp', 'sms', 'email', 'push'] as Channel[]) {
      this.queue.set(channel, []);
      this.processing.set(channel, false);
    }
  }

  /**
   * Create Axios client for a channel
   */
  private createClient(channel: Channel): AxiosInstance {
    const channelConfig = config.channels[channel];
    const client = axios.create({
      baseURL: channelConfig.url,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': channelConfig.apiKey || '',
      },
    });

    // Request interceptor
    client.interceptors.request.use(
      async (config) => {
        // Rate limiting check
        const rateLimitKey = `rate:${channel}:${Date.now()}`;
        const { allowed, remaining } = await redisService.checkRateLimit(
          rateLimitKey,
          channelConfig.rateLimit,
          60
        );

        if (!allowed) {
          throw new Error(`Rate limit exceeded for ${channel} channel`);
        }

        logger.debug(`${channel} API request`, { path: config.url, remaining });
        return config;
      },
      (error) => {
        logger.error(`${channel} request error`, error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error(`${channel} response error`, {
          status: error.response?.status,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );

    return client;
  }

  /**
   * Send message through a channel
   */
  async send(channel: Channel, request: SendRequest): Promise<SendResponse> {
    const channelClient = this.clients.get(channel);
    if (!channelClient) {
      return {
        success: false,
        channel,
        sent: 0,
        failed: request.recipients.length,
        cost: 0,
        error: 'Channel not supported',
      };
    }

    const { client, config: channelConfig } = channelClient;

    // Check budget
    const estimatedCost = request.recipients.length * channelConfig.costPerMessage;
    if (estimatedCost > request.budget) {
      return {
        success: false,
        channel,
        sent: 0,
        failed: request.recipients.length,
        cost: 0,
        error: 'Insufficient budget',
      };
    }

    try {
      let response;

      switch (channel) {
        case 'whatsapp':
          response = await this.sendWhatsApp(client, request.recipients, request.content as WhatsAppContent);
          break;
        case 'sms':
          response = await this.sendSMS(client, request.recipients, request.content as SMSContent);
          break;
        case 'email':
          response = await this.sendEmail(client, request.recipients, request.content as EmailContent);
          break;
        case 'push':
          response = await this.sendPush(client, request.recipients, request.content as PushContent);
          break;
      }

      return {
        success: true,
        channel,
        sent: response.sent,
        failed: response.failed,
        cost: response.sent * channelConfig.costPerMessage,
        messageId: response.messageId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to send via ${channel}`, { campaignId: request.campaignId, error: errorMessage });

      return {
        success: false,
        channel,
        sent: 0,
        failed: request.recipients.length,
        cost: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Send WhatsApp message
   */
  private async sendWhatsApp(
    client: AxiosInstance,
    recipients: string[],
    content?: WhatsAppContent
  ): Promise<{ sent: number; failed: number; messageId?: string }> {
    if (!content) {
      return { sent: 0, failed: recipients.length };
    }

    try {
      const response = await client.post('/send', {
        recipients,
        template: content.template,
        variables: content.variables,
        headerType: content.headerType,
        footerText: content.footerText,
        buttons: content.buttons,
      });

      return {
        sent: response.data.success?.length || recipients.length,
        failed: response.data.failed?.length || 0,
        messageId: response.data.messageId,
      };
    } catch (error) {
      logger.error('WhatsApp send error', error);
      return { sent: 0, failed: recipients.length };
    }
  }

  /**
   * Send SMS
   */
  private async sendSMS(
    client: AxiosInstance,
    recipients: string[],
    content?: SMSContent
  ): Promise<{ sent: number; failed: number; messageId?: string }> {
    if (!content) {
      return { sent: 0, failed: recipients.length };
    }

    try {
      const response = await client.post('/send', {
        recipients,
        message: content.message,
        senderId: content.senderId,
      });

      return {
        sent: response.data.success?.length || recipients.length,
        failed: response.data.failed?.length || 0,
        messageId: response.data.messageId,
      };
    } catch (error) {
      logger.error('SMS send error', error);
      return { sent: 0, failed: recipients.length };
    }
  }

  /**
   * Send Email
   */
  private async sendEmail(
    client: AxiosInstance,
    recipients: string[],
    content?: EmailContent
  ): Promise<{ sent: number; failed: number; messageId?: string }> {
    if (!content) {
      return { sent: 0, failed: recipients.length };
    }

    try {
      const response = await client.post('/send', {
        recipients,
        subject: content.subject,
        body: content.body,
        template: content.template,
        fromName: content.fromName,
        replyTo: content.replyTo,
        attachments: content.attachments,
      });

      return {
        sent: response.data.success?.length || recipients.length,
        failed: response.data.failed?.length || 0,
        messageId: response.data.messageId,
      };
    } catch (error) {
      logger.error('Email send error', error);
      return { sent: 0, failed: recipients.length };
    }
  }

  /**
   * Send Push notification
   */
  private async sendPush(
    client: AxiosInstance,
    recipients: string[],
    content?: PushContent
  ): Promise<{ sent: number; failed: number; messageId?: string }> {
    if (!content) {
      return { sent: 0, failed: recipients.length };
    }

    try {
      const response = await client.post('/send', {
        recipients,
        title: content.title,
        body: content.body,
        image: content.image,
        icon: content.icon,
        clickAction: content.clickAction,
        badge: content.badge,
        sound: content.sound,
        priority: content.priority,
        data: content.data,
      });

      return {
        sent: response.data.success?.length || recipients.length,
        failed: response.data.failed?.length || 0,
        messageId: response.data.messageId,
      };
    } catch (error) {
      logger.error('Push send error', error);
      return { sent: 0, failed: recipients.length };
    }
  }

  /**
   * Queue message for later processing
   */
  queueMessage(channel: Channel, request: SendRequest): void {
    const queue = this.queue.get(channel) || [];
    queue.push(request);
    this.queue.set(channel, queue);

    // Process queue if not already processing
    if (!this.processing.get(channel)) {
      this.processQueue(channel);
    }
  }

  /**
   * Process queue for a channel
   */
  private async processQueue(channel: Channel): Promise<void> {
    this.processing.set(channel, true);

    while (true) {
      const queue = this.queue.get(channel) || [];
      if (queue.length === 0) {
        this.processing.set(channel, false);
        break;
      }

      const request = queue.shift()!;
      await this.send(channel, request);

      // Small delay between messages to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Get queue status for a channel
   */
  getQueueStatus(channel: Channel): { queued: number; processing: boolean } {
    return {
      queued: this.queue.get(channel)?.length || 0,
      processing: this.processing.get(channel) || false,
    };
  }

  /**
   * Get channel health status
   */
  async getChannelHealth(channel: Channel): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    const channelClient = this.clients.get(channel);
    if (!channelClient) {
      return { healthy: false, error: 'Channel not configured' };
    }

    try {
      const start = Date.now();
      await channelClient.client.get('/health', { timeout: 5000 });
      return { healthy: true, latency: Date.now() - start };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all channels health
   */
  async getAllChannelsHealth(): Promise<Record<Channel, { healthy: boolean; latency?: number; error?: string }>> {
    const channels: Channel[] = ['whatsapp', 'sms', 'email', 'push'];
    const health: Record<Channel, { healthy: boolean; latency?: number; error?: string }> = {} as Record<
      Channel,
      { healthy: boolean; latency?: number; error?: string }
    >;

    for (const channel of channels) {
      health[channel] = await this.getChannelHealth(channel);
    }

    return health;
  }
}

export const channelDispatcher = new ChannelDispatcher();
export default channelDispatcher;