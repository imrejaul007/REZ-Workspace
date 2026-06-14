import { Router, Request, Response } from 'express';
import workflowService from '../services/workflowService';
import { ApiResponse, Notification } from '../types';
import logger from '../utils/logger';

const router = Router();

const getTenantId = (req: Request): string => {
  return req.headers['x-tenant-id'] as string || 'default';
};

const getUserId = (req: Request): string => {
  return req.headers['x-user-id'] as string;
};

router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID required' });
    }

    const notifications = workflowService.getUserNotifications(userId, tenantId);

    const response: ApiResponse<Notification[]> = {
      success: true,
      data: notifications
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/:id/read', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const marked = workflowService.markNotificationRead(req.params.id, tenantId);

    if (!marked) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/read-all', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID required' });
    }

    const count = workflowService.markAllNotificationsRead(userId);

    res.json({
      success: true,
      message: `${count} notifications marked as read`,
      data: { count }
    });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
