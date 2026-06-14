/**
 * Notification Routes
 */

import { Router, Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { NotificationPreferences } from '../models/NotificationPreferences';

const router = Router();

/**
 * POST /api/v1/notifications/send
 * Send notification
 */
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { userId, type, channel, title, body, data, priority } = req.body;

    if (!userId || !type || !channel || !title || !body) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const notification = await Notification.create({
      userId,
      type,
      channel,
      title,
      body,
      data,
      priority: priority || 'normal',
      status: 'pending',
    });

    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

/**
 * GET /api/v1/notifications/:userId
 * Get user notifications
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = '20', offset = '0', unreadOnly = 'false' } = req.query;

    const query: unknown = { userId };
    if (unreadOnly === 'true') {
      query.readAt = { $exists: false };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset as string))
      .limit(parseInt(limit as string));

    const total = await Notification.countDocuments(query);
    const unread = await Notification.countDocuments({ userId, readAt: { $exists: false } });

    res.json({
      notifications,
      pagination: { total, unread, limit: parseInt(limit as string), offset: parseInt(offset as string) },
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

/**
 * PUT /api/v1/notifications/:notificationId/read
 * Mark notification as read
 */
router.put('/:notificationId/read', async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    await Notification.findByIdAndUpdate(notificationId, { readAt: new Date() });
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

/**
 * PUT /api/v1/notifications/:userId/read-all
 * Mark all notifications as read
 */
router.put('/:userId/read-all', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    await Notification.updateMany(
      { userId, readAt: { $exists: false } },
      { readAt: new Date() }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

/**
 * GET /api/v1/notifications/:userId/unread-count
 * Get unread count
 */
router.get('/:userId/unread-count', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const count = await Notification.countDocuments({ userId, readAt: { $exists: false } });
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

/**
 * DELETE /api/v1/notifications/:notificationId
 * Delete notification
 */
router.delete('/:notificationId', async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    await Notification.findByIdAndDelete(notificationId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export { router as notificationRoutes };
