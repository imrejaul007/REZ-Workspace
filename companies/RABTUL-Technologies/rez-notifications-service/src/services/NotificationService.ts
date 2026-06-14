import logger from './utils/logger';

/**
 * Notification Service
 *
 * Core notification processing and delivery
 */

import { v4 as uuidv4 } from 'uuid';
import { Notification, NotificationChannel, NotificationStatus, PushNotification } from '../models/Notification';
import { NotificationPreferences } from '../models/NotificationPreferences';
import { PushService } from './PushService';
import { EmailService } from './EmailService';
import { SMSService } from './SMSService';
import { redis } from '../config/redis';

export class NotificationService {
  private pushService: PushService;
  private emailService: EmailService;
  private smsService: SMSService;

  constructor() {
    this.pushService = new PushService();
    this.emailService = new EmailService();
    this.smsService = new SMSService();
  }

  async initialize(): Promise<void> {
    logger.info('Notification Service initialized');
  }

  /**
   * Send notification to user
   */
  async send(params: {
    userId: string;
    type: string;
    channel: NotificationChannel | NotificationChannel[];
    title: string;
    body: string;
    data?: Record<string, unknown>;
    priority?: 'high' | 'normal' | 'low';
  }): Promise<string[]> {
    const { userId, type, channel, title, body, data, priority = 'normal' } = params;

    const channels = Array.isArray(channel) ? channel : [channel];
    const results: string[] = [];

    // Get user preferences
    const preferences = await this.getUserPreferences(userId);

    for (const ch of channels) {
      // Check if user has opted in
      if (!preferences?.channels?.[ch]) {
        continue;
      }

      // Create notification record
      const notification = await Notification.create({
        userId,
        type,
        channel: ch,
        title,
        body,
        data,
        status: 'pending',
        priority,
        sentAt: new Date(),
      });

      // Send via appropriate channel
      try {
        await this.sendViaChannel(ch, notification, preferences);
        notification.status = 'sent';
        await notification.save();
        results.push(notification.id);
      } catch (error) {
        console.error(`Failed to send via ${ch}:`, error);
        notification.status = 'failed';
        notification.error = (error as Error).message;
        await notification.save();
      }
    }

    return results;
  }

  /**
   * Send via specific channel
   */
  private async sendViaChannel(
    channel: NotificationChannel,
    notification,
    preferences: NotificationPreferences
  ): Promise<void> {
    switch (channel) {
      case 'push':
        await this.pushService.send({
          token: preferences.pushToken,
          notification: {
            title: notification.title,
            body: notification.body,
            data: notification.data,
          },
        });
        break;

      case 'email':
        await this.emailService.send({
          to: preferences.email,
          subject: notification.title,
          html: `<p>${notification.body}</p>`,
        });
        break;

      case 'sms':
        await this.smsService.send({
          to: preferences.phone,
          message: notification.body,
        });
        break;

      case 'inApp':
        // Store in Redis for in-app retrieval
        await redis.lpush(`notifications:${notification.userId}`, JSON.stringify(notification));
        await redis.ltrim(`notifications:${notification.userId}`, 0, 99);
        break;
    }
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences | null> {
    return NotificationPreferences.findOne({ userId });
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    return NotificationPreferences.findOneAndUpdate(
      { userId },
      { $set: preferences },
      { upsert: true, new: true }
    );
  }

  /**
   * Get user's notifications
   */
  async getUserNotifications(
    userId: string,
    options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
  ): Promise<unknown[]> {
    const { limit = 20, offset = 0, unreadOnly = false } = options;

    const query: unknown = { userId };
    if (unreadOnly) {
      query.readAt = { $exists: false };
    }

    return Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await Notification.findByIdAndUpdate(notificationId, { readAt: new Date() });
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany(
      { userId, readAt: { $exists: false } },
      { readAt: new Date() }
    );
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({ userId, readAt: { $exists: false } });
  }

  /**
   * Send loyalty-related notification
   */
  async sendLoyaltyNotification(params: {
    userId: string;
    type: 'streak_milestone' | 'tier_upgrade' | 'badge_earned' | 'points_expiry' | 'churn_risk';
    data: Record<string, unknown>;
  }): Promise<void> {
    const { userId, type, data } = params;

    const templates: Record<string, { title: string; body: string }> = {
      streak_milestone: {
        title: '🔥 Streak Milestone!',
        body: `Congratulations! You've reached a ${data.streakDays}-day streak!`,
      },
      tier_upgrade: {
        title: '⭐ Tier Upgraded!',
        body: `You've been upgraded to ${data.newTier}! Enjoy exclusive benefits.`,
      },
      badge_earned: {
        title: '🏆 Badge Earned!',
        body: `You've earned the ${data.badgeName} badge!`,
      },
      points_expiry: {
        title: '⏰ Points Expiring Soon',
        body: `${data.points} points will expire in ${data.daysRemaining} days.`,
      },
      churn_risk: {
        title: 'We Miss You!',
        body: "It's been a while since your last visit. Here's a special offer!",
      },
    };

    const template = templates[type];
    if (!template) return;

    await this.send({
      userId,
      type,
      channel: ['push', 'inApp'],
      title: template.title,
      body: template.body,
      data,
      priority: type === 'churn_risk' ? 'high' : 'normal',
    });
  }
}
