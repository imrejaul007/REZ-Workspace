import { v4 as uuidv4 } from 'uuid';
import { Notification, INotification, NotificationType, DeliveryStatus } from '../models';
import { rabtulNotificationService, RABTULNotificationPayload } from './rabtulNotificationService';
import { notificationPreferenceService } from './preferenceService';
import { templateService } from './templateService';

// ==================== TYPES ====================

export interface SendNotificationInput {
  userId: string;
  companyId: string;
  title: string;
  body: string;
  type: NotificationType;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  data?: Record<string, unknown>;
  imageUrl?: string;
  deepLink?: string;
  channels?: ('push' | 'in_app' | 'email' | 'sms')[];
  scheduledAt?: Date;
  expiresAt?: Date;
  templateId?: string;
  templateVariables?: Record<string, string>;
}

export interface GetNotificationsInput {
  userId: string;
  companyId: string;
  page?: number;
  limit?: number;
  type?: NotificationType;
  read?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  recentActivity: { date: string; count: number }[];
}

/**
 * Notification Service - Core notification management
 */
export class NotificationService {
  /**
   * Send a notification to a user
   */
  async send(input: SendNotificationInput): Promise<INotification> {
    const {
      userId,
      companyId,
      title,
      body,
      type,
      priority = 'normal',
      data,
      imageUrl,
      deepLink,
      channels = ['push', 'in_app'],
      scheduledAt,
      expiresAt,
      templateId,
      templateVariables,
    } = input;

    // Check user preferences before sending
    const preferences = await notificationPreferenceService.getPreferences(userId, companyId);
    if (preferences && !preferences.globalEnabled) {
      throw new Error('Notifications are disabled for this user');
    }

    // Check type-specific preferences
    const typePref = preferences?.typePreferences.find((tp) => tp.type === type);
    if (typePref && !typePref.enabled) {
      throw new Error(`Notification type '${type}' is disabled for this user`);
    }

    // Create notification record
    const notification = new Notification({
      notificationId: `notif_${uuidv4()}`,
      userId,
      companyId,
      title,
      body,
      type,
      priority,
      data,
      imageUrl,
      deepLink,
      channels,
      deliveryStatus: scheduledAt ? 'pending' : 'pending',
      read: false,
      scheduledAt,
      expiresAt,
      templateId,
      templateVariables,
    });

    await notification.save();

    // If not scheduled, send immediately
    if (!scheduledAt) {
      await this.deliverNotification(notification);
    }

    return notification;
  }

  /**
   * Send notification from a template
   */
  async sendFromTemplate(
    userId: string,
    companyId: string,
    templateId: string,
    variables: Record<string, string>,
    options?: Partial<Omit<SendNotificationInput, 'title' | 'body' | 'type' | 'templateId' | 'templateVariables'>>
  ): Promise<INotification> {
    const template = await templateService.getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    if (!template.isActive) {
      throw new Error(`Template is inactive: ${templateId}`);
    }

    // Validate required variables
    for (const variable of template.variables) {
      if (variable.required && !variables[variable.name]) {
        throw new Error(`Missing required variable: ${variable.name}`);
      }
    }

    // Replace template placeholders
    const title = this.interpolateTemplate(template.titleTemplate, variables);
    const body = this.interpolateTemplate(template.bodyTemplate, variables);

    // Update template usage
    await templateService.incrementUsage(templateId);

    return this.send({
      userId,
      companyId,
      title,
      body,
      type: template.type,
      priority: template.priority,
      channels: template.channels,
      deepLink: template.deepLinkTemplate ? this.interpolateTemplate(template.deepLinkTemplate, variables) : undefined,
      imageUrl: template.imageTemplate ? this.interpolateTemplate(template.imageTemplate, variables) : undefined,
      templateId,
      templateVariables: variables,
      ...options,
    });
  }

  /**
   * Deliver a notification through appropriate channels
   */
  async deliverNotification(notification: INotification): Promise<void> {
    const preferences = await notificationPreferenceService.getPreferences(
      notification.userId,
      notification.companyId
    );

    // Check quiet hours
    if (preferences) {
      const inQuietHours = this.isInQuietHours(preferences.channels);
      if (inQuietHours && notification.priority !== 'urgent') {
        // Reschedule for after quiet hours
        const afterQuietHours = this.getAfterQuietHoursTime(preferences.channels);
        if (afterQuietHours) {
          notification.scheduledAt = afterQuietHours;
          await notification.save();
          return;
        }
      }
    }

    // Send through each enabled channel
    for (const channel of notification.channels) {
      try {
        if (channel === 'push') {
          await this.sendPush(notification);
        } else if (channel === 'in_app') {
          // In-app notifications are already stored, just mark as delivered
          notification.deliveryStatus = 'delivered';
          notification.deliveredAt = new Date();
        } else if (channel === 'email' || channel === 'sms') {
          // Delegate to RABTUL for email/sms
          await this.sendViaRABTUL(notification, channel);
        }
      } catch (error) {
        logger.error(`Failed to deliver via ${channel}:`, error);
      }
    }

    notification.sentAt = new Date();
    if (notification.deliveryStatus !== 'failed') {
      notification.deliveryStatus = 'sent';
    }
    await notification.save();
  }

  /**
   * Send push notification via RABTUL
   */
  private async sendPush(notification: INotification): Promise<void> {
    const payload: RABTULNotificationPayload = {
      userId: notification.userId,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      imageUrl: notification.imageUrl,
      deepLink: notification.deepLink,
      priority: notification.priority,
      scheduledAt: notification.scheduledAt?.toISOString(),
      expiresAt: notification.expiresAt?.toISOString(),
    };

    const result = await rabtulNotificationService.sendPushNotification(payload);
    if (!result.success) {
      throw new Error(result.error || 'Push delivery failed');
    }
  }

  /**
   * Send via RABTUL email/sms
   */
  private async sendViaRABTUL(
    notification: INotification,
    channel: 'email' | 'sms'
  ): Promise<void> {
    const payload: RABTULNotificationPayload = {
      userId: notification.userId,
      title: notification.title,
      body: notification.body,
      data: notification.data,
    };

    const result = await rabtulNotificationService.sendViaChannel(
      notification.userId,
      channel,
      payload
    );

    if (!result.success) {
      logger.error(`Failed to send via ${channel}:`, result.error);
    }
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(input: GetNotificationsInput): Promise<{
    notifications: INotification[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    const {
      userId,
      companyId,
      page = 1,
      limit = 20,
      type,
      read,
      startDate,
      endDate,
    } = input;

    const query: Record<string, unknown> = {
      userId,
      companyId,
    };

    if (type) query.type = type;
    if (read !== undefined) query.read = read;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) (query.createdAt as Record<string, Date>).$gte = startDate;
      if (endDate) (query.createdAt as Record<string, Date>).$lte = endDate;
    }

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .then(docs => docs as unknown as INotification[]),
      Notification.countDocuments(query),
    ]);

    return {
      notifications,
      total,
      page,
      limit,
      hasMore: skip + notifications.length < total,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<INotification | null> {
    const notification = await Notification.findOneAndUpdate(
      { notificationId, userId },
      {
        read: true,
        readAt: new Date(),
        deliveryStatus: 'read',
      },
      { new: true }
    );

    if (notification) {
      notification.clickCount += 1;
      await notification.save();
    }

    return notification as unknown as INotification | null;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string, companyId: string): Promise<number> {
    const result = await Notification.updateMany(
      { userId, companyId, read: false },
      { read: true, readAt: new Date(), deliveryStatus: 'read' }
    );
    return result.modifiedCount;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const result = await Notification.deleteOne({ notificationId, userId });
    return result.deletedCount > 0;
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string, companyId: string): Promise<number> {
    return Notification.countDocuments({ userId, companyId, read: false });
  }

  /**
   * Get notification statistics
   */
  async getStats(userId: string, companyId: string): Promise<NotificationStats> {
    const [total, unread, byTypeResult, recentActivity] = await Promise.all([
      Notification.countDocuments({ userId, companyId }),
      Notification.countDocuments({ userId, companyId, read: false }),
      Notification.aggregate([
        { $match: { userId, companyId } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      Notification.aggregate([
        { $match: { userId, companyId, createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const byType: Record<string, number> = {};
    for (const item of byTypeResult) {
      byType[item._id] = item.count;
    }

    return {
      total,
      unread,
      byType,
      recentActivity: recentActivity.map((item) => ({
        date: item._id,
        count: item.count,
      })),
    };
  }

  /**
   * Interpolate template variables
   */
  private interpolateTemplate(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] || match);
  }

  /**
   * Check if current time is in quiet hours
   */
  private isInQuietHours(channels: { channel: string; quietHoursEnabled: boolean; quietHoursStart?: string; quietHoursEnd?: string }[]): boolean {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    for (const ch of channels) {
      if (ch.quietHoursEnabled && ch.quietHoursStart && ch.quietHoursEnd) {
        if (ch.quietHoursStart <= currentTime && currentTime <= ch.quietHoursEnd) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Get time after quiet hours
   */
  private getAfterQuietHoursTime(channels: { quietHoursEnabled: boolean; quietHoursEnd?: string }[]): Date | null {
    const now = new Date();
    for (const ch of channels) {
      if (ch.quietHoursEnabled && ch.quietHoursEnd) {
        const [hours, minutes] = ch.quietHoursEnd.split(':').map(Number);
        const afterQuiet = new Date(now);
        afterQuiet.setHours(hours, minutes, 0, 0);
        if (afterQuiet > now) {
          return afterQuiet;
        }
      }
    }
    return null;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
