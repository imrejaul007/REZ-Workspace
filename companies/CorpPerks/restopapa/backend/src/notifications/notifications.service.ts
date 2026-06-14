import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType, NotificationJob } from './notification.processor';

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type: string;
  data?: Record<string, any>;
  actionUrl?: string;
}

export interface NotificationDeliveryResult {
  notificationId: string;
  userId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
  error?: string;
}

export interface QueueJobResult {
  jobId: number | string;
  status: 'queued' | 'failed';
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('notifications') private notificationQueue: Queue<NotificationJob>,
  ) {}

  /**
   * Create a new notification for a user
   */
  async createNotification(dto: CreateNotificationDto): Promise<string> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        title: dto.title,
        message: dto.message,
        type: dto.type,
        actionUrl: dto.actionUrl,
        isRead: false,
      },
    });

    this.logger.log(`Created notification ${notification.id} for user ${dto.userId}`);
    return notification.id;
  }

  /**
   * Send notification via queue with retry logic
   * Uses Bull queue for reliable delivery with exponential backoff
   */
  async sendViaQueue(
    type: NotificationType,
    userId: string,
    title: string,
    message: string,
    options: {
      data?: Record<string, any>;
      actionUrl?: string;
      notificationId?: string;
    } = {},
  ): Promise<QueueJobResult> {
    const jobName = 'send';

    try {
      const job = await this.notificationQueue.add(
        jobName,
        {
          type,
          userId,
          title,
          message,
          data: options.data,
          actionUrl: options.actionUrl,
          notificationId: options.notificationId,
        },
        {
          // Retry configuration
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000, // Start at 1 second, then 2s, 4s, etc.
          },
          // Job removal settings
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: false, // Keep failed jobs for debugging
          // Job options
          jobId: options.notificationId
            ? `notif-${options.notificationId}-${type}`
            : undefined,
        },
      );

      this.logger.log(
        `Queued ${type} notification job ${job.id} for user ${userId}`,
      );

      return {
        jobId: job.id,
        status: 'queued',
      };
    } catch (error) {
      this.logger.error(
        `Failed to queue ${type} notification for user ${userId}`,
        error instanceof Error ? error.stack : undefined,
      );
      return {
        jobId: -1,
        status: 'failed',
      };
    }
  }

  /**
   * Send push notification to a user via queue
   */
  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<NotificationDeliveryResult> {
    try {
      // Create in-app notification
      const notificationId = await this.createNotification({
        userId,
        title,
        message: body,
        type: 'push',
        data,
      });

      // Queue push notification for delivery
      await this.sendViaQueue(
        NotificationType.PUSH,
        userId,
        title,
        body,
        { data, notificationId },
      );

      this.logger.log(`Push notification ${notificationId} queued for user ${userId}`);

      return {
        notificationId,
        userId,
        status: 'sent',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to send push notification to ${userId}`, error);
      return {
        notificationId: '',
        userId,
        status: 'failed',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send email notification to a user via queue
   */
  async sendEmailNotification(
    userId: string,
    title: string,
    message: string,
    data?: Record<string, any>,
  ): Promise<NotificationDeliveryResult> {
    try {
      const notificationId = await this.createNotification({
        userId,
        title,
        message,
        type: 'email',
        data,
      });

      await this.sendViaQueue(
        NotificationType.EMAIL,
        userId,
        title,
        message,
        { data, notificationId },
      );

      return {
        notificationId,
        userId,
        status: 'sent',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to send email notification to ${userId}`, error);
      return {
        notificationId: '',
        userId,
        status: 'failed',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send SMS notification to a user via queue
   */
  async sendSmsNotification(
    userId: string,
    message: string,
    data?: Record<string, any>,
  ): Promise<NotificationDeliveryResult> {
    try {
      const notificationId = await this.createNotification({
        userId,
        title: 'SMS',
        message,
        type: 'sms',
        data,
      });

      await this.sendViaQueue(
        NotificationType.SMS,
        userId,
        'SMS',
        message,
        { data, notificationId },
      );

      return {
        notificationId,
        userId,
        status: 'sent',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to send SMS notification to ${userId}`, error);
      return {
        notificationId: '',
        userId,
        status: 'failed',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    options: { limit?: number; offset?: number; unreadOnly?: boolean } = {},
  ): Promise<{ notifications: any[]; total: number }> {
    const { limit = 20, offset = 0, unreadOnly = false } = options;

    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { notifications, total };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return result.count;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Register device token for push notifications
   */
  async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android',
    deviceInfo?: Record<string, any>,
  ): Promise<void> {
    await this.prisma.pushToken.upsert({
      where: {
        userId_token: {
          userId,
          token,
        },
      },
      create: {
        userId,
        token,
        platform,
        deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
        isActive: true,
      },
      update: {
        platform,
        deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
        isActive: true,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Unregister device token
   */
  async unregisterDeviceToken(token: string): Promise<void> {
    await this.prisma.pushToken.updateMany({
      where: { token },
      data: { isActive: false },
    });
  }

  /**
   * Get active device tokens for a user
   */
  async getUserDeviceTokens(userId: string): Promise<any[]> {
    const tokens = await this.prisma.pushToken.findMany({
      where: { userId, isActive: true },
    });

    return tokens.map((t) => ({
      ...t,
      deviceInfo: t.deviceInfo ? JSON.parse(t.deviceInfo as string) : null,
    }));
  }
}
