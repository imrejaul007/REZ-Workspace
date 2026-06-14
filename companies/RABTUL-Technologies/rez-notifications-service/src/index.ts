/**
 * @rez/notifications-service
 *
 * Unified notification service combining push, SMS, email, WhatsApp, and in-app notifications.
 * Features:
 * - Template engine with Handlebars
 * - Channel preferences per user
 * - Rate limiting per channel
 * - Retry logic with exponential backoff
 * - Dead letter queue for failed notifications
 * - Analytics tracking
 *
 * Usage:
 *   import { NotificationService } from '@rez/notifications-service';
 */

import { Queue, Worker, Job } from 'bullmq';
import Handlebars from 'handlebars';
import Redis from 'ioredis';
import winston from 'winston';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import crypto from 'crypto';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type NotificationChannel = 'push' | 'sms' | 'email' | 'whatsapp' | 'inApp';
export type NotificationPriority = 'high' | 'normal' | 'low';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'retrying';

export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  badge?: number;
  sound?: string;
  icon?: string;
  clickAction?: string;
}

export interface UserNotificationPreferences {
  userId: string;
  channels: {
    push: boolean;
    sms: boolean;
    email: boolean;
    whatsapp: boolean;
    inApp: boolean;
  };
  quietHours?: {
    start: string; // HH:mm format
    end: string;
    timezone: string;
  };
  email?: string;
  phone?: string;
  pushToken?: string;
  whatsappNumber?: string;
}

export interface Notification {
  id: string;
  userId: string;
  channel: NotificationChannel;
  type: string;
  template: string;
  data: Record<string, unknown>;
  priority: NotificationPriority;
  scheduledAt?: Date;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export interface NotificationResult {
  notificationId: string;
  success: boolean;
  channel: NotificationChannel;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

export interface BatchResult {
  total: number;
  successful: number;
  failed: number;
  results: NotificationResult[];
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface DeadLetterQueueEntry {
  notification: Notification;
  error: string;
  attempts: number;
  lastAttempt: Date;
  failedAt: Date;
}

export interface AnalyticsEvent {
  notificationId: string;
  userId: string;
  channel: NotificationChannel;
  eventType: 'queued' | 'sent' | 'delivered' | 'failed' | 'clicked' | 'unsubscribed';
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface Template {
  id: string;
  name: string;
  channel: NotificationChannel;
  subject?: string; // For email
  body: string;
  variables: string[];
}

export interface NotificationServiceConfig {
  redis: Redis;
  logger?: winston.Logger;
  emailTransport?: nodemailer.Transporter;
  twilioClient?: twilio.Twilio;
  firebaseAdmin?: import('firebase-admin').app.App;
  rateLimits?: Partial<Record<NotificationChannel, RateLimitConfig>>;
  retryConfig?: Partial<RetryConfig>;
  maxDeadLetterQueueSize?: number;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

const DEFAULT_RATE_LIMITS: Record<NotificationChannel, RateLimitConfig> = {
  push: { windowMs: 60000, maxRequests: 100 },      // 100 push per minute
  sms: { windowMs: 3600000, maxRequests: 10 },     // 10 SMS per hour
  email: { windowMs: 3600000, maxRequests: 50 },   // 50 emails per hour
  whatsapp: { windowMs: 3600000, maxRequests: 20 }, // 20 WhatsApp per hour
  inApp: { windowMs: 60000, maxRequests: 200 },    // 200 in-app per minute
};

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 5,
  initialDelayMs: 1000,
  maxDelayMs: 60000,
  backoffMultiplier: 2,
};

const MAX_DEAD_LETTER_QUEUE_SIZE = 10000;
const INAPP_NOTIFICATION_CACHE_SIZE = 100; // Keep last 100 in-app notifications per user

// ============================================================================
// TEMPLATE ENGINE
// ============================================================================

export class TemplateEngine {
  private templates: Map<string, Template> = new Map();
  private handlebars: typeof Handlebars;

  constructor() {
    this.handlebars = Handlebars;
    this.registerHelpers();
  }

  private registerHelpers(): void {
    // Custom Handlebars helpers
    this.handlebars.registerHelper('formatDate', (date: Date | string, format: string) => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { format });
    });

    this.handlebars.registerHelper('uppercase', (str: string) => {
      return str?.toUpperCase() || '';
    });

    this.handlebars.registerHelper('lowercase', (str: string) => {
      return str?.toLowerCase() || '';
    });

    this.handlebars.registerHelper('truncate', (str: string, length: number) => {
      if (!str) return '';
      return str.length > length ? str.substring(0, length) + '...' : str;
    });
  }

  registerTemplate(template: Template): void {
    this.templates.set(template.id, template);
  }

  registerTemplates(templates: Template[]): void {
    templates.forEach(t => this.registerTemplate(t));
  }

  getTemplate(templateId: string): Template | undefined {
    return this.templates.get(templateId);
  }

  compile(templateId: string, data: Record<string, unknown>): { subject?: string; body: string } | null {
    const template = this.templates.get(templateId);
    if (!template) {
      return null;
    }

    const compileTemplate = this.handlebars.compile(template.body);
    const compiledBody = compileTemplate(data);

    let compiledSubject: string | undefined;
    if (template.subject) {
      const compileSubject = this.handlebars.compile(template.subject);
      compiledSubject = compileSubject(data);
    }

    return {
      subject: compiledSubject,
      body: compiledBody,
    };
  }

  validateTemplate(templateId: string, data: Record<string, unknown>): { valid: boolean; missingVars: string[] } {
    const template = this.templates.get(templateId);
    if (!template) {
      return { valid: false, missingVars: [] };
    }

    const missingVars = template.variables.filter(v => data[v] === undefined);
    return {
      valid: missingVars.length === 0,
      missingVars,
    };
  }
}

// ============================================================================
// RATE LIMITER
// ============================================================================

export class RateLimiter {
  private redis: Redis;
  private limits: Record<NotificationChannel, RateLimitConfig>;
  private logger: winston.Logger;

  constructor(redis: Redis, limits: Record<NotificationChannel, RateLimitConfig>, logger: winston.Logger) {
    this.redis = redis;
    this.limits = limits;
    this.logger = logger;
  }

  async isAllowed(userId: string, channel: NotificationChannel): Promise<boolean> {
    const config = this.limits[channel];
    if (!config) return true;

    const key = `ratelimit:${channel}:${userId}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const pipeline = this.redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zadd(key, now.toString(), `${now}:${crypto.randomUUID()}`);
    pipeline.zcard(key);
    pipeline.expire(key, Math.ceil(config.windowMs / 1000));

    const results = await pipeline.exec();
    const count = results?.[2]?.[1] as number;

    if (count !== undefined && count >= config.maxRequests) {
      this.logger.warn('Rate limit exceeded', {
        userId,
        channel,
        count,
        maxRequests: config.maxRequests,
      });
      return false;
    }

    return true;
  }

  async getRemaining(userId: string, channel: NotificationChannel): Promise<number> {
    const config = this.limits[channel];
    if (!config) return Infinity;

    const key = `ratelimit:${channel}:${userId}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    await this.redis.zremrangebyscore(key, 0, windowStart);
    const count = await this.redis.zcard(key);

    return Math.max(0, config.maxRequests - count);
  }

  async reset(userId: string, channel: NotificationChannel): Promise<void> {
    const key = `ratelimit:${channel}:${userId}`;
    await this.redis.del(key);
  }
}

// ============================================================================
// ANALYTICS TRACKER
// ============================================================================

export class AnalyticsTracker {
  private redis: Redis;
  private logger: winston.Logger;

  constructor(redis: Redis, logger: winston.Logger) {
    this.redis = redis;
    this.logger = logger;
  }

  async track(event: AnalyticsEvent): Promise<void> {
    const key = `analytics:${event.channel}:${event.eventType}`;
    const timestamp = event.timestamp.getTime();

    const pipeline = this.redis.pipeline();
    pipeline.zadd(key, timestamp.toString(), JSON.stringify(event));
    pipeline.zremrangebyscore(key, 0, timestamp - 30 * 24 * 60 * 60 * 1000); // 30 days retention
    pipeline.incr(`analytics:${event.channel}:${event.eventType}:count`);
    await pipeline.exec();

    this.logger.debug('Analytics event tracked', {
      notificationId: event.notificationId,
      eventType: event.eventType,
    });
  }

  async getStats(channel: NotificationChannel, days: number = 7): Promise<Record<string, number>> {
    const stats: Record<string, number> = {};
    const eventTypes: AnalyticsEvent['eventType'][] = ['queued', 'sent', 'delivered', 'failed', 'clicked'];

    for (const eventType of eventTypes) {
      const key = `analytics:${channel}:${eventType}:count`;
      const count = await this.redis.get(key);
      stats[eventType] = parseInt(count || '0', 10);
    }

    return stats;
  }

  async getUserEngagement(userId: string): Promise<Record<string, unknown>> {
    const [clickedCount, deliveredCount] = await Promise.all([
      this.redis.scard(`user:${userId}:clicked_notifications`),
      this.redis.scard(`user:${userId}:delivered_notifications`),
    ]);

    return {
      clickedCount,
      deliveredCount,
      engagementRate: deliveredCount > 0 ? (clickedCount / deliveredCount) * 100 : 0,
    };
  }
}

// ============================================================================
// DEAD LETTER QUEUE
// ============================================================================

export class DeadLetterQueue {
  private redis: Redis;
  private logger: winston.Logger;
  private maxSize: number;
  private readonly QUEUE_KEY = 'notifications:deadletterqueue';

  constructor(redis: Redis, logger: winston.Logger, maxSize: number = MAX_DEAD_LETTER_QUEUE_SIZE) {
    this.redis = redis;
    this.logger = logger;
    this.maxSize = maxSize;
  }

  async add(entry: DeadLetterQueueEntry): Promise<void> {
    const serialized = JSON.stringify(entry);

    const pipeline = this.redis.pipeline();
    pipeline.lpush(this.QUEUE_KEY, serialized);
    pipeline.ltrim(this.QUEUE_KEY, 0, this.maxSize - 1);
    pipeline.hincrby('notifications:dlq:stats', 'total', 1);
    await pipeline.exec();

    this.logger.error('Notification added to dead letter queue', {
      notificationId: entry.notification.id,
      error: entry.error,
      attempts: entry.attempts,
    });
  }

  async getAll(limit: number = 100): Promise<DeadLetterQueueEntry[]> {
    const items = await this.redis.lrange(this.QUEUE_KEY, 0, limit - 1);
    return items.map(item => JSON.parse(item) as DeadLetterQueueEntry);
  }

  async retry(entry: DeadLetterQueueEntry): Promise<boolean> {
    await this.redis.lrem(this.QUEUE_KEY, 1, JSON.stringify(entry));
    return true;
  }

  async clear(): Promise<void> {
    await this.redis.del(this.QUEUE_KEY);
  }

  async size(): Promise<number> {
    return this.redis.llen(this.QUEUE_KEY);
  }

  async getStats(): Promise<{ total: number; byChannel: Record<NotificationChannel, number> }> {
    const entries = await this.getAll(this.maxSize);
    const byChannel: Record<NotificationChannel, number> = {
      push: 0,
      sms: 0,
      email: 0,
      whatsapp: 0,
      inApp: 0,
    };

    for (const entry of entries) {
      byChannel[entry.notification.channel]++;
    }

    return { total: entries.length, byChannel };
  }
}

// ============================================================================
// CHANNEL PROVIDERS
// ============================================================================

export interface ChannelProvider {
  send(notification: Notification, content: { body: string; subject?: string }): Promise<string>;
}

export class PushProvider implements ChannelProvider {
  private firebaseAdmin?: import('firebase-admin').app.App;
  private logger: winston.Logger;

  constructor(firebaseAdmin?: import('firebase-admin').app.App, logger: winston.Logger) {
    this.firebaseAdmin = firebaseAdmin;
    this.logger = logger;
  }

  async send(notification: Notification, content: { body: string; subject?: string }): Promise<string> {
    if (!this.firebaseAdmin) {
      // Mock implementation for development
      const mockMessageId = `push_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').substring(0, 9)}`;
      this.logger.info('Mock push notification sent', {
        notificationId: notification.id,
        title: content.subject || notification.data.title,
        messageId: mockMessageId,
      });
      return mockMessageId;
    }

    const message = {
      notification: {
        title: content.subject || notification.data.title as string,
        body: content.body,
      },
      data: notification.data as Record<string, string>,
      token: notification.metadata?.pushToken as string,
    };

    const response = await this.firebaseAdmin.messaging().send(message);
    return response;
  }
}

export class SMSProvider implements ChannelProvider {
  private twilioClient?: twilio.Twilio;
  private logger: winston.Logger;

  constructor(twilioClient?: twilio.Twilio, logger: winston.Logger) {
    this.twilioClient = twilioClient;
    this.logger = logger;
  }

  async send(notification: Notification, content: { body: string; subject?: string }): Promise<string> {
    if (!this.twilioClient) {
      // Mock implementation for development
      const mockMessageId = `sms_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').substring(0, 9)}`;
      this.logger.info('Mock SMS sent', {
        notificationId: notification.id,
        phone: notification.metadata?.phone,
        messageId: mockMessageId,
      });
      return mockMessageId;
    }

    const response = await this.twilioClient.messages.create({
      body: content.body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: notification.metadata?.phone as string,
    });

    return response.sid;
  }
}

export class EmailProvider implements ChannelProvider {
  private transport: nodemailer.Transporter;
  private logger: winston.Logger;

  constructor(transport: nodemailer.Transporter, logger: winston.Logger) {
    this.transport = transport;
    this.logger = logger;
  }

  async send(notification: Notification, content: { body: string; subject?: string }): Promise<string> {
    // FIX: Use crypto.randomUUID() instead of Math.random() for secure message IDs
    const messageId = `email_${Date.now()}_${crypto.randomUUID().replace(/-/g, '')}`;

    try {
      await this.transport.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@rez.app',
        to: notification.metadata?.email as string,
        subject: content.subject || 'ReZ Notification',
        html: content.body,
        text: content.body.replace(/<[^>]*>/g, ''),
      });

      this.logger.info('Email sent', {
        notificationId: notification.id,
        to: notification.metadata?.email,
        messageId,
      });

      return messageId;
    } catch (error) {
      this.logger.error('Failed to send email', {
        notificationId: notification.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

export class WhatsAppProvider implements ChannelProvider {
  private twilioClient?: twilio.Twilio;
  private logger: winston.Logger;

  constructor(twilioClient?: twilio.Twilio, logger: winston.Logger) {
    this.twilioClient = twilioClient;
    this.logger = logger;
  }

  async send(notification: Notification, content: { body: string; subject?: string }): Promise<string> {
    if (!this.twilioClient) {
      // Mock implementation for development
      // FIX: Use crypto.randomUUID() instead of Math.random() for secure message IDs
      const mockMessageId = `whatsapp_${Date.now()}_${crypto.randomUUID().replace(/-/g, '')}`;
      this.logger.info('Mock WhatsApp message sent', {
        notificationId: notification.id,
        phone: notification.metadata?.phone,
        messageId: mockMessageId,
      });
      return mockMessageId;
    }

    const response = await this.twilioClient.messages.create({
      body: content.body,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${notification.metadata?.phone as string}`,
    });

    return response.sid;
  }
}

export class InAppProvider implements ChannelProvider {
  private redis: Redis;
  private logger: winston.Logger;

  constructor(redis: Redis, logger: winston.Logger) {
    this.redis = redis;
    this.logger = logger;
  }

  async send(notification: Notification, content: { body: string; subject?: string }): Promise<string> {
    // FIX: Use crypto.randomUUID() instead of Math.random() for secure message IDs
    const messageId = `inapp_${Date.now()}_${crypto.randomUUID().replace(/-/g, '')}`;

    const inAppNotification = {
      id: messageId,
      userId: notification.userId,
      title: content.subject || notification.data.title as string,
      message: content.body,
      type: notification.type,
      data: notification.data,
      read: false,
      createdAt: new Date().toISOString(),
    };

    // Store in Redis for real-time retrieval
    await this.redis.lpush(`notifications:inapp:${notification.userId}`, JSON.stringify(inAppNotification));
    await this.redis.ltrim(`notifications:inapp:${notification.userId}`, 0, INAPP_NOTIFICATION_CACHE_SIZE - 1);

    // Publish to Redis pub/sub for real-time delivery
    await this.redis.publish(`user:${notification.userId}:notifications`, JSON.stringify(inAppNotification));

    this.logger.info('In-app notification sent', {
      notificationId: notification.id,
      userId: notification.userId,
      messageId,
    });

    return messageId;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const notifications = await this.redis.lrange(`notifications:inapp:${userId}`, 0, -1);
    return notifications.filter(n => {
      const parsed = JSON.parse(n);
      return !parsed.read;
    }).length;
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const key = `notifications:inapp:${userId}`;
    const notifications = await this.redis.lrange(key, 0, -1);

    for (let i = 0; i < notifications.length; i++) {
      const parsed = JSON.parse(notifications[i]);
      if (parsed.id === notificationId) {
        parsed.read = true;
        await this.redis.lset(key, i, JSON.stringify(parsed));
        break;
      }
    }
  }

  async getNotifications(userId: string, limit: number = 20): Promise<unknown[]> {
    const notifications = await this.redis.lrange(`notifications:inapp:${userId}`, 0, limit - 1);
    return notifications.map(n => JSON.parse(n));
  }
}

// ============================================================================
// UNIFIED NOTIFICATION SERVICE
// ============================================================================

export class NotificationService {
  private redis: Redis;
  private logger: winston.Logger;
  private templateEngine: TemplateEngine;
  private rateLimiter: RateLimiter;
  private analytics: AnalyticsTracker;
  private deadLetterQueue: DeadLetterQueue;
  private queue: Queue;
  private worker: Worker;
  private retryConfig: RetryConfig;

  // Channel providers
  private pushProvider: PushProvider;
  private smsProvider: SMSProvider;
  private emailProvider: EmailProvider;
  private whatsappProvider: WhatsAppProvider;
  private inAppProvider: InAppProvider;

  // User preferences cache
  private preferencesCache: Map<string, UserNotificationPreferences> = new Map();
  private cacheTTL: number = 300000; // 5 minutes

  constructor(config: NotificationServiceConfig) {
    this.redis = config.redis;
    this.logger = config.logger || this.createDefaultLogger();
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config.retryConfig };
    this.templateEngine = new TemplateEngine();
    this.rateLimiter = new RateLimiter(this.redis, {
      ...DEFAULT_RATE_LIMITS,
      ...config.rateLimits,
    }, this.logger);
    this.analytics = new AnalyticsTracker(this.redis, this.logger);
    this.deadLetterQueue = new DeadLetterQueue(this.redis, this.logger, config.maxDeadLetterQueueSize);

    // Initialize channel providers
    this.pushProvider = new PushProvider(config.firebaseAdmin, this.logger);
    this.smsProvider = new SMSProvider(config.twilioClient, this.logger);
    this.emailProvider = new EmailProvider(
      config.emailTransport || this.createMockEmailTransport(),
      this.logger
    );
    this.whatsappProvider = new WhatsAppProvider(config.twilioClient, this.logger);
    this.inAppProvider = new InAppProvider(this.redis, this.logger);

    // Initialize BullMQ queue
    this.queue = new Queue('notifications', { connection: this.redis });
    this.worker = this.createWorker();
  }

  private createDefaultLogger(): winston.Logger {
    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        process.env.NODE_ENV === 'production'
          ? winston.format.json()
          : winston.format.combine(winston.format.colorize(), winston.format.simple())
      ),
      defaultMeta: { service: 'notifications-service' },
      transports: [new winston.transports.Console()],
    });
  }

  private createMockEmailTransport(): nodemailer.Transporter {
    return nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  private createWorker(): Worker {
    return new Worker(
      'notifications',
      async (job: Job) => {
        const notification = job.data as Notification;
        return this.processNotification(notification, job);
      },
      {
        connection: this.redis,
        concurrency: 10,
        limiter: {
          max: 100,
          duration: 1000,
        },
      }
    );
  }

  // ============================================================================
  // PUBLIC API METHODS
  // ============================================================================

  /**
   * Send a push notification to a user
   */
  async sendPush(userId: string, notification: PushNotification): Promise<void> {
    const userPrefs = await this.getUserPreferences(userId);

    if (!userPrefs.channels.push) {
      this.logger.info('Push notifications disabled for user', { userId });
      return;
    }

    if (!this.isWithinQuietHours(userPrefs)) {
      this.logger.info('Push notification blocked due to quiet hours', { userId });
      return;
    }

    const allowed = await this.rateLimiter.isAllowed(userId, 'push');
    if (!allowed) {
      throw new Error(`Rate limit exceeded for push notifications: ${userId}`);
    }

    const notificationItem: Notification = {
      // FIX: Use crypto.randomUUID() instead of Math.random() for secure IDs
      id: `push_${Date.now()}_${crypto.randomUUID().replace(/-/g, '')}`,
      userId,
      channel: 'push',
      type: 'push',
      template: 'default',
      data: {
        title: notification.title,
        body: notification.body,
        ...notification.data,
      },
      priority: 'normal',
      createdAt: new Date(),
      metadata: {
        pushToken: userPrefs.pushToken,
        ...notification,
      },
    };

    await this.queue.add(notificationItem.id, notificationItem, {
      attempts: this.retryConfig.maxAttempts,
      backoff: {
        type: 'exponential',
        delay: this.retryConfig.initialDelayMs,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });

    await this.analytics.track({
      notificationId: notificationItem.id,
      userId,
      channel: 'push',
      eventType: 'queued',
      timestamp: new Date(),
    });
  }

  /**
   * Send an SMS to a phone number
   */
  async sendSMS(phone: string, message: string): Promise<void> {
    const allowed = await this.rateLimiter.isAllowed(phone, 'sms');
    if (!allowed) {
      throw new Error(`Rate limit exceeded for SMS: ${phone}`);
    }

    const notification: Notification = {
      // FIX: Use crypto.randomUUID() instead of Math.random() for secure IDs
      id: `sms_${Date.now()}_${crypto.randomUUID().replace(/-/g, '')}`,
      userId: phone,
      channel: 'sms',
      type: 'sms',
      template: 'default',
      data: { body: message },
      priority: 'normal',
      createdAt: new Date(),
      metadata: { phone },
    };

    await this.queue.add(notification.id, notification, {
      attempts: this.retryConfig.maxAttempts,
      backoff: {
        type: 'exponential',
        delay: this.retryConfig.initialDelayMs,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });

    await this.analytics.track({
      notificationId: notification.id,
      userId: phone,
      channel: 'sms',
      eventType: 'queued',
      timestamp: new Date(),
    });
  }

  /**
   * Send an email
   */
  async sendEmail(email: string, template: string, data: Record<string, unknown>): Promise<void> {
    const allowed = await this.rateLimiter.isAllowed(email, 'email');
    if (!allowed) {
      throw new Error(`Rate limit exceeded for email: ${email}`);
    }

    const notification: Notification = {
      // FIX: Use crypto.randomUUID() instead of Math.random() for secure IDs
      id: `email_${Date.now()}_${crypto.randomUUID().replace(/-/g, '')}`,
      userId: email,
      channel: 'email',
      type: 'email',
      template,
      data,
      priority: 'normal',
      createdAt: new Date(),
      metadata: { email },
    };

    await this.queue.add(notification.id, notification, {
      attempts: this.retryConfig.maxAttempts,
      backoff: {
        type: 'exponential',
        delay: this.retryConfig.initialDelayMs,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });

    await this.analytics.track({
      notificationId: notification.id,
      userId: email,
      channel: 'email',
      eventType: 'queued',
      timestamp: new Date(),
    });
  }

  /**
   * Send a WhatsApp message
   */
  async sendWhatsApp(phone: string, template: string, data: Record<string, unknown>): Promise<void> {
    const allowed = await this.rateLimiter.isAllowed(phone, 'whatsapp');
    if (!allowed) {
      throw new Error(`Rate limit exceeded for WhatsApp: ${phone}`);
    }

    const notification: Notification = {
      // FIX: Use crypto.randomUUID() instead of Math.random() for secure IDs
      id: `whatsapp_${Date.now()}_${crypto.randomUUID().replace(/-/g, '')}`,
      userId: phone,
      channel: 'whatsapp',
      type: 'whatsapp',
      template,
      data,
      priority: 'normal',
      createdAt: new Date(),
      metadata: { phone },
    };

    await this.queue.add(notification.id, notification, {
      attempts: this.retryConfig.maxAttempts,
      backoff: {
        type: 'exponential',
        delay: this.retryConfig.initialDelayMs,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });

    await this.analytics.track({
      notificationId: notification.id,
      userId: phone,
      channel: 'whatsapp',
      eventType: 'queued',
      timestamp: new Date(),
    });
  }

  /**
   * Send an in-app notification
   */
  async sendInApp(userId: string, notificationData: Record<string, unknown>): Promise<void> {
    const userPrefs = await this.getUserPreferences(userId);

    if (!userPrefs.channels.inApp) {
      this.logger.info('In-app notifications disabled for user', { userId });
      return;
    }

    const allowed = await this.rateLimiter.isAllowed(userId, 'inApp');
    if (!allowed) {
      throw new Error(`Rate limit exceeded for in-app notifications: ${userId}`);
    }

    const notification: Notification = {
      // FIX: Use crypto.randomUUID() instead of Math.random() for secure IDs
      id: `inapp_${Date.now()}_${crypto.randomUUID().replace(/-/g, '')}`,
      userId,
      channel: 'inApp',
      type: notificationData.type as string || 'general',
      template: notificationData.template as string || 'default',
      data: notificationData,
      priority: 'normal',
      createdAt: new Date(),
      metadata: {},
    };

    await this.queue.add(notification.id, notification, {
      attempts: this.retryConfig.maxAttempts,
      backoff: {
        type: 'exponential',
        delay: this.retryConfig.initialDelayMs,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });

    await this.analytics.track({
      notificationId: notification.id,
      userId,
      channel: 'inApp',
      eventType: 'queued',
      timestamp: new Date(),
    });
  }

  /**
   * Send batch notifications
   */
  async sendBatch(notifications: Notification[]): Promise<BatchResult> {
    const results: NotificationResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const notification of notifications) {
      try {
        const result = await this.queue.add(notification.id, notification, {
          attempts: this.retryConfig.maxAttempts,
          backoff: {
            type: 'exponential',
            delay: this.retryConfig.initialDelayMs,
          },
          removeOnComplete: true,
          removeOnFail: false,
        });

        results.push({
          notificationId: notification.id,
          success: true,
          channel: notification.channel,
          timestamp: new Date(),
        });
        successful++;

        await this.analytics.track({
          notificationId: notification.id,
          userId: notification.userId,
          channel: notification.channel,
          eventType: 'queued',
          timestamp: new Date(),
        });
      } catch (error) {
        results.push({
          notificationId: notification.id,
          success: false,
          channel: notification.channel,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        });
        failed++;
      }
    }

    return {
      total: notifications.length,
      successful,
      failed,
      results,
    };
  }

  // ============================================================================
  // INTERNAL PROCESSING METHODS
  // ============================================================================

  private async processNotification(notification: Notification, job: Job): Promise<string> {
    const compiled = this.templateEngine.compile(notification.template, notification.data);

    if (!compiled) {
      throw new Error(`Template not found: ${notification.template}`);
    }

    let messageId: string;

    try {
      switch (notification.channel) {
        case 'push':
          messageId = await this.pushProvider.send(notification, {
            body: compiled.body,
            subject: notification.data.title as string,
          });
          break;
        case 'sms':
          messageId = await this.smsProvider.send(notification, { body: compiled.body });
          break;
        case 'email':
          messageId = await this.emailProvider.send(notification, {
            body: compiled.body,
            subject: compiled.subject,
          });
          break;
        case 'whatsapp':
          messageId = await this.whatsappProvider.send(notification, { body: compiled.body });
          break;
        case 'inApp':
          messageId = await this.inAppProvider.send(notification, {
            body: compiled.body,
            subject: compiled.subject,
          });
          break;
        default:
          throw new Error(`Unknown channel: ${notification.channel}`);
      }

      await this.analytics.track({
        notificationId: notification.id,
        userId: notification.userId,
        channel: notification.channel,
        eventType: 'sent',
        timestamp: new Date(),
        metadata: { messageId },
      });

      return messageId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.analytics.track({
        notificationId: notification.id,
        userId: notification.userId,
        channel: notification.channel,
        eventType: 'failed',
        timestamp: new Date(),
        metadata: { error: errorMessage, attempt: job.attemptsMade + 1 },
      });

      // Check if this is the last attempt
      if (job.attemptsMade + 1 >= this.retryConfig.maxAttempts) {
        await this.deadLetterQueue.add({
          notification,
          error: errorMessage,
          attempts: job.attemptsMade + 1,
          lastAttempt: new Date(),
          failedAt: new Date(),
        });
      }

      throw error;
    }
  }

  // ============================================================================
  // USER PREFERENCES
  // ============================================================================

  async setUserPreferences(preferences: UserNotificationPreferences): Promise<void> {
    const key = `user:${preferences.userId}:notification_prefs`;
    await this.redis.set(key, JSON.stringify(preferences), 'EX', this.cacheTTL);
    this.preferencesCache.set(preferences.userId, preferences);
  }

  async getUserPreferences(userId: string): Promise<UserNotificationPreferences> {
    // Check cache first
    const cached = this.preferencesCache.get(userId);
    if (cached) {
      return cached;
    }

    const key = `user:${userId}:notification_prefs`;
    const stored = await this.redis.get(key);

    if (stored) {
      const prefs = JSON.parse(stored) as UserNotificationPreferences;
      this.preferencesCache.set(userId, prefs);
      return prefs;
    }

    // Return default preferences
    const defaultPrefs: UserNotificationPreferences = {
      userId,
      channels: {
        push: true,
        sms: true,
        email: true,
        whatsapp: true,
        inApp: true,
      },
    };

    return defaultPrefs;
  }

  private isWithinQuietHours(preferences: UserNotificationPreferences): boolean {
    if (!preferences.quietHours) return true;

    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: preferences.quietHours.timezone,
    });

    const currentTime = formatter.format(now);
    const { start, end } = preferences.quietHours;

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (start > end) {
      return currentTime < start && currentTime > end;
    }

    return currentTime >= start && currentTime <= end;
  }

  // ============================================================================
  // TEMPLATE MANAGEMENT
  // ============================================================================

  registerTemplate(template: Template): void {
    this.templateEngine.registerTemplate(template);
  }

  registerTemplates(templates: Template[]): void {
    this.templateEngine.registerTemplates(templates);
  }

  // ============================================================================
  // QUEUE MANAGEMENT
  // ============================================================================

  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  async pauseQueue(): Promise<void> {
    await this.queue.pause();
    this.logger.info('Notification queue paused');
  }

  async resumeQueue(): Promise<void> {
    await this.queue.resume();
    this.logger.info('Notification queue resumed');
  }

  // ============================================================================
  // ANALYTICS & REPORTING
  // ============================================================================

  async getChannelStats(channel: NotificationChannel): Promise<Record<string, number>> {
    return this.analytics.getStats(channel);
  }

  async getDeadLetterQueueStats(): Promise<{ total: number; byChannel: Record<NotificationChannel, number> }> {
    return this.deadLetterQueue.getStats();
  }

  async getDeadLetterQueueEntries(limit?: number): Promise<DeadLetterQueueEntry[]> {
    return this.deadLetterQueue.getAll(limit);
  }

  async retryDeadLetterEntry(entry: DeadLetterQueueEntry): Promise<boolean> {
    const success = await this.deadLetterQueue.retry(entry);

    if (success) {
      // Re-add to queue
      await this.queue.add(entry.notification.id, entry.notification, {
        attempts: this.retryConfig.maxAttempts,
        backoff: {
          type: 'exponential',
          delay: this.retryConfig.initialDelayMs,
        },
      });
    }

    return success;
  }

  // ============================================================================
  // CLEANUP & SHUTDOWN
  // ============================================================================

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down notification service...');
    await this.worker.close();
    await this.queue.close();
    this.logger.info('Notification service shut down');
  }
}

// ============================================================================
// DEFAULT TEMPLATES
// ============================================================================

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'welcome_email',
    name: 'Welcome Email',
    channel: 'email',
    subject: 'Welcome to ReZ, {{name}}!',
    body: '<h1>Welcome, {{name}}!</h1><p>Thank you for joining ReZ. Your account is ready to use.</p>',
    variables: ['name'],
  },
  {
    id: 'verification_code',
    name: 'Verification Code',
    channel: 'sms',
    body: 'Your ReZ verification code is: {{code}}. Valid for {{minutes}} minutes.',
    variables: ['code', 'minutes'],
  },
  {
    id: 'order_confirmation',
    name: 'Order Confirmation',
    channel: 'email',
    subject: 'Order #{{orderId}} Confirmed',
    body: '<h1>Order Confirmed</h1><p>Your order #{{orderId}} has been confirmed and will be shipped to {{address}}.</p><p>Total: {{total}}</p>',
    variables: ['orderId', 'address', 'total'],
  },
  {
    id: 'promotional',
    name: 'Promotional Notification',
    channel: 'push',
    body: '{{message}}',
    variables: ['message'],
  },
  {
    id: 'chat_message',
    name: 'Chat Message',
    channel: 'inApp',
    body: '<strong>{{sender}}</strong>: {{message}}',
    variables: ['sender', 'message'],
  },
];

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createNotificationService(config: NotificationServiceConfig): NotificationService {
  const service = new NotificationService(config);

  // Register default templates
  service.registerTemplates(DEFAULT_TEMPLATES);

  return service;
}

// Re-export types for consumers
export {
  NotificationService,
  TemplateEngine,
  RateLimiter,
  AnalyticsTracker,
  DeadLetterQueue,
  PushProvider,
  SMSProvider,
  EmailProvider,
  WhatsAppProvider,
  InAppProvider,
};


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-notifications-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
