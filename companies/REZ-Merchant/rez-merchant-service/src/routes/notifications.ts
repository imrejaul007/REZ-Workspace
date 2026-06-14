import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { merchantAuth } from '../middleware/auth';
import { logger } from '../config/logger';
import { registerPushToken, unregisterPushToken } from '../lib/authServiceClient';

const router = Router();
router.use(merchantAuth);

// RABTUL: Notification service URL
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'https://rez-notifications-service.onrender.com';

// RABTUL: Internal headers for notification service calls
const INTERNAL_HEADERS = {
  'Content-Type': 'application/json',
  'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
};

// Use the shared Notification collection
const Notification = mongoose.model('Notification', new mongoose.Schema({}, { strict: false, collection: 'notifications' }));

// Use the MerchantNotificationPreferences collection for per-merchant prefs
const NotificationPreferences = mongoose.model(
  'MerchantNotificationPreferences',
  new mongoose.Schema({}, { strict: false, collection: 'merchant_notification_preferences' }),
);

// GET /notifications — paginated list
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const filter: unknown = { recipient: new mongoose.Types.ObjectId(req.merchantId!) };
    const [notifications, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Notification.countDocuments(filter),
    ]);
    res.json({ success: true, data: notifications, pagination: { total, page, limit } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /notifications/unread-count or /unread
router.get(['/unread', '/unread-count'], async (req: Request, res: Response) => {
  try {
    const count = await Notification.countDocuments({ recipient: new mongoose.Types.ObjectId(req.merchantId!), isRead: false });
    res.json({ success: true, data: { count } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// PATCH /notifications/:id/read
router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: new mongoose.Types.ObjectId(req.merchantId!) },
      { $set: { isRead: true, readAt: new Date() } },
    );
    res.json({ success: true });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /notifications/mark-all-read
router.post('/mark-all-read', async (req: Request, res: Response) => {
  try {
    await Notification.updateMany(
      { recipient: new mongoose.Types.ObjectId(req.merchantId!), isRead: false },
      { $set: { isRead: true, readAt: new Date() } },
    );
    res.json({ success: true });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /notifications/register-token — register merchant device push token
router.post('/register-token', async (req: Request, res: Response) => {
  try {
    const { token, platform, deviceName } = req.body
    if (!token || !platform) {
      res.status(400).json({ success: false, message: 'token and platform are required' })
      return
    }
    if (!['ios', 'android', 'web'].includes(platform)) {
      res.status(400).json({ success: false, message: 'platform must be ios, android, or web' })
      return
    }
    const merchantId = req.merchantId!
    // P1-DATA-1 FIX: Replaced direct User.findByIdAndUpdate (writes to auth-service's users collection)
    // with internal HTTP call to rez-auth-service /internal/users/:id/push-token.
    await registerPushToken(merchantId, token, platform, deviceName || undefined)
    res.json({ success: true, message: 'Push token registered' })
  } catch (err: unknown) {
    logger.error('[notifications] Failed to register push token', { error: err?.message });
    res.status(500).json({ success: false, message: 'Failed to register push token' })
  }
})

// POST /notifications/unregister-token — remove merchant device push token
router.post('/unregister-token', async (req: Request, res: Response) => {
  try {
    const { token } = req.body
    if (!token) {
      res.status(400).json({ success: false, message: 'token is required' })
      return
    }
    const merchantId = req.merchantId!
    // P1-DATA-1 FIX: Replaced direct User.findByIdAndUpdate with internal HTTP call.
    await unregisterPushToken(merchantId, token)
    res.json({ success: true, message: 'Push token unregistered' })
  } catch (err: unknown) {
    logger.error('[notifications] Failed to unregister push token', { error: err?.message });
    res.status(500).json({ success: false, message: 'Failed to unregister push token' })
  }
})

// POST /notifications/mark-multiple-read — mark multiple notifications as read
router.post('/mark-multiple-read', async (req: Request, res: Response) => {
  try {
    const { notificationIds } = req.body;
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      res.status(400).json({ success: false, message: 'notificationIds array is required' });
      return;
    }
    const result = await Notification.updateMany(
      { _id: { $in: notificationIds }, recipient: new mongoose.Types.ObjectId(req.merchantId!) },
      { $set: { isRead: true, readAt: new Date() } },
    );
    res.json({ success: true, data: { markedCount: result.modifiedCount } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /notifications/delete-multiple — delete multiple notifications
router.post('/delete-multiple', async (req: Request, res: Response) => {
  try {
    const { notificationIds } = req.body;
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      res.status(400).json({ success: false, message: 'notificationIds array is required' });
      return;
    }
    const result = await Notification.deleteMany({
      _id: { $in: notificationIds },
      recipient: new mongoose.Types.ObjectId(req.merchantId!),
    });
    res.json({ success: true, data: { deletedCount: result.deletedCount } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /notifications/stats — return { total, unread, byType }
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const recipientId = new mongoose.Types.ObjectId(req.merchantId!);
    const [total, unread, byTypeAgg] = await Promise.all([
      Notification.countDocuments({ recipient: recipientId }),
      Notification.countDocuments({ recipient: recipientId, isRead: false }),
      Notification.aggregate([
        { $match: { recipient: recipientId } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
    ]);
    const byType: Record<string, number> = {};
    byTypeAgg.forEach((item) => { byType[item._id] = item.count; });
    res.json({ success: true, data: { total, unread, byType } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /notifications/preferences — return merchant notification preferences
router.get('/preferences', async (req: Request, res: Response) => {
  try {
    const prefs = await NotificationPreferences.findOne({ merchantId: req.merchantId! }).lean();
    if (!prefs) {
      // Return safe defaults when no preferences exist yet
      res.json({
        success: true,
        data: {
          merchantId: req.merchantId,
          globalMute: false,
          email: { enabled: true, addresses: [] },
          sms: { enabled: false, numbers: [] },
          categories: {},
          doNotDisturb: { enabled: false, startTime: '22:00', endTime: '08:00', allowUrgent: true },
        },
      });
      return;
    }
    res.json({ success: true, data: prefs });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// PUT /notifications/preferences — save merchant notification preferences
router.put('/preferences', async (req: Request, res: Response) => {
  try {
    const PREFS_ALLOWED = ['globalMute', 'email', 'sms', 'categories', 'doNotDisturb'];
    const safeUpdate: Record<string, unknown> = {};
    for (const f of PREFS_ALLOWED) {
      if ((req.body as unknown)[f] !== undefined) safeUpdate[f] = (req.body as unknown)[f];
    }
    const prefs = await NotificationPreferences.findOneAndUpdate(
      { merchantId: req.merchantId! },
      { $set: { ...safeUpdate, merchantId: req.merchantId!, updatedAt: new Date() } },
      { upsert: true, new: true },
    ).lean();
    res.json({ success: true, data: prefs });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /notifications/subscribe-email — add email to notification list
router.post('/subscribe-email', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ success: false, message: 'email is required' });
      return;
    }
    await NotificationPreferences.findOneAndUpdate(
      { merchantId: req.merchantId! },
      {
        $addToSet: { 'email.addresses': email.toLowerCase().trim() },
        $set: { 'email.enabled': true, merchantId: req.merchantId!, updatedAt: new Date() },
      },
      { upsert: true },
    );
    res.json({ success: true, message: 'Email subscribed to notifications' });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /notifications/unsubscribe-email — remove email from notification list
router.post('/unsubscribe-email', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ success: false, message: 'email is required' });
      return;
    }
    await NotificationPreferences.findOneAndUpdate(
      { merchantId: req.merchantId! },
      {
        $pull: { 'email.addresses': email.toLowerCase().trim() },
        $set: { updatedAt: new Date() },
      },
    );
    res.json({ success: true, message: 'Email unsubscribed from notifications' });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /notifications/subscribe-sms — add phone to SMS notification list
router.post('/subscribe-sms', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone || typeof phone !== 'string') {
      res.status(400).json({ success: false, message: 'phone is required' });
      return;
    }
    await NotificationPreferences.findOneAndUpdate(
      { merchantId: req.merchantId! },
      {
        $addToSet: { 'sms.numbers': phone.trim() },
        $set: { 'sms.enabled': true, merchantId: req.merchantId!, updatedAt: new Date() },
      },
      { upsert: true },
    );
    res.json({ success: true, message: 'Phone subscribed to SMS notifications' });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /notifications/unsubscribe-sms — remove phone from SMS notification list
router.post('/unsubscribe-sms', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone || typeof phone !== 'string') {
      res.status(400).json({ success: false, message: 'phone is required' });
      return;
    }
    await NotificationPreferences.findOneAndUpdate(
      { merchantId: req.merchantId! },
      {
        $pull: { 'sms.numbers': phone.trim() },
        $set: { updatedAt: new Date() },
      },
    );
    res.json({ success: true, message: 'Phone unsubscribed from SMS notifications' });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /notifications/clear-all — delete all notifications for this merchant
router.post('/clear-all', async (req: Request, res: Response) => {
  try {
    const filter: unknown = { recipient: new mongoose.Types.ObjectId(req.merchantId!) };
    if (req.body.type) filter.type = req.body.type;
    const result = await Notification.deleteMany(filter);
    res.json({ success: true, data: { deletedCount: result.deletedCount } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /notifications/:id — fetch single notification
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: new mongoose.Types.ObjectId(req.merchantId!),
    }).lean();
    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }
    res.json({ success: true, data: { notification } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// DELETE /notifications/:id — delete single notification
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: new mongoose.Types.ObjectId(req.merchantId!),
    });
    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }
    res.json({ success: true });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// PUT /notifications/:id/archive — archive a single notification (soft delete)
router.put('/:id/archive', async (req: Request, res: Response) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: new mongoose.Types.ObjectId(req.merchantId!) },
      { $set: { archived: true, archivedAt: new Date() } },
      { new: true },
    ).lean();
    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }
    res.json({ success: true, data: { notification } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
