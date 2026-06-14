import { Router } from 'express';
import { scheduleController } from '../controllers';

const router = Router();

/**
 * POST /api/schedules
 * Create a scheduled notification
 */
router.post('/', scheduleController.createScheduledNotification);

/**
 * GET /api/schedules
 * Get scheduled notifications
 */
router.get('/', scheduleController.getScheduledNotifications);

/**
 * POST /api/schedules/preview
 * Preview recipients
 */
router.post('/preview', scheduleController.previewRecipients);

/**
 * GET /api/schedules/:id
 * Get scheduled notification by ID
 */
router.get('/:id', scheduleController.getScheduledNotificationById);

/**
 * PATCH /api/schedules/:id
 * Update a scheduled notification
 */
router.patch('/:id', scheduleController.updateScheduledNotification);

/**
 * DELETE /api/schedules/:id
 * Delete a scheduled notification
 */
router.delete('/:id', scheduleController.deleteScheduledNotification);

/**
 * POST /api/schedules/:id/activate
 * Activate a scheduled notification
 */
router.post('/:id/activate', scheduleController.activateScheduledNotification);

/**
 * POST /api/schedules/:id/pause
 * Pause a scheduled notification
 */
router.post('/:id/pause', scheduleController.pauseScheduledNotification);

/**
 * POST /api/schedules/:id/cancel
 * Cancel a scheduled notification
 */
router.post('/:id/cancel', scheduleController.cancelScheduledNotification);

export default router;
