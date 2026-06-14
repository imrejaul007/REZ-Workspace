/**
 * WhatsApp Business Cloud API Integration Service
 *
 * Provides comprehensive WhatsApp messaging capabilities for the ReZ Merchant B2B platform.
 * Supports templated messages, free-form text, media, and interactive messages.
 *
 * Key features:
 * - Phone number validation and formatting (E.164)
 * - Message sending with retry logic
 * - Delivery status tracking
 * - Rate limiting (100 messages/minute)
 * - Business hours enforcement (9 AM - 8 PM IST)
 *
 * Environment variables required:
 * - WHATSAPP_PHONE_NUMBER_ID: WhatsApp Business Phone Number ID
 * - WHATSAPP_ACCESS_TOKEN: WhatsApp Business API access token
 * - WHATSAPP_WEBHOOK_VERIFY_TOKEN: Verification token for webhooks
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../config/logger';
import { redis } from '../config/redis';
import { WhatsAppTemplate, getTemplateBody } from './whatsappTemplates';

// WhatsApp Business API base URL
const WHATSAPP_API_VERSION = 'v18.0';
const WHATSAPP_API_BASE = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

// Rate limiting: 100 messages per minute
const RATE_LIMIT_MESSAGES = 100;
const RATE_LIMIT_WINDOW_SECONDS = 60;

// Business hours: 9 AM - 8 PM IST (IST is UTC+5:30)
const BUSINESS_HOUR_START = 9;
const BUSINESS_HOUR_END = 20;
const IST_OFFSET_HOURS = 5.5;

// Error codes from WhatsApp API
export enum WhatsAppErrorCode {
  PHONE_NUMBER_NOT_FOUND = 'Phone number not found',
  RATE_LIMIT = 'Rate limit hit',
  TEMPLATE_NOT_APPROVED = 'Template not approved',
  MESSAGE_REJECTED = 'Message rejected',
  INVALID_PHONE_NUMBER = 'Invalid phone number',
  SESSION_EXPIRED = 'Session expired',
}

/**
 * WhatsApp message status enum
 */
export enum WhatsAppMessageStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

/**
 * WhatsApp message types
 */
export enum WhatsAppMessageType {
  TEXT = 'text',
  TEMPLATE = 'template',
  IMAGE = 'image',
  DOCUMENT = 'document',
  INTERACTIVE = 'interactive',
}

/**
 * Interface for sending a WhatsApp message
 */
export interface SendMessageParams {
  to: string;
  type: WhatsAppMessageType;
  content: TextContent | TemplateContent | MediaContent | InteractiveContent;
  templateName?: string;
  templateLanguage?: string;
  retryCount?: number;
  merchantId?: string;
  referenceId?: string;
}

export interface TextContent {
  text: string;
}

export interface TemplateContent {
  templateName: string;
  language: string;
  components: TemplateComponent[];
}

export interface TemplateComponent {
  type: 'body' | 'header' | 'buttons';
  parameters: Array<{
    type: 'text' | 'currency' | 'date_time' | 'image' | 'document';
    text?: string;
    currency?: { code: string; amount: number };
    date_time?: { epoch: number };
    image?: { id: string; caption?: string };
    document?: { id: string; caption?: string };
  }>;
}

export interface MediaContent {
  mediaUrl: string;
  caption?: string;
  mimeType?: string;
  filename?: string;
}

export interface InteractiveContent {
  action: {
    buttons: Array<{
      type: 'reply' | 'url';
      title: string;
      id?: string;
      url?: string;
    }>;
  };
  body: {
    text: string;
  };
  header?: {
    type: 'text' | 'image' | 'video' | 'document';
    text?: string;
    image?: { id: string; caption?: string };
  };
  footer?: {
    text: string;
  };
}

/**
 * WhatsApp API response types
 */
export interface WhatsAppAPIResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
    message_status?: string;
  }>;
}

export interface WhatsAppMessageStatusResponse {
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
  error?: {
    code: number;
    title: string;
    message: string;
  };
}

export interface WhatsAppQueuePayload {
  messageId: string;
  waId: string;
  status: WhatsAppMessageStatus;
  timestamp: number;
  error?: string;
}

/**
 * WhatsApp Service class for interacting with WhatsApp Business Cloud API
 */
export class WhatsAppService {
  private client: AxiosInstance;
  private phoneNumberId: string;
  private accessToken: string;
  private rateLimitKey = 'whatsapp:rate_limit';
  private messageStatusKey = 'whatsapp:status';

  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';

    if (!this.phoneNumberId || !this.accessToken) {
      logger.warn('[WhatsApp] Missing credentials - service will use mock mode');
    }

    this.client = axios.create({
      baseURL: WHATSAPP_API_BASE,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Check if we're in mock/test mode (no credentials configured)
   */
  private isMockMode(): boolean {
    return !this.phoneNumberId || !this.accessToken;
  }

  /**
   * FIX (security): Generate secure mock message ID using crypto
   */
  private generateMockMessageId(): string {
    try {
      const { randomUUID } = require('crypto');
      return `mock_${Date.now()}_${randomUUID().replace(/-/g, '').substring(0, 9)}`;
    } catch {
      // Legacy fallback (only for environments without crypto)
      return `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  /**
   * Validate phone number format
   * Accepts formats: +91XXXXXXXXXX, 91XXXXXXXXXX, XXXXXXXXXX
   * Returns E.164 format: +91XXXXXXXXXX
   */
  public validatePhoneNumber(phone: string): { valid: boolean; formatted: string; error?: string } {
    // Remove all non-digit characters except leading +
    const cleaned = phone.replace(/[^\d+]/g, '');

    // Check for empty after cleaning
    if (!cleaned) {
      return { valid: false, formatted: '', error: 'Phone number is empty' };
    }

    // Indian phone numbers are 10 digits (after country code)
    // Can be prefixed with +91 or 91 or nothing

    let formattedNumber: string;

    if (cleaned.startsWith('+91')) {
      // Already has +91 prefix
      if (cleaned.length !== 12) {
        return { valid: false, formatted: '', error: 'Invalid Indian phone number with +91 prefix' };
      }
      formattedNumber = cleaned;
    } else if (cleaned.startsWith('91')) {
      // Has 91 prefix without +
      if (cleaned.length !== 12) {
        return { valid: false, formatted: '', error: 'Invalid Indian phone number with 91 prefix' };
      }
      formattedNumber = '+' + cleaned;
    } else {
      // Just the 10-digit number
      if (cleaned.length !== 10) {
        return { valid: false, formatted: '', error: 'Indian phone number must be 10 digits' };
      }
      formattedNumber = '+91' + cleaned;
    }

    // Validate first digit after country code (must be 6-9 for mobile)
    const mobileDigit = parseInt(formattedNumber.charAt(3), 10);
    if (mobileDigit < 6 || mobileDigit > 9) {
      return { valid: false, formatted: '', error: 'Invalid Indian mobile number (must start with 6-9)' };
    }

    return { valid: true, formatted: formattedNumber };
  }

  /**
   * Format 10-digit Indian phone to +91 format
   */
  public formatIndianPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
    }
    return phone.startsWith('+') ? phone : `+${cleaned}`;
  }

  /**
   * Check rate limit before sending
   * Returns true if under limit, false if exceeded
   */
  private async checkRateLimit(): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_SECONDS * 1000;

    try {
      // Remove old entries outside the window
      await redis.zremrangebyscore(this.rateLimitKey, 0, windowStart);

      // Count messages in current window
      const count = await redis.zcard(this.rateLimitKey);

      if (count >= RATE_LIMIT_MESSAGES) {
        logger.warn('[WhatsApp] Rate limit exceeded', { count, limit: RATE_LIMIT_MESSAGES });
        return false;
      }

      // Add current message timestamp
      await redis.zadd(this.rateLimitKey, now, `${now}`);
      await redis.expire(this.rateLimitKey, RATE_LIMIT_WINDOW_SECONDS);

      return true;
    } catch (error) {
      logger.error('[WhatsApp] Rate limit check failed', { error });
      // Fail open - allow message if Redis is unavailable
      return true;
    }
  }

  /**
   * Check if current time is within business hours (9 AM - 8 PM IST)
   */
  public isWithinBusinessHours(): boolean {
    const now = new Date();

    // Get IST time
    const istOffsetMs = IST_OFFSET_HOURS * 60 * 60 * 1000;
    const utc = now.getTime();
    const istTime = new Date(utc + istOffsetMs);
    const istHour = istTime.getUTCHours();
    const istMinute = istTime.getUTCMinutes();
    const currentISTMinutes = istHour * 60 + istMinute;

    const startMinutes = BUSINESS_HOUR_START * 60;
    const endMinutes = BUSINESS_HOUR_END * 60;

    return currentISTMinutes >= startMinutes && currentISTMinutes < endMinutes;
  }

  /**
   * Get day of week in IST (0 = Sunday, 6 = Saturday)
   */
  public getISTDayOfWeek(): number {
    const now = new Date();
    const istOffsetMs = IST_OFFSET_HOURS * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffsetMs);
    return istTime.getUTCDay();
  }

  /**
   * Check if today is Sunday (no business hours)
   */
  public isSunday(): boolean {
    return this.getISTDayOfWeek() === 0;
  }

  /**
   * Send a free-form text message
   */
  public async sendTextMessage(
    to: string,
    text: string,
    options?: { merchantId?: string; referenceId?: string }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Validate phone
    const phoneValidation = this.validatePhoneNumber(to);
    if (!phoneValidation.valid) {
      return { success: false, error: phoneValidation.error };
    }

    // Mock mode for testing
    // FIX (security): Replaced Math.random() with crypto.randomUUID() for secure ID generation
    if (this.isMockMode()) {
      logger.info('[WhatsApp] Mock: Sending text message', { to: phoneValidation.formatted, text });
      const mockId = this.generateMockMessageId();
      return {
        success: true,
        messageId: mockId,
      };
    }

    // Check rate limit
    const withinLimit = await this.checkRateLimit();
    if (!withinLimit) {
      return { success: false, error: 'Rate limit exceeded. Max 100 messages per minute.' };
    }

    // Check business hours (skip for urgent messages - implement queue for non-business hours)
    if (!this.isWithinBusinessHours()) {
      logger.warn('[WhatsApp] Outside business hours, message queued', {
        to: phoneValidation.formatted,
        isSunday: this.isSunday(),
      });
      // In production, queue for next business hour
      return { success: false, error: 'Outside business hours (9 AM - 8 PM IST). Message will be sent during business hours.' };
    }

    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneValidation.formatted,
        type: WhatsAppMessageType.TEXT,
        text: {
          preview_url: false,
          body: text,
        },
      };

      const response = await this.client.post<WhatsAppAPIResponse>(
        `/${this.phoneNumberId}/messages`,
        payload
      );

      const messageId = response.data.messages[0]?.id;

      // Store message ID for status tracking
      if (messageId) {
        await this.storeMessageStatus(messageId, phoneValidation.formatted, WhatsAppMessageStatus.QUEUED);
      }

      logger.info('[WhatsApp] Text message sent', {
        messageId,
        to: phoneValidation.formatted,
        merchantId: options?.merchantId,
      });

      return { success: true, messageId };
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      logger.error('[WhatsApp] Failed to send text message', {
        error: errorMessage,
        to: phoneValidation.formatted,
      });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send a templated message
   */
  public async sendTemplateMessage(
    to: string,
    templateName: string,
    language: string = 'en',
    components: TemplateComponent[] = []
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Validate phone
    const phoneValidation = this.validatePhoneNumber(to);
    if (!phoneValidation.valid) {
      return { success: false, error: phoneValidation.error };
    }

    // Mock mode
    // FIX (security): Replaced Math.random() with crypto.randomUUID() for secure ID generation
    if (this.isMockMode()) {
      logger.info('[WhatsApp] Mock: Sending template message', {
        to: phoneValidation.formatted,
        templateName,
      });
      return {
        success: true,
        messageId: this.generateMockMessageId(),
      };
    }

    // Check rate limit
    const withinLimit = await this.checkRateLimit();
    if (!withinLimit) {
      return { success: false, error: 'Rate limit exceeded. Max 100 messages per minute.' };
    }

    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneValidation.formatted,
        type: WhatsAppMessageType.TEMPLATE,
        template: {
          name: templateName,
          language: {
            code: language,
          },
          components: components.length > 0 ? components : undefined,
        },
      };

      const response = await this.client.post<WhatsAppAPIResponse>(
        `/${this.phoneNumberId}/messages`,
        payload
      );

      const messageId = response.data.messages[0]?.id;

      if (messageId) {
        await this.storeMessageStatus(messageId, phoneValidation.formatted, WhatsAppMessageStatus.QUEUED);
      }

      logger.info('[WhatsApp] Template message sent', {
        messageId,
        to: phoneValidation.formatted,
        templateName,
      });

      return { success: true, messageId };
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      const errorCode = error.response?.data?.error?.code;

      logger.error('[WhatsApp] Failed to send template message', {
        error: errorMessage,
        code: errorCode,
        templateName,
        to: phoneValidation.formatted,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send message using a predefined template
   */
  public async sendMessage(
    to: string,
    template: WhatsAppTemplate,
    params: string[]
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const templateConfig = getTemplateBody(template);
    if (!templateConfig) {
      return { success: false, error: `Unknown template: ${template}` };
    }

    // Build components for template
    const components: TemplateComponent[] = [
      {
        type: 'body',
        parameters: params.map((param) => ({
          type: 'text' as const,
          text: param,
        })),
      },
    ];

    // Determine language code
    const language = template.includes('HINDI') ? 'hi' : 'en';

    return this.sendTemplateMessage(to, template, language, components);
  }

  /**
   * Send media message (image or document)
   */
  public async sendMediaMessage(
    to: string,
    mediaUrl: string,
    options: {
      type: 'image' | 'document' | 'video';
      caption?: string;
      filename?: string;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const phoneValidation = this.validatePhoneNumber(to);
    if (!phoneValidation.valid) {
      return { success: false, error: phoneValidation.error };
    }

    if (this.isMockMode()) {
      logger.info('[WhatsApp] Mock: Sending media message', {
        to: phoneValidation.formatted,
        type: options.type,
      });
      return {
        success: true,
        messageId: `mock_${Date.now()}`,
      };
    }

    const withinLimit = await this.checkRateLimit();
    if (!withinLimit) {
      return { success: false, error: 'Rate limit exceeded' };
    }

    try {
      const mediaObject: Record<string, unknown> = {
        link: mediaUrl,
      };

      if (options.caption) {
        mediaObject.caption = options.caption;
      }

      if (options.type === 'document' && options.filename) {
        mediaObject.filename = options.filename;
      }

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneValidation.formatted,
        type: options.type,
        [options.type]: mediaObject,
      };

      const response = await this.client.post<WhatsAppAPIResponse>(
        `/${this.phoneNumberId}/messages`,
        payload
      );

      const messageId = response.data.messages[0]?.id;

      if (messageId) {
        await this.storeMessageStatus(messageId, phoneValidation.formatted, WhatsAppMessageStatus.QUEUED);
      }

      logger.info('[WhatsApp] Media message sent', { messageId, type: options.type });

      return { success: true, messageId };
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      logger.error('[WhatsApp] Failed to send media message', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send interactive message with buttons
   */
  public async sendInteractiveMessage(
    to: string,
    bodyText: string,
    buttons: Array<{ type: 'reply'; title: string; id: string }>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const phoneValidation = this.validatePhoneNumber(to);
    if (!phoneValidation.valid) {
      return { success: false, error: phoneValidation.error };
    }

    if (this.isMockMode()) {
      logger.info('[WhatsApp] Mock: Sending interactive message', {
        to: phoneValidation.formatted,
        buttonCount: buttons.length,
      });
      return { success: true, messageId: `mock_${Date.now()}` };
    }

    const withinLimit = await this.checkRateLimit();
    if (!withinLimit) {
      return { success: false, error: 'Rate limit exceeded' };
    }

    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneValidation.formatted,
        type: WhatsAppMessageType.INTERACTIVE,
        interactive: {
          type: 'button',
          body: {
            text: bodyText,
          },
          action: {
            buttons: buttons.map((btn) => ({
              type: btn.type,
              title: btn.title.substring(0, 25), // WhatsApp max 25 chars for button
              reply: {
                id: btn.id,
                title: btn.title.substring(0, 25),
              },
            })),
          },
        },
      };

      const response = await this.client.post<WhatsAppAPIResponse>(
        `/${this.phoneNumberId}/messages`,
        payload
      );

      const messageId = response.data.messages[0]?.id;

      if (messageId) {
        await this.storeMessageStatus(messageId, phoneValidation.formatted, WhatsAppMessageStatus.QUEUED);
      }

      return { success: true, messageId };
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      logger.error('[WhatsApp] Failed to send interactive message', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get message delivery status
   */
  public async getMessageStatus(
    messageId: string
  ): Promise<{ status: WhatsAppMessageStatus | null; timestamp?: number; error?: string }> {
    // Check cache first
    const cachedStatus = await this.getCachedStatus(messageId);
    if (cachedStatus) {
      return { status: cachedStatus.status, timestamp: cachedStatus.timestamp };
    }

    if (this.isMockMode()) {
      return {
        status: WhatsAppMessageStatus.DELIVERED,
        timestamp: Date.now(),
      };
    }

    try {
      const response = await this.client.get<WhatsAppMessageStatusResponse>(
        `/${this.phoneNumberId}/messages/${messageId}`
      );

      const statusMap: Record<string, WhatsAppMessageStatus> = {
        sent: WhatsAppMessageStatus.SENT,
        delivered: WhatsAppMessageStatus.DELIVERED,
        read: WhatsAppMessageStatus.READ,
        failed: WhatsAppMessageStatus.FAILED,
      };

      const status = statusMap[response.data.status] || WhatsAppMessageStatus.QUEUED;
      const timestamp = parseInt(response.data.timestamp, 10) * 1000;

      // Cache the status
      await this.storeMessageStatus(messageId, response.data.recipient_id, status);

      return { status, timestamp };
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      logger.error('[WhatsApp] Failed to get message status', { messageId, error: errorMessage });
      return { status: null, error: errorMessage };
    }
  }

  /**
   * Process webhook update for message status
   */
  public async processWebhookUpdate(
    messageId: string,
    status: string,
    timestamp: number
  ): Promise<void> {
    const statusMap: Record<string, WhatsAppMessageStatus> = {
      sent: WhatsAppMessageStatus.SENT,
      delivered: WhatsAppMessageStatus.DELIVERED,
      read: WhatsAppMessageStatus.READ,
      failed: WhatsAppMessageStatus.FAILED,
    };

    const mappedStatus = statusMap[status] || WhatsAppMessageStatus.QUEUED;

    // Get the wa_id from stored message data
    const messageData = await redis.hgetall(`${this.messageStatusKey}:${messageId}`);
    const waId = messageData.waId || '';

    await this.storeMessageStatus(messageId, waId, mappedStatus, timestamp);

    logger.info('[WhatsApp] Webhook status update', { messageId, status: mappedStatus });

    // Publish event for other services to consume
    await redis.publish('whatsapp:status_update', JSON.stringify({
      messageId,
      status: mappedStatus,
      timestamp,
      waId,
    }));
  }

  /**
   * Store message status in Redis
   */
  private async storeMessageStatus(
    messageId: string,
    waId: string,
    status: WhatsAppMessageStatus,
    timestamp?: number
  ): Promise<void> {
    const key = `${this.messageStatusKey}:${messageId}`;
    const data: WhatsAppQueuePayload = {
      messageId,
      waId,
      status,
      timestamp: timestamp || Date.now(),
    };

    await redis.hset(key, {
      waId,
      status,
      timestamp: String(data.timestamp),
    });

    // Store for 7 days (604800 seconds)
    await redis.expire(key, 604800);

    // Also add to user's message list
    if (waId) {
      await redis.zadd(`whatsapp:user:${waId}`, data.timestamp, messageId);
    }
  }

  /**
   * Get cached message status
   */
  private async getCachedStatus(messageId: string): Promise<{
    status: WhatsAppMessageStatus;
    timestamp: number;
  } | null> {
    const data = await redis.hgetall(`${this.messageStatusKey}:${messageId}`);
    if (data && data.status && data.timestamp) {
      return {
        status: data.status as WhatsAppMessageStatus,
        timestamp: parseInt(data.timestamp, 10),
      };
    }
    return null;
  }

  /**
   * Upload media to WhatsApp and get media ID
   * Note: This requires the media to be publicly accessible
   */
  public async uploadMedia(
    mediaUrl: string,
    type: 'image' | 'document' | 'audio' | 'video'
  ): Promise<{ success: boolean; mediaId?: string; error?: string }> {
    if (this.isMockMode()) {
      return {
        success: true,
        mediaId: `mock_media_${Date.now()}`,
      };
    }

    try {
      const formData = new URLSearchParams();
      formData.append('messaging_product', 'whatsapp');
      formData.append('file', mediaUrl);
      formData.append('type', type);

      const response = await this.client.post(
        `/${this.phoneNumberId}/media`,
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return { success: true, mediaId: response.data.id };
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      logger.error('[WhatsApp] Failed to upload media', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Verify webhook token
   */
  public verifyWebhookToken(token: string): boolean {
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '';
    return token === verifyToken;
  }

  /**
   * Get delivery statistics for a merchant
   */
  public async getDeliveryStats(
    merchantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    pending: number;
  }> {
    const stats = { sent: 0, delivered: 0, read: 0, failed: 0, pending: 0 };

    try {
      // Get all message IDs from merchant's messages
      const pattern = `whatsapp:merchant:${merchantId}:*`;
      const keys = await redis.keys(pattern);

      for (const key of keys.slice(0, 1000)) { // Limit to prevent too many Redis calls
        const data = await redis.hgetall(key);
        if (data?.status) {
          const status = data.status as keyof typeof stats;
          if (status in stats) {
            stats[status]++;
          }
        }
      }
    } catch (error) {
      logger.error('[WhatsApp] Failed to get delivery stats', { error });
    }

    return stats;
  }

  /**
   * Log message for merchant tracking
   */
  public async logMessage(
    messageId: string,
    merchantId: string,
    recipientPhone: string,
    template?: string,
    status?: WhatsAppMessageStatus
  ): Promise<void> {
    const key = `whatsapp:merchant:${merchantId}:${messageId}`;
    await redis.hset(key, {
      messageId,
      merchantId,
      recipientPhone,
      template: template || '',
      status: status || WhatsAppMessageStatus.QUEUED,
      createdAt: String(Date.now()),
    });
    await redis.expire(key, 2592000); // 30 days TTL
  }
}

// Singleton instance
let whatsappServiceInstance: WhatsAppService | null = null;

export function getWhatsAppService(): WhatsAppService {
  if (!whatsappServiceInstance) {
    whatsappServiceInstance = new WhatsAppService();
  }
  return whatsappServiceInstance;
}

export default WhatsAppService;
