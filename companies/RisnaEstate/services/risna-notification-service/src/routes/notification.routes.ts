import { Router, Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notificationService';
import { successResponse, errorResponse, errors } from '../utils/response';

const router = Router();

// Send notification
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, type, title, message, data } = req.body;
    if (!userId || !type || !title || !message) {
      return errorResponse(res, errors.badRequest('Missing required fields'), 400);
    }
    await notificationService.send(userId, type, title, message, data);
    successResponse(res, { sent: true });
  } catch (err) { next(err); }
});

// Get user notifications
router.get('/user/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const notifications = await notificationService.getUserNotifications(
      req.params.userId,
      parseInt(page as string, 10),
      parseInt(limit as string, 10)
    );
    successResponse(res, notifications);
  } catch (err) { next(err); }
});

// Get unread count
router.get('/user/:userId/unread', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await notificationService.getUnreadCount(req.params.userId);
    successResponse(res, { count });
  } catch (err) { next(err); }
});

// Mark as read
router.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationService.markAsRead(req.params.id);
    successResponse(res, { read: true });
  } catch (err) { next(err); }
});

// Mark all as read
router.patch('/user/:userId/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationService.markAllAsRead(req.params.userId);
    successResponse(res, { read: true });
  } catch (err) { next(err); }
});

export default router;
