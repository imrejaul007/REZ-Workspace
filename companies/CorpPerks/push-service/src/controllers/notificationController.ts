import { Request, Response } from 'express';
import { notificationService } from '../services';
import { SendNotificationSchema, GetNotificationsSchema, MarkReadSchema } from '../validators';
import { ApiError } from '../middleware/errorHandler';
import { NotificationType } from '../models';

/**
 * Send a notification
 * POST /api/notifications/send
 */
export async function sendNotification(req: Request, res: Response): Promise<void> {
  const validation = SendNotificationSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.error.flatten(),
    });
    return;
  }

  const data = validation.data;

  try {
    const notification = await notificationService.send({
      userId: data.userId,
      companyId: data.companyId,
      title: data.title,
      body: data.body,
      type: data.type as NotificationType,
      priority: data.priority,
      data: data.data,
      imageUrl: data.imageUrl,
      deepLink: data.deepLink,
      channels: data.channels,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      templateId: data.templateId,
      templateVariables: data.templateVariables,
    });

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notification sent successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send notification';
    res.status(400).json({
      success: false,
      error: message,
    });
  }
}

/**
 * Send notification from template
 * POST /api/notifications/send-template
 */
export async function sendFromTemplate(req: Request, res: Response): Promise<void> {
  const { userId, companyId, templateId, variables, ...options } = req.body;

  if (!userId || !companyId || !templateId) {
    res.status(400).json({
      success: false,
      error: 'userId, companyId, and templateId are required',
    });
    return;
  }

  try {
    const notification = await notificationService.sendFromTemplate(
      userId,
      companyId,
      templateId,
      variables || {},
      options
    );

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notification sent from template',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send notification';
    res.status(400).json({
      success: false,
      error: message,
    });
  }
}

/**
 * Get notifications for a user
 * GET /api/notifications/:userId
 */
export async function getNotifications(req: Request, res: Response): Promise<void> {
  const { userId } = req.params;
  const queryValidation = GetNotificationsSchema.safeParse({
    ...req.query,
    userId,
  });

  if (!queryValidation.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: queryValidation.error.flatten(),
    });
    return;
  }

  const params = queryValidation.data;

  try {
    const result = await notificationService.getNotifications({
      userId: params.userId,
      companyId: params.companyId,
      page: params.page,
      limit: params.limit,
      type: params.type as NotificationType | undefined,
      read: params.read,
      startDate: params.startDate ? new Date(params.startDate) : undefined,
      endDate: params.endDate ? new Date(params.endDate) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
    });
  }
}

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 */
export async function markAsRead(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    res.status(400).json({
      success: false,
      error: 'userId is required in body',
    });
    return;
  }

  try {
    const notification = await notificationService.markAsRead(id, userId);

    if (!notification) {
      res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
      return;
    }

    res.json({
      success: true,
      data: notification,
      message: 'Notification marked as read',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
    });
  }
}

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
export async function markAllAsRead(req: Request, res: Response): Promise<void> {
  const { userId, companyId } = req.body;

  if (!userId || !companyId) {
    res.status(400).json({
      success: false,
      error: 'userId and companyId are required',
    });
    return;
  }

  try {
    const count = await notificationService.markAllAsRead(userId, companyId);

    res.json({
      success: true,
      data: { markedAsRead: count },
      message: `${count} notifications marked as read`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to mark notifications as read',
    });
  }
}

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
export async function deleteNotification(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    res.status(400).json({
      success: false,
      error: 'userId is required in body',
    });
    return;
  }

  try {
    const deleted = await notificationService.deleteNotification(id, userId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification',
    });
  }
}

/**
 * Get unread count
 * GET /api/notifications/:userId/unread-count
 */
export async function getUnreadCount(req: Request, res: Response): Promise<void> {
  const { userId } = req.params;
  const { companyId } = req.query;

  if (!companyId || typeof companyId !== 'string') {
    res.status(400).json({
      success: false,
      error: 'companyId query parameter is required',
    });
    return;
  }

  try {
    const count = await notificationService.getUnreadCount(userId, companyId);

    res.json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get unread count',
    });
  }
}

/**
 * Get notification statistics
 * GET /api/notifications/:userId/stats
 */
export async function getStats(req: Request, res: Response): Promise<void> {
  const { userId } = req.params;
  const { companyId } = req.query;

  if (!companyId || typeof companyId !== 'string') {
    res.status(400).json({
      success: false,
      error: 'companyId query parameter is required',
    });
    return;
  }

  try {
    const stats = await notificationService.getStats(userId, companyId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
    });
  }
}
