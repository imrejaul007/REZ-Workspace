import { Router } from 'express';
import { notificationController } from '../controllers';

const router = Router();

/**
 * POST /api/notifications/send
 * Send a notification
 */
router.post('/send', notificationController.sendNotification);

/**
 * POST /api/notifications/send-template
 * Send notification from template
 */
router.post('/send-template', notificationController.sendFromTemplate);

/**
 * GET /api/notifications/:userId
 * Get notifications for a user
 */
router.get('/:userId', notificationController.getNotifications);

/**
 * GET /api/notifications/:userId/unread-count
 * Get unread notification count
 */
router.get('/:userId/unread-count', notificationController.getUnreadCount);

/**
 * GET /api/notifications/:userId/stats
 * Get notification statistics
 */
router.get('/:userId/stats', notificationController.getStats);

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch('/:id/read', notificationController.markAsRead);

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
router.patch('/read-all', notificationController.markAllAsRead);

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', notificationController.deleteNotification);

export default router;
