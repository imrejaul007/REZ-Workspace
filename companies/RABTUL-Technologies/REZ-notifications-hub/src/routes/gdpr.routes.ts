import { Router, Request, Response, NextFunction } from 'express';
import { database } from '../services/database';
import { preferencesService } from '../services';
import logger from '../utils/logger';

const router = Router();

// GDPR Data Export - GET /api/users/:userId/notifications/export
router.get('/users/:userId/notifications/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    // Fetch user notifications
    const result = await database.query<{
      id: string;
      user_id: string;
      channel: string;
      template_id: string;
      status: string;
      priority: string;
      rendered_content: string;
      metadata: Record<string, unknown>;
      attempts: number;
      sent_at: Date | null;
      delivered_at: Date | null;
      read_at: Date | null;
      failed_at: Date | null;
      error_message: string | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT id, user_id, channel, template_id, status, priority, rendered_content, metadata, attempts,
              sent_at, delivered_at, read_at, failed_at, error_message, created_at, updated_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1000`,
      [userId]
    );

    // Format notifications for export
    const notifications = result.rows.map((row) => ({
      id: row.id,
      type: row.template_id,
      channel: row.channel,
      content: row.rendered_content,
      status: row.status,
      priority: row.priority,
      metadata: row.metadata,
      attempts: row.attempts,
      sentAt: row.sent_at,
      deliveredAt: row.delivered_at,
      readAt: row.read_at,
      failedAt: row.failed_at,
      errorMessage: row.error_message,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    logger.info('[GDPR] Data export requested', { userId, count: notifications.length });

    res.json({
      success: true,
      data: {
        userId,
        exportedAt: new Date().toISOString(),
        count: notifications.length,
        notifications,
      },
      meta: {
        requestId: req.headers['x-request-id'] as string || 'unknown',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GDPR Data Erasure - DELETE /api/users/:userId/notifications
router.delete('/users/:userId/notifications', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    // Soft delete - anonymize instead of hard delete for audit compliance
    await database.query(
      `UPDATE notifications
       SET user_id = 'DELETED_' || $1,
           rendered_content = '[REDACTED]',
           metadata = '{}'::jsonb,
           email = NULL,
           phone = NULL,
           updated_at = NOW()
       WHERE user_id = $1`,
      [userId]
    );

    // Delete user preferences
    await database.query(
      `DELETE FROM user_preferences WHERE user_id = $1`,
      [userId]
    );

    // Delete category preferences
    await database.query(
      `DELETE FROM category_preferences WHERE user_id = $1`,
      [userId]
    );

    // Delete opt-out records
    await database.query(
      `DELETE FROM opt_outs WHERE user_id = $1`,
      [userId]
    );

    // Delete global opt-outs
    await database.query(
      `DELETE FROM global_opt_outs WHERE user_id = $1`,
      [userId]
    );

    logger.info('[GDPR] User data erased', { originalUserId: userId });

    res.json({
      success: true,
      message: 'User notification data has been erased',
      meta: {
        requestId: req.headers['x-request-id'] as string || 'unknown',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
