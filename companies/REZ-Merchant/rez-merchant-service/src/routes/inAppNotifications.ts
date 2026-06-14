/**
 * In-App Notification Routes
 *
 * CRUD for user notifications:
 * - List notifications
 * - Mark as read
 * - Delete notifications
 * - Get unread count
 */

import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { Notification } from '../models/Notification';
import { merchantAuth } from '../middleware/auth';
import { logger } from '../config/logger';

const router = Router();
router.use(merchantAuth);

/**
 * GET /notifications
 * List notifications for the merchant/user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      isRead,
      type,
      page = '1',
      limit = '20',
    } = req.query;

    const query: unknown = { merchantId: new Types.ObjectId(req.merchantId!) };

    if (req.userId) {
      query.$or = [
        { userId: new Types.ObjectId(req.userId) },
        { userId: { $exists: false } },
      ];
    }

    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    if (type) {
      query.type = type;
    }

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const skip = (pageNum - 1) * limitNum;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Notification.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    logger.error('[Notifications] List failed', { error: err });
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

/**
 * GET /notifications/unread-count
 * Get unread notification count
 */
router.get('/unread-count', async (req: Request, res: Response) => {
  try {
    const query: unknown = {
      merchantId: new Types.ObjectId(req.merchantId!),
      isRead: false,
    };

    if (req.userId) {
      query.$or = [
        { userId: new Types.ObjectId(req.userId) },
        { userId: { $exists: false } },
      ];
    }

    const count = await Notification.countDocuments(query);

    res.json({
      success: true,
      data: { count },
    });
  } catch (err) {
    logger.error('[Notifications] Count failed', { error: err });
    res.status(500).json({ success: false, message: 'Failed to fetch count' });
  }
});

/**
 * GET /notifications/:id
 * Get single notification
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid notification ID' });
      return;
    }

    const notification = await Notification.findOne({
      _id: new Types.ObjectId(req.params.id),
      merchantId: new Types.ObjectId(req.merchantId!),
    }).lean();

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    res.json({
      success: true,
      data: notification,
    });
  } catch (err) {
    logger.error('[Notifications] Get failed', { error: err });
    res.status(500).json({ success: false, message: 'Failed to fetch notification' });
  }
});

/**
 * PUT /notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', async (req: Request, res: Response) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid notification ID' });
      return;
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: new Types.ObjectId(req.params.id),
        merchantId: new Types.ObjectId(req.merchantId!),
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    res.json({
      success: true,
      data: notification,
    });
  } catch (err) {
    logger.error('[Notifications] Mark read failed', { error: err });
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
});

/**
 * PUT /notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', async (req: Request, res: Response) => {
  try {
    const query: unknown = {
      merchantId: new Types.ObjectId(req.merchantId!),
      isRead: false,
    };

    if (req.userId) {
      query.$or = [
        { userId: new Types.ObjectId(req.userId) },
        { userId: { $exists: false } },
      ];
    }

    const result = await Notification.updateMany(query, {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
    });
  } catch (err) {
    logger.error('[Notifications] Mark all read failed', { error: err });
    res.status(500).json({ success: false, message: 'Failed to update notifications' });
  }
});

/**
 * DELETE /notifications/:id
 * Delete a notification
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid notification ID' });
      return;
    }

    const result = await Notification.deleteOne({
      _id: new Types.ObjectId(req.params.id),
      merchantId: new Types.ObjectId(req.merchantId!),
    });

    if (result.deletedCount === 0) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (err) {
    logger.error('[Notifications] Delete failed', { error: err });
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
});

/**
 * DELETE /notifications
 * Delete multiple notifications
 */
router.delete('/', async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, message: 'ids array required' });
      return;
    }

    const validIds = ids.filter((id: string) => Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      res.status(400).json({ success: false, message: 'No valid IDs provided' });
      return;
    }

    const result = await Notification.deleteMany({
      _id: { $in: validIds.map((id) => new Types.ObjectId(id)) },
      merchantId: new Types.ObjectId(req.merchantId!),
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} notifications`,
    });
  } catch (err) {
    logger.error('[Notifications] Bulk delete failed', { error: err });
    res.status(500).json({ success: false, message: 'Failed to delete notifications' });
  }
});

export default router;
