/**
 * Abandoned Cart Automation Service
 * Handles queue-based scheduled reminders with escalating discounts
 */

import axios, { AxiosInstance } from 'axios';
import config from '../config';
import { Types } from 'mongoose';
import {
  AbandonedCartModel,
  EngagementActionModel,
  ChannelPreferenceModel,
  LeadScoreModel,
} from '../models';
import { logger } from '@rez/shared';
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import {
  AbandonedCart,
  CartItem,
  RecommendedChannel,
  CartReminderJob,
  DiscountOffer,
  AbandonedCartStats,
} from '../types';

// ============================================================================
// Types
// ============================================================================

interface CartReminderConfig {
  reminder1DelayHours: number;
  reminder2DelayHours: number;
  reminder3DelayHours: number;
  reminder1Discount: number;
  reminder2Discount: number;
  reminder3Discount: number;
  maxReminders: number;
  cartExpiryHours: number;
}

const DEFAULT_REMINDER_CONFIG: CartReminderConfig = {
  reminder1DelayHours: 1,
  reminder2DelayHours: 4,
  reminder3DelayHours: 24,
  reminder1Discount: 0,
  reminder2Discount: 5,
  reminder3Discount: 10,
  maxReminders: 3,
  cartExpiryHours: 168, // 7 days
};

// ============================================================================
// Redis Connection
// ============================================================================

let redisConnection: Redis | null = null;

function getRedisConnection(): Redis {
  if (!redisConnection) {
    redisConnection = new Redis(config.redis.url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return redisConnection;
}

// ============================================================================
// Queue Names
// ============================================================================

const QUEUE_NAMES = {
  CART_REMINDER: 'cart-reminder',
  CART_CHECKOUT: 'cart-checkout',
  CART_EXPIRY: 'cart-expiry',
} as const;

// ============================================================================
// Notification Service Client
// ============================================================================

class NotificationClient {
  private client: AxiosInstance;

  constructor() {
    const baseURL = config.services.notification || 'http://localhost:4011';
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async sendPush(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<{ success: boolean; messageId?: string }> {
    try {
      const response = await this.client.post('/api/v1/notifications/push', {
        userId,
        title,
        body,
        data: { ...data, source: 'abandoned_cart_automation' },
      });
      return { success: true, messageId: response.data?.messageId };
    } catch (error) {
      logger.warn('[Notification] Push failed', { userId, error: error.message });
      return { success: false };
    }
  }

  async sendWhatsApp(
    phone: string,
    template: string,
    parameters: Record<string, string>
  ): Promise<{ success: boolean }> {
    try {
      await this.client.post('/api/v1/notifications/whatsapp/send-template', {
        phone,
        template,
        parameters,
        source: 'abandoned_cart_automation',
      });
      return { success: true };
    } catch (error) {
      logger.warn('[Notification] WhatsApp failed', { phone, error: error.message });
      return { success: false };
    }
  }

  async sendEmail(
    email: string,
    subject: string,
    template: string,
    data: Record<string, unknown>
  ): Promise<{ success: boolean }> {
    try {
      await this.client.post('/api/v1/notifications/email/send', {
        to: email,
        subject,
        template,
        data: { ...data, source: 'abandoned_cart_automation' },
      });
      return { success: true };
    } catch (error) {
      logger.warn('[Notification] Email failed', { email, error: error.message });
      return { success: false };
    }
  }
}

// ============================================================================
// Profile Service Client
// ============================================================================

class ProfileClient {
  private client: AxiosInstance;

  constructor() {
    const baseURL = config.services.profile || 'http://localhost:4016';
    this.client = axios.create({
      baseURL,
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async getUser(userId: string): Promise<{
    email?: string;
    phone?: string;
    name?: string;
    notificationPrefs?: RecommendedChannel[];
  } | null> {
    try {
      const response = await this.client.get(`/api/v1/users/${userId}`);
      return response.data?.user || null;
    } catch {
      return null;
    }
  }
}

// ============================================================================
// Main Service
// ============================================================================

export class AbandonedCartAutomationService {
  private queues: Map<string, Queue>;
  private notificationClient: NotificationClient;
  private profileClient: ProfileClient;
  private config: CartReminderConfig;
  private workers: Map<string, Worker>;

  constructor() {
    this.queues = new Map();
    this.workers = new Map();
    this.notificationClient = new NotificationClient();
    this.profileClient = new ProfileClient();
    this.config = DEFAULT_REMINDER_CONFIG;

    // Override with environment config
    this.config = {
      reminder1DelayHours: parseInt(process.env.CART_REMINDER1_DELAY_HOURS || '1', 10),
      reminder2DelayHours: parseInt(process.env.CART_REMINDER2_DELAY_HOURS || '4', 10),
      reminder3DelayHours: parseInt(process.env.CART_REMINDER3_DELAY_HOURS || '24', 10),
      reminder1Discount: parseFloat(process.env.CART_REMINDER1_DISCOUNT || '0'),
      reminder2Discount: parseFloat(process.env.CART_REMINDER2_DISCOUNT || '5'),
      reminder3Discount: parseFloat(process.env.CART_REMINDER3_DISCOUNT || '10'),
      maxReminders: parseInt(process.env.CART_MAX_REMINDERS || '3', 10),
      cartExpiryHours: parseInt(process.env.CART_EXPIRY_HOURS || '168', 10),
    };

    this.initializeQueues();
  }

  /**
   * Initialize BullMQ queues
   */
  private initializeQueues(): void {
    const connection = getRedisConnection();

    // Cart reminder queue
    const reminderQueue = new Queue(QUEUE_NAMES.CART_REMINDER, { connection });
    this.queues.set(QUEUE_NAMES.CART_REMINDER, reminderQueue);

    // Cart checkout queue (for recovery tracking)
    const checkoutQueue = new Queue(QUEUE_NAMES.CART_CHECKOUT, { connection });
    this.queues.set(QUEUE_NAMES.CART_CHECKOUT, checkoutQueue);

    logger.info('[AbandonedCartAutomation] Queues initialized');
  }

  /**
   * Start background workers for processing jobs
   */
  async startWorkers(): Promise<void> {
    const connection = getRedisConnection();

    // Reminder worker
    const reminderWorker = new Worker(
      QUEUE_NAMES.CART_REMINDER,
      async (job: Job<CartReminderJob>) => {
        await this.processReminderJob(job);
      },
      {
        connection,
        concurrency: 10,
        limiter: {
          max: 100,
          duration: 60000, // 100 jobs per minute max
        },
      }
    );

    reminderWorker.on('completed', (job) => {
      logger.info('[Worker] Reminder job completed', { jobId: job.id });
    });

    reminderWorker.on('failed', (job, err) => {
      logger.error('[Worker] Reminder job failed', { jobId: job?.id, error: err.message });
    });

    this.workers.set(QUEUE_NAMES.CART_REMINDER, reminderWorker);

    // Checkout tracking worker
    const checkoutWorker = new Worker(
      QUEUE_NAMES.CART_CHECKOUT,
      async (job: Job<{ userId: string; cartId: string }>) => {
        await this.processCheckoutJob(job);
      },
      { connection, concurrency: 5 }
    );

    checkoutWorker.on('completed', (job) => {
      logger.info('[Worker] Checkout job completed', { jobId: job.id });
    });

    this.workers.set(QUEUE_NAMES.CART_CHECKOUT, checkoutWorker);

    logger.info('[AbandonedCartAutomation] Workers started');
  }

  /**
   * Stop all workers gracefully
   */
  async stopWorkers(): Promise<void> {
    for (const worker of this.workers.values()) {
      await worker.close();
    }
    this.workers.clear();
    logger.info('[AbandonedCartAutomation] Workers stopped');
  }

  /**
   * Track a new abandoned cart and schedule reminders
   */
  async trackAbandonedCart(
    userId: string,
    cartId: string,
    items: CartItem[],
    totalValue: number
  ): Promise<AbandonedCart> {
    logger.info('[AbandonedCartAutomation] Tracking abandoned cart', {
      userId,
      cartId,
      itemCount: items.length,
      totalValue,
    });

    // Calculate expiry time
    const expiresAt = new Date(
      Date.now() + this.config.cartExpiryHours * 60 * 60 * 1000
    );

    // Upsert abandoned cart record
    const abandonedCart = await AbandonedCartModel.findOneAndUpdate(
      { cartId },
      {
        userId,
        cartId,
        items,
        totalValue,
        abandonedAt: new Date(),
        reminderCount: 0,
        recovered: false,
        expiresAt,
      },
      { upsert: true, new: true }
    );

    // Schedule reminders
    await this.scheduleReminders(userId, cartId);

    // Recalculate lead score
    try {
      const leadScore = await LeadScoreModel.findOne({ userId });
      if (leadScore) {
        // Trigger lead score recalculation via the lead intelligence service
        await this.notifyLeadIntelligence(userId, 'abandoned_cart', {
          cartId,
          totalValue,
          itemCount: items.length,
        });
      }
    } catch (error) {
      logger.warn('[AbandonedCartAutomation] Failed to notify lead intelligence', { error });
    }

    logger.info('[AbandonedCartAutomation] Cart tracked and reminders scheduled', {
      cartId,
      reminders: this.config.maxReminders,
    });

    return abandonedCart;
  }

  /**
   * Schedule reminder jobs for a cart
   */
  private async scheduleReminders(userId: string, cartId: string): Promise<void> {
    const reminderQueue = this.queues.get(QUEUE_NAMES.CART_REMINDER);
    if (!reminderQueue) return;

    const delays = [
      { reminderNumber: 1, delayMs: this.config.reminder1DelayHours * 60 * 60 * 1000, discount: this.config.reminder1Discount },
      { reminderNumber: 2, delayMs: this.config.reminder2DelayHours * 60 * 60 * 1000, discount: this.config.reminder2Discount },
      { reminderNumber: 3, delayMs: this.config.reminder3DelayHours * 60 * 60 * 1000, discount: this.config.reminder3Discount },
    ];

    for (const { reminderNumber, delayMs, discount } of delays) {
      const jobId = `${cartId}-reminder-${reminderNumber}`;

      // Check if job already exists
      const existingJob = await reminderQueue.getJob(jobId);
      if (existingJob) {
        logger.debug('[AbandonedCartAutomation] Reminder job already exists', { jobId });
        continue;
      }

      await reminderQueue.add(
        `reminder-${reminderNumber}`,
        {
          userId,
          cartId,
          reminderNumber,
          offerDiscount: discount,
        },
        {
          jobId,
          delay: delayMs,
          attempts: 3,
          backoff: { type: 'exponential', delay: 60000 },
          removeOnComplete: { count: 1000 },
          removeOnFail: { count: 5000 },
        }
      );

      logger.info('[AbandonedCartAutomation] Scheduled reminder', {
        cartId,
        reminderNumber,
        delayHours: delayMs / (60 * 60 * 1000),
        discount,
      });
    }
  }

  /**
   * Process a reminder job
   */
  private async processReminderJob(job: Job<CartReminderJob>): Promise<void> {
    const { userId, cartId, reminderNumber, offerDiscount } = job.data;

    logger.info('[AbandonedCartAutomation] Processing reminder', {
      jobId: job.id,
      cartId,
      reminderNumber,
    });

    try {
      // Check if cart was already converted
      const orderCheck = await this.checkIfCartConverted(cartId);
      if (orderCheck.converted) {
        logger.info('[AbandonedCartAutomation] Cart already converted, skipping reminder', { cartId });
        await this.recordReminderSkipped(cartId, reminderNumber, 'converted');
        return;
      }

      // Check if cart was recovered
      const abandonedCart = await AbandonedCartModel.findOne({ cartId });
      if (!abandonedCart || abandonedCart.recovered) {
        logger.info('[AbandonedCartAutomation] Cart recovered or not found, skipping reminder', { cartId });
        return;
      }

      // Check if max reminders reached
      if (abandonedCart.reminderCount >= this.config.maxReminders) {
        logger.info('[AbandonedCartAutomation] Max reminders reached', { cartId, reminderCount: abandonedCart.reminderCount });
        return;
      }

      // Get user profile
      const user = await this.profileClient.getUser(userId);
      if (!user) {
        logger.warn('[AbandonedCartAutomation] User not found', { userId });
        return;
      }

      // Get channel preferences
      const channelPref = await ChannelPreferenceModel.findOne({ userId });
      const channels = channelPref ? this.getEnabledChannels(channelPref) : ['push'];

      // Send notifications across channels
      let anySuccess = false;
      for (const channel of channels) {
        const success = await this.sendReminderNotification(
          userId,
          user,
          cartId,
          abandonedCart,
          channel,
          reminderNumber,
          offerDiscount
        );
        if (success) anySuccess = true;
      }

      // Update reminder count and last reminder time
      await AbandonedCartModel.findByIdAndUpdate(abandonedCart._id, {
        $inc: { reminderCount: 1 },
        lastReminderSent: new Date(),
      });

      // Record engagement action
      await this.recordEngagementAction(
        userId,
        channels[0],
        'cart_reminder',
        `Reminder ${reminderNumber} for cart ${cartId}`,
        anySuccess,
        { cartId, reminderNumber, discount: offerDiscount }
      );

      logger.info('[AbandonedCartAutomation] Reminder processed', {
        cartId,
        reminderNumber,
        channels,
        success: anySuccess,
      });
    } catch (error) {
      logger.error('[AbandonedCartAutomation] Failed to process reminder', {
        jobId: job.id,
        cartId,
        error: error.message,
      });
      throw error; // Re-throw to trigger retry
    }
  }

  /**
   * Check if cart was already converted to an order
   */
  private async checkIfCartConverted(cartId: string): Promise<{ converted: boolean; orderId?: string }> {
    try {
      // Try to call order service
      const response = await axios.get(
        `${config.services.order}/api/v1/orders/cart/${cartId}`,
        { timeout: 3000 }
      );
      if (response.data?.order) {
        return { converted: true, orderId: response.data.order.id };
      }
    } catch {
      // Order service not available or no order found - cart not converted
    }
    return { converted: false };
  }

  /**
   * Get enabled notification channels for user
   */
  private getEnabledChannels(prefs): RecommendedChannel[] {
    const channels: RecommendedChannel[] = [];
    if (prefs.whatsapp) channels.push('whatsapp');
    if (prefs.push) channels.push('push');
    if (prefs.sms) channels.push('sms');
    if (prefs.email) channels.push('email');
    return channels.length > 0 ? channels : ['push'];
  }

  /**
   * Send reminder notification via specified channel
   */
  private async sendReminderNotification(
    userId: string,
    user: { email?: string; phone?: string; name?: string; notificationPrefs?: RecommendedChannel[] },
    cartId: string,
    cart: AbandonedCart,
    channel: RecommendedChannel,
    reminderNumber: number,
    discount?: number
  ): Promise<boolean> {
    const cartSummary = this.formatCartSummary(cart.items);

    switch (channel) {
      case 'push':
        return this.sendPushReminder(userId, cartId, cart, reminderNumber, discount);

      case 'whatsapp':
        if (!user.phone) return false;
        return this.sendWhatsAppReminder(user.phone, cartId, cart, reminderNumber, discount);

      case 'email':
        if (!user.email) return false;
        return this.sendEmailReminder(user.email, user.name, cartId, cart, reminderNumber, discount);

      case 'sms':
        if (!user.phone) return false;
        return this.sendSMSReminder(user.phone, cartId, discount);

      default:
        return false;
    }
  }

  /**
   * Send push notification reminder
   */
  private async sendPushReminder(
    userId: string,
    cartId: string,
    cart: AbandonedCart,
    reminderNumber: number,
    discount?: number
  ): Promise<boolean> {
    let title: string;
    let body: string;

    if (reminderNumber === 1 && discount === 0) {
      title = 'Complete your order';
      body = `Don't forget your cart! ${this.formatCartSummaryShort(cart.items)}`;
    } else if (discount && discount > 0) {
      title = `${discount}% off your order!`;
      body = `Complete your purchase and save ${discount}% - limited time offer!`;
    } else {
      title = 'Your cart is waiting';
      body = `Complete your purchase now!`;
    }

    const result = await this.notificationClient.sendPush(userId, title, body, {
      cartId,
      totalValue: cart.totalValue,
      itemCount: cart.items.length,
      action: 'open_cart',
    });

    return result.success;
  }

  /**
   * Send WhatsApp reminder
   */
  private async sendWhatsAppReminder(
    phone: string,
    cartId: string,
    cart: AbandonedCart,
    reminderNumber: number,
    discount?: number
  ): Promise<boolean> {
    const firstItem = cart.items[0]?.name || 'your items';
    const itemCount = cart.items.length;

    let message: string;
    if (discount && discount > 0) {
      message = `Hi! Your cart is waiting with ${itemCount} item${itemCount > 1 ? 's' : ''}. Complete your order and get ${discount}% off! This offer expires in 2 hours.`;
    } else {
      message = `Hi! Don't forget about ${firstItem}${itemCount > 1 ? ` and ${itemCount - 1} other item${itemCount > 2 ? 's' : ''}` : ''} in your cart. Complete your purchase now!`;
    }

    const result = await this.notificationClient.sendWhatsApp(phone, 'abandoned_cart_reminder', {
      '1': firstItem,
      '2': cart.totalValue.toFixed(2),
      '3': discount ? `${discount}%` : '0',
    });

    return result.success;
  }

  /**
   * Send email reminder
   */
  private async sendEmailReminder(
    email: string,
    name: string | undefined,
    cartId: string,
    cart: AbandonedCart,
    reminderNumber: number,
    discount?: number
  ): Promise<boolean> {
    let subject: string;
    if (discount && discount > 0) {
      subject = `${discount}% Off Your Cart - Complete Your Order!`;
    } else {
      subject = 'Complete Your Purchase - Items Still Available';
    }

    const result = await this.notificationClient.sendEmail(email, subject, 'abandoned-cart-reminder', {
      name: name || 'Valued Customer',
      cartId,
      items: cart.items,
      totalValue: cart.totalValue,
      discount: discount || 0,
      reminderNumber,
    });

    return result.success;
  }

  /**
   * Send SMS reminder
   */
  private async sendSMSReminder(phone: string, cartId: string, discount?: number): Promise<boolean> {
    let message: string;
    if (discount && discount > 0) {
      message = `ReZ: Complete your order and get ${discount}% off! Your cart items are waiting. Act fast - offer expires soon!`;
    } else {
      message = `ReZ: Don't forget your cart! Complete your order now.`;
    }

    // Use notification client for SMS
    try {
      const response = await axios.post(
        `${config.services.notification}/api/v1/notifications/sms/send`,
        {
          phone,
          message,
          source: 'abandoned_cart_automation',
        },
        { timeout: 5000 }
      );
      return response.data?.success === true;
    } catch {
      return false;
    }
  }

  /**
   * Format cart items for display
   */
  private formatCartSummary(items: CartItem[]): string {
    if (items.length === 0) return 'your items';
    if (items.length === 1) return items[0].name || '1 item';
    if (items.length === 2) {
      return `${items[0].name || 'item'} and ${items[1].name || '1 item'}`;
    }
    return `${items[0].name || 'item'} and ${items.length - 1} other items`;
  }

  /**
   * Format cart items summary (short)
   */
  private formatCartSummaryShort(items: CartItem[]): string {
    if (items.length === 0) return 'your items';
    if (items.length === 1) return `${items[0].name || 'item'} in your cart`;
    return `${items.length} items in your cart`;
  }

  /**
   * Record that a reminder was skipped
   */
  private async recordReminderSkipped(
    cartId: string,
    reminderNumber: number,
    reason: string
  ): Promise<void> {
    await EngagementActionModel.create({
      userId: '', // Will be filled from cart
      channel: 'system',
      actionType: `reminder_skipped_${reason}`,
      message: `Reminder ${reminderNumber} skipped: ${reason}`,
      sentAt: new Date(),
      delivered: false,
    });
  }

  /**
   * Record engagement action
   */
  private async recordEngagementAction(
    userId: string,
    channel: RecommendedChannel,
    actionType: string,
    message: string,
    success: boolean,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await EngagementActionModel.create({
      userId,
      channel,
      actionType,
      message,
      sentAt: new Date(),
      delivered: success,
      metadata,
    });
  }

  /**
   * Process checkout job (called when user completes checkout)
   */
  private async processCheckoutJob(job: Job<{ userId: string; cartId: string }>): Promise<void> {
    const { userId, cartId } = job.data;

    await this.markCartRecovered(userId, cartId);
    await this.cancelPendingReminders(cartId);

    logger.info('[AbandonedCartAutomation] Cart recovered', { cartId });
  }

  /**
   * Mark a cart as recovered
   */
  async markCartRecovered(userId: string, cartId: string): Promise<void> {
    await AbandonedCartModel.findOneAndUpdate(
      { cartId },
      {
        recovered: true,
        recoveredAt: new Date(),
      }
    );

    // Update lead score
    try {
      await this.notifyLeadIntelligence(userId, 'cart_recovered', { cartId });
    } catch {
      // Non-critical
    }
  }

  /**
   * Cancel all pending reminders for a cart
   */
  async cancelPendingReminders(cartId: string): Promise<void> {
    const reminderQueue = this.queues.get(QUEUE_NAMES.CART_REMINDER);
    if (!reminderQueue) return;

    // Get all jobs for this cart
    const jobs = await reminderQueue.getJobs([
      'waiting',
      'delayed',
      'active',
    ]);

    for (const job of jobs) {
      if (job.data.cartId === cartId) {
        await job.remove();
        logger.debug('[AbandonedCartAutomation] Cancelled reminder', {
          cartId,
          reminderNumber: job.data.reminderNumber,
        });
      }
    }
  }

  /**
   * Notify lead intelligence service of events
   */
  private async notifyLeadIntelligence(
    userId: string,
    eventType: string,
    data: Record<string, unknown>
  ): Promise<void> {
    try {
      await axios.post(
        `${config.services.intent}/api/v1/webhook/lead/signal`,
        {
          eventType,
          userId,
          timestamp: new Date().toISOString(),
          data,
          source: 'abandoned_cart_automation',
        },
        { timeout: 5000 }
      );
    } catch (error) {
      logger.warn('[AbandonedCartAutomation] Failed to notify lead intelligence', {
        error: error.message,
      });
    }
  }

  /**
   * Trigger checkout tracking (called from checkout service)
   */
  async triggerCheckoutTracking(userId: string, cartId: string): Promise<void> {
    const checkoutQueue = this.queues.get(QUEUE_NAMES.CART_CHECKOUT);
    if (!checkoutQueue) return;

    await checkoutQueue.add(
      'checkout',
      { userId, cartId },
      {
        jobId: `checkout-${cartId}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      }
    );
  }

  /**
   * Get abandoned cart stats for a merchant/user
   */
  async getStats(userId?: string): Promise<AbandonedCartStats> {
    const matchStage: Record<string, unknown> = {};
    if (userId) {
      matchStage.userId = userId;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalCarts: { $sum: 1 },
          recoveredCarts: {
            $sum: { $cond: ['$recovered', 1, 0] },
          },
          totalValue: { $sum: '$totalValue' },
          recoveredValue: {
            $sum: {
              $cond: ['$recovered', '$totalValue', 0],
            },
          },
          totalReminders: { $sum: '$reminderCount' },
          avgItemCount: { $avg: { $size: '$items' } },
        },
      },
    ];

    const result = await AbandonedCartModel.aggregate(pipeline);

    if (result.length === 0) {
      return {
        totalCarts: 0,
        recoveredCarts: 0,
        recoveryRate: 0,
        totalValue: 0,
        recoveredValue: 0,
        totalReminders: 0,
        avgItemCount: 0,
        byDay: [],
      };
    }

    const stats = result[0];
    const recoveryRate = stats.totalCarts > 0
      ? (stats.recoveredCarts / stats.totalCarts) * 100
      : 0;

    // Get daily breakdown
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyStats = await AbandonedCartModel.aggregate([
      {
        $match: {
          ...matchStage,
          abandonedAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$abandonedAt' },
          },
          carts: { $sum: 1 },
          recovered: { $sum: { $cond: ['$recovered', 1, 0] } },
          value: { $sum: '$totalValue' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      totalCarts: stats.totalCarts,
      recoveredCarts: stats.recoveredCarts,
      recoveryRate: Math.round(recoveryRate * 100) / 100,
      totalValue: stats.totalValue,
      recoveredValue: stats.recoveredValue,
      totalReminders: stats.totalReminders,
      avgItemCount: Math.round(stats.avgItemCount * 100) / 100,
      byDay: dailyStats.map((d) => ({
        date: d._id,
        carts: d.carts,
        recovered: d.recovered,
        value: d.value,
      })),
    };
  }

  /**
   * Get all active (unrecovered) abandoned carts
   */
  async getActiveCarts(userId?: string, limit = 100, offset = 0): Promise<AbandonedCart[]> {
    const query: Record<string, unknown> = {
      recovered: false,
      expiresAt: { $gt: new Date() },
    };

    if (userId) {
      query.userId = userId;
    }

    return AbandonedCartModel.find(query)
      .sort({ abandonedAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean() as unknown as AbandonedCart[];
  }

  /**
   * Get a specific abandoned cart
   */
  async getCart(cartId: string): Promise<AbandonedCart | null> {
    return AbandonedCartModel.findOne({ cartId }).lean() as unknown as AbandonedCart;
  }

  /**
   * Manually trigger a reminder for a cart
   */
  async sendManualReminder(
    cartId: string,
    channel: RecommendedChannel,
    customMessage?: string
  ): Promise<{ success: boolean; message: string }> {
    const cart = await AbandonedCartModel.findOne({ cartId });
    if (!cart) {
      return { success: false, message: 'Cart not found' };
    }

    if (cart.recovered) {
      return { success: false, message: 'Cart already recovered' };
    }

    const user = await this.profileClient.getUser(cart.userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const success = await this.sendReminderNotification(
      cart.userId,
      user,
      cartId,
      cart,
      channel,
      cart.reminderCount + 1,
      0 // No discount for manual reminders
    );

    if (success) {
      await AbandonedCartModel.findByIdAndUpdate(cart._id, {
        $inc: { reminderCount: 1 },
        lastReminderSent: new Date(),
      });
    }

    return {
      success,
      message: success ? 'Reminder sent successfully' : 'Failed to send reminder',
    };
  }

  /**
   * Clean up expired carts
   */
  async cleanupExpiredCarts(): Promise<number> {
    const result = await AbandonedCartModel.deleteMany({
      expiresAt: { $lt: new Date() },
      recovered: false,
    });

    logger.info('[AbandonedCartAutomation] Cleaned up expired carts', {
      deletedCount: result.deletedCount,
    });

    return result.deletedCount;
  }

  /**
   * Get queue health status
   */
  async getQueueHealth(): Promise<{
    reminderQueue: { waiting: number; active: number; completed: number; failed: number };
    checkoutQueue: { waiting: number; active: number; completed: number; failed: number };
  }> {
    const getQueueStats = async (queueName: string) => {
      const queue = this.queues.get(queueName);
      if (!queue) {
        return { waiting: 0, active: 0, completed: 0, failed: 0 };
      }

      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
      ]);

      return { waiting, active, completed, failed };
    };

    const [reminderStats, checkoutStats] = await Promise.all([
      getQueueStats(QUEUE_NAMES.CART_REMINDER),
      getQueueStats(QUEUE_NAMES.CART_CHECKOUT),
    ]);

    return {
      reminderQueue: reminderStats,
      checkoutQueue: checkoutStats,
    };
  }
}

// ============================================================================
// Export Singleton
// ============================================================================

export const abandonedCartAutomationService = new AbandonedCartAutomationService();
export default abandonedCartAutomationService;
