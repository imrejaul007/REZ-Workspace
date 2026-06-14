import { Router } from 'express';
import notificationRoutes from './notificationRoutes';
import templateRoutes from './templateRoutes';
import preferenceRoutes from './preferenceRoutes';
import scheduleRoutes from './scheduleRoutes';
import expoPushRoutes from './expoPushRoutes';

const router = Router();

// Notification routes
router.use('/notifications', notificationRoutes);
router.use('/notifications/preferences', preferenceRoutes);

// Template routes
router.use('/templates', templateRoutes);

// Schedule routes
router.use('/schedules', scheduleRoutes);

// Expo Push routes
router.use('/push', expoPushRoutes);

export default router;
