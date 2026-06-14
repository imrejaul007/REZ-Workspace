import { Router } from 'express';
import { notificationController } from '../controllers';
import { notificationRateLimitMiddleware } from '../middleware';

const router = Router();

// Send single notification
router.post(
  '/send',
  notificationRateLimitMiddleware,
  notificationController.send.bind(notificationController)
);

// Send to all channels
router.post(
  '/send-all',
  notificationRateLimitMiddleware,
  notificationController.sendToAllChannels.bind(notificationController)
);

// Send batch notifications
router.post(
  '/batch',
  notificationRateLimitMiddleware,
  notificationController.sendBatch.bind(notificationController)
);

// Preview rendered notification
router.post(
  '/preview',
  notificationController.preview.bind(notificationController)
);

// Get notification by ID
router.get(
  '/:id',
  notificationController.getById.bind(notificationController)
);

// Get user notifications
router.get(
  '/user/:userId',
  notificationController.getUserNotifications.bind(notificationController)
);

// Update notification status
router.patch(
  '/:id/status',
  notificationController.updateStatus.bind(notificationController)
);

export default router;
