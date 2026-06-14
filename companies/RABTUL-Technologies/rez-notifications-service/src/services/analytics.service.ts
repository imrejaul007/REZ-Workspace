import { database } from './database';
import {
  NotificationAnalytics,
  ChannelAnalytics,
  NotificationChannel,
} from '../types';

export class AnalyticsService {
  async getAnalytics(options?: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    channel?: NotificationChannel;
  }): Promise<NotificationAnalytics> {
    const whereConditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (options?.startDate) {
      whereConditions.push(`created_at >= $${paramIndex++}`);
      params.push(options.startDate);
    }

    if (options?.endDate) {
      whereConditions.push(`created_at <= $${paramIndex++}`);
      params.push(options.endDate);
    }

    if (options?.userId) {
      whereConditions.push(`user_id = $${paramIndex++}`);
      params.push(options.userId);
    }

    if (options?.channel) {
      whereConditions.push(`channel = $${paramIndex++}`);
      params.push(options.channel);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

    // Get overall stats
    const overallQuery = `
      SELECT
        COUNT(*) FILTER (WHERE status IN ('sent', 'delivered', 'read')) as total_sent,
        COUNT(*) FILTER (WHERE status = 'delivered') as total_delivered,
        COUNT(*) FILTER (WHERE status = 'read') as total_read,
        COUNT(*) FILTER (WHERE status = 'failed') as total_failed
      FROM notifications
      ${whereClause}
    `;

    const overallResult = await database.query<{
      total_sent: string;
      total_delivered: string;
      total_read: string;
      total_failed: string;
    }>(overallQuery, params);

    const { total_sent, total_delivered, total_read, total_failed } = overallResult.rows[0];

    // Get channel-specific stats
    const channelQuery = `
      SELECT
        channel,
        COUNT(*) FILTER (WHERE status IN ('sent', 'delivered', 'read')) as sent,
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
        COUNT(*) FILTER (WHERE status = 'read') as read,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status = 'bounced') as bounced
      FROM notifications
      ${whereClause}
      GROUP BY channel
    `;

    const channelResult = await database.query<{
      channel: NotificationChannel;
      sent: string;
      delivered: string;
      read: string;
      failed: string;
      bounced: string;
    }>(channelQuery, params);

    const byChannel: Record<NotificationChannel, ChannelAnalytics> = {
      email: this.emptyChannelAnalytics(),
      sms: this.emptyChannelAnalytics(),
      whatsapp: this.emptyChannelAnalytics(),
      push: this.emptyChannelAnalytics(),
    };

    for (const row of channelResult.rows) {
      const sent = parseInt(row.sent, 10);
      const delivered = parseInt(row.delivered, 10);
      const read = parseInt(row.read, 10);
      const failed = parseInt(row.failed, 10);
      const bounced = parseInt(row.bounced, 10);

      byChannel[row.channel] = {
        sent,
        delivered,
        read,
        failed,
        bounceRate: sent > 0 ? (bounced / sent) * 100 : 0,
      };
    }

    const totalSent = parseInt(total_sent, 10);
    const totalDelivered = parseInt(total_delivered, 10);
    const totalRead = parseInt(total_read, 10);

    return {
      totalSent,
      totalDelivered,
      totalRead,
      totalFailed: parseInt(total_failed, 10),
      deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
      readRate: totalDelivered > 0 ? (totalRead / totalDelivered) * 100 : 0,
      byChannel,
    };
  }

  async getUserAnalytics(userId: string): Promise<NotificationAnalytics> {
    return this.getAnalytics({ userId });
  }

  async getChannelAnalytics(
    channel: NotificationChannel
  ): Promise<ChannelAnalytics> {
    const analytics = await this.getAnalytics({ channel });
    return analytics.byChannel[channel];
  }

  async getTemplatePerformance(templateId: string): Promise<{
    totalSent: number;
    deliveryRate: number;
    readRate: number;
    byChannel: Record<NotificationChannel, number>;
  }> {
    const query = `
      SELECT
        channel,
        COUNT(*) as total
      FROM notifications
      WHERE template_id = $1
        AND status IN ('sent', 'delivered', 'read')
      GROUP BY channel
    `;

    const result = await database.query<{
      channel: NotificationChannel;
      total: string;
    }>(query, [templateId]);

    const analytics = await this.getAnalytics();
    const byChannel: Record<NotificationChannel, number> = {
      email: 0,
      sms: 0,
      whatsapp: 0,
      push: 0,
    };

    let totalSent = 0;

    for (const row of result.rows) {
      const count = parseInt(row.total, 10);
      byChannel[row.channel] = count;
      totalSent += count;
    }

    return {
      totalSent,
      deliveryRate: analytics.deliveryRate,
      readRate: analytics.readRate,
      byChannel,
    };
  }

  async getHourlyDistribution(options?: {
    startDate?: Date;
    endDate?: Date;
    channel?: NotificationChannel;
  }): Promise<Array<{ hour: number; count: number }>> {
    const whereConditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (options?.startDate) {
      whereConditions.push(`created_at >= $${paramIndex++}`);
      params.push(options.startDate);
    }

    if (options?.endDate) {
      whereConditions.push(`created_at <= $${paramIndex++}`);
      params.push(options.endDate);
    }

    if (options?.channel) {
      whereConditions.push(`channel = $${paramIndex++}`);
      params.push(options.channel);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

    const query = `
      SELECT
        EXTRACT(HOUR FROM created_at)::INTEGER as hour,
        COUNT(*) as count
      FROM notifications
      ${whereClause}
      GROUP BY hour
      ORDER BY hour
    `;

    const result = await database.query<{ hour: number; count: string }>(
      query,
      params
    );

    return result.rows.map((row) => ({
      hour: row.hour,
      count: parseInt(row.count, 10),
    }));
  }

  async getRecentActivity(
    limit: number = 50
  ): Promise<Array<{
    id: string;
    channel: NotificationChannel;
    status: string;
    createdAt: Date;
  }>> {
    const result = await database.query<{
      id: string;
      channel: NotificationChannel;
      status: string;
      created_at: string;
    }>(
      `SELECT id, channel, status, created_at
       FROM notifications
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map((row) => ({
      id: row.id,
      channel: row.channel,
      status: row.status,
      createdAt: new Date(row.created_at),
    }));
  }

  private emptyChannelAnalytics(): ChannelAnalytics {
    return {
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      bounceRate: 0,
    };
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
