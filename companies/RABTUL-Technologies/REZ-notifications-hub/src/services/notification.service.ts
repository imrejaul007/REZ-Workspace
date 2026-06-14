import { v4 as uuidv4 } from 'uuid';
import { database } from './database';
import { templateService } from './template.service';
import { preferencesService } from './preferences.service';
import { optOutService } from './optout.service';
import { adapterRegistry } from '../adapters';
import {
  Notification,
  NotificationPayload,
  NotificationStatus,
  NotificationChannel,
  BatchNotificationResult,
} from '../types';
import logger from '../utils/logger';
import { config } from '../config';
import { AppError, NotFoundError, ValidationError } from '../../shared/rez-errors/src/index.js';

export class NotificationService {
  async sendNotification(payload: NotificationPayload): Promise<Notification> {
    // Check for idempotency
    if (payload.idempotencyKey) {
      const existing = await this.getByIdempotencyKey(payload.idempotencyKey);
      if (existing) {
        logger.info('Returning existing notification for idempotency key', {
          idempotencyKey: payload.idempotencyKey,
          notificationId: existing.id,
        });
        return existing;
      }
    }

    // Get template
    const template = await templateService.getTemplateById(payload.templateId);
    if (!template) {
      throw new NotFoundError(`Template not found: ${payload.templateId}`);
    }

    // Validate variables
    const validation = templateService.validateVariables(template, payload.variables);
    if (!validation.valid) {
      throw new ValidationError(`Missing required variables: ${validation.missing.join(', ')}`);
    }

    // Create notification record
    const notification: Notification = {
      id: uuidv4(),
      userId: payload.recipient.userId || uuidv4(),
      channel: payload.recipient.channels[0], // Primary channel
      templateId: payload.templateId,
      status: 'pending',
      priority: payload.priority || 'normal',
      variables: payload.variables,
      renderedContent: templateService.renderTemplate(template, payload.variables),
      metadata: {
        ...payload.metadata,
        recipientEmail: payload.recipient.email,
        recipientPhone: payload.recipient.phone,
        deviceToken: payload.recipient.deviceToken,
      },
      attempts: 0,
      maxAttempts: config.notifications.maxAttempts,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Check opt-out status
    const isOptedOut = await optOutService.isOptedOut(
      notification.userId,
      notification.channel
    );

    if (isOptedOut) {
      notification.status = 'unsubscribed';
      await this.save(notification);
      logger.info('Notification skipped - user opted out', {
        notificationId: notification.id,
        channel: notification.channel,
      });
      return notification;
    }

    // Check preferences
    const canReceive = await preferencesService.canReceiveNotification(
      notification.userId,
      notification.channel,
      template.category
    );

    if (!canReceive.allowed) {
      notification.status = 'pending';
      notification.metadata.skipReason = canReceive.reason;
      await this.save(notification);
      logger.info('Notification deferred - preference check', {
        notificationId: notification.id,
        reason: canReceive.reason,
      });
      return notification;
    }

    // GDPR Marketing Consent Check
    // For marketing notifications, verify user has given explicit consent
    const isMarketingCategory = template.category === 'marketing' ||
                                template.category === 'promotional' ||
                                template.category === 'newsletter';
    if (isMarketingCategory) {
      const preferences = await preferencesService.getPreferences(notification.userId);
      if (!preferences.marketingEnabled) {
        notification.status = 'pending';
        notification.metadata.skipReason = 'GDPR: User has not consented to marketing notifications';
        await this.save(notification);
        logger.info('Marketing notification blocked - no consent', {
          notificationId: notification.id,
          userId: notification.userId,
          category: template.category,
        });
        return notification;
      }
    }

    // Queue for sending
    notification.status = 'queued';
    await this.save(notification);

    // Send notification
    return this.processSend(notification);
  }

  async sendToAllChannels(payload: NotificationPayload): Promise<Notification[]> {
    const notifications: Notification[] = [];
    const errors: string[] = [];

    for (const channel of payload.recipient.channels) {
      const channelPayload: NotificationPayload = {
        ...payload,
        recipient: {
          ...payload.recipient,
          channels: [channel],
        },
      };

      try {
        const notification = await this.sendNotification(channelPayload);
        notifications.push(notification);
      } catch (error) {
        errors.push(`${channel}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (errors.length > 0 && notifications.length === 0) {
      throw new AppError(`All channel sends failed: ${errors.join('; ')}`);
    }

    return notifications;
  }

  async sendBatch(payload: BatchNotificationPayload): Promise<BatchNotificationResult> {
    const results: BatchNotificationResult['results'] = [];
    let successful = 0;
    let failed = 0;

    const notifications = payload.notifications;

    if (payload.options?.parallel !== false) {
      // Process in parallel
      const promises = notifications.map(async (p) => {
        try {
          const notification = await this.sendNotification(p);
          results.push({
            recipient: p.recipient,
            notificationId: notification.id,
            success: notification.status !== 'failed',
            error: notification.errorMessage,
          });
          if (notification.status !== 'failed') successful++;
          else failed++;
        } catch (error) {
          results.push({
            recipient: p.recipient,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          failed++;

          if (payload.options?.stopOnError) {
            throw error;
          }
        }
      });

      await Promise.all(promises);
    } else {
      // Process sequentially
      for (const p of notifications) {
        try {
          const notification = await this.sendNotification(p);
          results.push({
            recipient: p.recipient,
            notificationId: notification.id,
            success: notification.status !== 'failed',
            error: notification.errorMessage,
          });
          if (notification.status !== 'failed') successful++;
          else failed++;
        } catch (error) {
          results.push({
            recipient: p.recipient,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          failed++;

          if (payload.options?.stopOnError) {
            break;
          }
        }
      }
    }

    return {
      total: notifications.length,
      successful,
      failed,
      results,
    };
  }

  private async processSend(notification: Notification): Promise<Notification> {
    const adapter = adapterRegistry.get(notification.channel);

    if (!adapter) {
      notification.status = 'failed';
      notification.errorMessage = `No adapter for channel: ${notification.channel}`;
      await this.save(notification);
      return notification;
    }

    notification.attempts++;
    notification.status = 'sent';

    try {
      const result = await adapter.send(notification);

      if (result.success) {
        notification.metadata.messageId = result.messageId;
        notification.status = 'delivered';
        notification.deliveredAt = result.timestamp;
        logger.info('Notification sent successfully', {
          notificationId: notification.id,
          channel: notification.channel,
          messageId: result.messageId,
        });
      } else {
        notification.status = 'failed';
        notification.errorMessage = result.error;
        notification.failedAt = new Date();
        logger.error('Notification send failed', {
          notificationId: notification.id,
          error: result.error,
        });
      }
    } catch (error) {
      notification.status = 'failed';
      notification.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      notification.failedAt = new Date();

      // Retry if attempts remain
      if (notification.attempts < notification.maxAttempts) {
        notification.status = 'pending';
        await this.retryLater(notification);
      }
    }

    notification.updatedAt = new Date();
    await this.save(notification);

    // Log the event
    await this.logEvent(notification.id, notification.channel, notification.userId, notification.status);

    return notification;
  }

  private async retryLater(notification: Notification): Promise<void> {
    const delay = config.notifications.retryDelayMs * notification.attempts;
    const retryAt = new Date(Date.now() + delay);

    notification.metadata.retryAt = retryAt;
    logger.info('Notification scheduled for retry', {
      notificationId: notification.id,
      attempt: notification.attempts,
      retryAt: retryAt.toISOString(),
    });

    // In production, you'd use a job queue (Bull, Agenda, etc.)
    // For now, we'll set it as pending for the next processor run
  }

  async getNotification(id: string): Promise<Notification | null> {
    const result = await database.query<Notification>(
      `SELECT * FROM notifications WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToNotification(result.rows[0]);
  }

  async getByIdempotencyKey(key: string): Promise<Notification | null> {
    const result = await database.query<Notification>(
      `SELECT * FROM notifications WHERE idempotency_key = $1`,
      [key]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToNotification(result.rows[0]);
  }

  async getUserNotifications(
    userId: string,
    options?: {
      channel?: NotificationChannel;
      status?: NotificationStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ notifications: Notification[]; total: number }> {
    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    let countQuery = 'SELECT COUNT(*) FROM notifications WHERE user_id = $1';
    const params: unknown[] = [userId];
    let paramIndex = 2;

    if (options?.channel) {
      query += ` AND channel = $${paramIndex}`;
      countQuery += ` AND channel = $${paramIndex++}`;
      params.push(options.channel);
    }

    if (options?.status) {
      query += ` AND status = $${paramIndex}`;
      countQuery += ` AND status = $${paramIndex++}`;
      params.push(options.status);
    }

    query += ' ORDER BY created_at DESC';

    if (options?.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(options.limit);
    }

    if (options?.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(options.offset);
    }

    const [result, countResult] = await Promise.all([
      database.query<Notification>(query, params),
      database.query<{ count: string }>(countQuery, [userId]),
    ]);

    return {
      notifications: result.rows.map((row) => this.mapRowToNotification(row)),
      total: parseInt(countResult.rows[0]?.count || '0', 10),
    };
  }

  async updateStatus(
    id: string,
    status: NotificationStatus,
    metadata?: Record<string, unknown>
  ): Promise<Notification | null> {
    const updates: string[] = ['status = $2', 'updated_at = NOW()'];
    const params: unknown[] = [id, status];
    let paramIndex = 3;

    if (status === 'delivered') {
      updates.push('delivered_at = NOW()');
    }

    if (status === 'read') {
      updates.push('read_at = NOW()');
    }

    if (status === 'failed') {
      updates.push('failed_at = NOW()');
    }

    if (metadata) {
      updates.push(`metadata = metadata || $${paramIndex++}`);
      params.push(JSON.stringify(metadata));
    }

    await database.query(
      `UPDATE notifications SET ${updates.join(', ')} WHERE id = $1`,
      params
    );

    return this.getNotification(id);
  }

  private async save(notification: Notification): Promise<void> {
    await database.query(
      `INSERT INTO notifications (
        id, user_id, channel, template_id, status, priority, variables,
        rendered_content, metadata, attempts, max_attempts, idempotency_key,
        sent_at, delivered_at, read_at, failed_at, error_message, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        priority = EXCLUDED.priority,
        variables = EXCLUDED.variables,
        rendered_content = EXCLUDED.rendered_content,
        metadata = EXCLUDED.metadata,
        attempts = EXCLUDED.attempts,
        sent_at = EXCLUDED.sent_at,
        delivered_at = EXCLUDED.delivered_at,
        read_at = EXCLUDED.read_at,
        failed_at = EXCLUDED.failed_at,
        error_message = EXCLUDED.error_message,
        updated_at = EXCLUDED.updated_at`,
      [
        notification.id,
        notification.userId,
        notification.channel,
        notification.templateId,
        notification.status,
        notification.priority,
        JSON.stringify(notification.variables),
        notification.renderedContent,
        JSON.stringify(notification.metadata),
        notification.attempts,
        notification.maxAttempts,
        (notification.metadata as Record<string, unknown>)?.idempotencyKey,
        notification.sentAt,
        notification.deliveredAt,
        notification.readAt,
        notification.failedAt,
        notification.errorMessage,
        notification.createdAt,
        notification.updatedAt,
      ]
    );
  }

  private async logEvent(
    notificationId: string,
    channel: NotificationChannel,
    userId: string,
    event: string
  ): Promise<void> {
    await database.query(
      `INSERT INTO notification_logs (notification_id, event, channel, user_id)
       VALUES ($1, $2, $3, $4)`,
      [notificationId, event, channel, userId]
    );
  }

  private mapRowToNotification(row: Record<string, unknown>): Notification {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      channel: row.channel as NotificationChannel,
      templateId: row.template_id as string,
      status: row.status as NotificationStatus,
      priority: row.priority as 'low' | 'normal' | 'high' | 'urgent',
      variables: typeof row.variables === 'string' ? JSON.parse(row.variables) : row.variables,
      renderedContent: row.rendered_content as string,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      attempts: row.attempts as number,
      maxAttempts: row.max_attempts as number,
      sentAt: row.sent_at ? new Date(row.sent_at as string) : undefined,
      deliveredAt: row.delivered_at ? new Date(row.delivered_at as string) : undefined,
      readAt: row.read_at ? new Date(row.read_at as string) : undefined,
      failedAt: row.failed_at ? new Date(row.failed_at as string) : undefined,
      errorMessage: row.error_message as string | undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }
}

export const notificationService = new NotificationService();
export default notificationService;
