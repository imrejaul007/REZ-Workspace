import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface TrackEventDto {
  eventName: string;
  userId?: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

export interface NotificationDeliveryLogDto {
  eventType: string;
  userId: string;
  orderId?: string;
  notificationId?: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
}

export interface NotificationAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  deliveryRate: number;
  openRate: number;
  byEventType: Record<string, {
    sent: number;
    delivered: number;
    read: number;
  }>;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Track a custom analytics event
   */
  async trackEvent(eventName: string, properties?: Record<string, any>): Promise<void> {
    try {
      await this.prisma.analyticsEvent.create({
        data: {
          eventName,
          properties: properties ? JSON.stringify(properties) : null,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to track event: ${eventName}`, error);
    }
  }

  /**
   * Log notification delivery for analytics
   */
  async logNotificationDelivery(dto: NotificationDeliveryLogDto): Promise<void> {
    try {
      await this.prisma.notificationDeliveryLog.create({
        data: {
          eventType: dto.eventType,
          userId: dto.userId,
          orderId: dto.orderId,
          notificationId: dto.notificationId,
          status: dto.status || 'sent',
          sentAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log notification delivery`, error);
    }
  }

  /**
   * Update notification delivery status
   */
  async updateDeliveryStatus(
    notificationId: string,
    status: 'delivered' | 'read' | 'failed',
    error?: string,
  ): Promise<void> {
    try {
      await this.prisma.notificationDeliveryLog.updateMany({
        where: { notificationId },
        data: {
          status,
          deliveredAt: status === 'delivered' ? new Date() : undefined,
          readAt: status === 'read' ? new Date() : undefined,
          error,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to update delivery status for ${notificationId}`, error);
    }
  }

  /**
   * Get notification analytics summary
   */
  async getNotificationAnalytics(options: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    eventType?: string;
  }): Promise<NotificationAnalytics> {
    const { startDate, endDate, userId, eventType } = options;

    const where: any = {};
    if (startDate || endDate) {
      where.sentAt = {};
      if (startDate) where.sentAt.gte = startDate;
      if (endDate) where.sentAt.lte = endDate;
    }
    if (userId) where.userId = userId;
    if (eventType) where.eventType = eventType;

    // Get all logs in the time range
    const logs = await this.prisma.notificationDeliveryLog.findMany({
      where,
    });

    // Calculate metrics
    const totalSent = logs.length;
    const totalDelivered = logs.filter((l) => l.status === 'delivered' || l.status === 'read').length;
    const totalRead = logs.filter((l) => l.status === 'read').length;

    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const openRate = totalDelivered > 0 ? (totalRead / totalDelivered) * 100 : 0;

    // Group by event type
    const byEventType: Record<string, { sent: number; delivered: number; read: number }> = {};
    for (const log of logs) {
      if (!byEventType[log.eventType]) {
        byEventType[log.eventType] = { sent: 0, delivered: 0, read: 0 };
      }
      byEventType[log.eventType].sent++;
      if (log.status === 'delivered' || log.status === 'read') {
        byEventType[log.eventType].delivered++;
      }
      if (log.status === 'read') {
        byEventType[log.eventType].read++;
      }
    }

    return {
      totalSent,
      totalDelivered,
      totalRead,
      deliveryRate,
      openRate,
      byEventType,
    };
  }

  /**
   * Get analytics events with pagination
   */
  async getEvents(options: {
    limit?: number;
    offset?: number;
    eventName?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ events: any[]; total: number }> {
    const { limit = 100, offset = 0, eventName, startDate, endDate } = options;

    const where: any = {};
    if (eventName) where.eventName = eventName;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [events, total] = await Promise.all([
      this.prisma.analyticsEvent.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.analyticsEvent.count({ where }),
    ]);

    // Parse JSON properties
    const parsedEvents = events.map((e) => ({
      ...e,
      properties: e.properties ? JSON.parse(e.properties as string) : null,
    }));

    return { events: parsedEvents, total };
  }

  /**
   * Get notification delivery logs
   */
  async getDeliveryLogs(options: {
    limit?: number;
    offset?: number;
    userId?: string;
    status?: string;
    eventType?: string;
  }): Promise<{ logs: any[]; total: number }> {
    const { limit = 100, offset = 0, userId, status, eventType } = options;

    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (eventType) where.eventType = eventType;

    const [logs, total] = await Promise.all([
      this.prisma.notificationDeliveryLog.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.notificationDeliveryLog.count({ where }),
    ]);

    return { logs, total };
  }
}
