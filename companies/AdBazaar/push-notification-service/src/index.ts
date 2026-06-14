/**
 * Push Notification Service
 *
 * Mobile push notifications with FCM integration.
 *
 * Port: 5032
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import crypto from 'crypto';
import winston from 'winston';
import client, { Registry, Counter, Histogram, Gauge } from 'prom-client';
import { z } from 'zod';
import axios from 'axios';

// ============================================================================
// LOGGING
// ============================================================================

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// ============================================================================
// METRICS
// ============================================================================

const register = new Registry();
register.setDefaultLabels({ service: 'push-notification-service' });

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register]
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'path'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

const pushSentTotal = new Counter({
  name: 'push_sent_total',
  help: 'Total push notifications sent',
  labelNames: ['notification_id', 'status'],
  registers: [register]
});

const notificationMetrics = new Gauge({
  name: 'notification_metrics',
  help: 'Notification metrics',
  labelNames: ['notification_id', 'metric'],
  registers: [register]
});

// ============================================================================
// EXPRESS APP
// ============================================================================

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Metrics middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestsTotal.inc({ method: req.method, path: req.path, status: res.statusCode });
    httpRequestDuration.observe({ method: req.method, path: req.path }, duration);
  });
  next();
});

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = parseInt(process.env.PORT || '5032', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/push_notifications';
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY;
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-token';

// ============================================================================
// MONGODB MODELS
// ============================================================================

// Notification Model
const NotificationSchema = new mongoose.Schema({
  notificationId: { type: String, required: true, unique: true, index: true },
  advertiserId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  imageUrl: String,
  data: mongoose.Schema.Types.Mixed,
  target: {
    type: { type: String, enum: ['all', 'segment', 'devices'] },
    segment: String,
    deviceIds: [String]
  },
  status: { type: String, enum: ['draft', 'scheduled', 'sending', 'sent', 'failed'], default: 'draft' },
  stats: {
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    failed: { type: Number, default: 0 }
  },
  scheduledAt: Date,
  sentAt: Date,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const Notification = mongoose.model('Notification', NotificationSchema);

// Device Model
const DeviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true, index: true },
  advertiserId: { type: String, index: true },
  userId: String,
  platform: { type: String, enum: ['ios', 'android', 'web'], required: true },
  pushToken: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive', 'unsubscribed'], default: 'active' },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const Device = mongoose.model('Device', DeviceSchema);

// Send Model
const SendSchema = new mongoose.Schema({
  sendId: { type: String, required: true, unique: true, index: true },
  notificationId: { type: String, required: true, index: true },
  deviceId: String,
  pushToken: String,
  fcmMessageId: String,
  status: { type: String, enum: ['pending', 'sent', 'delivered', 'opened', 'clicked', 'failed'] },
  sentAt: Date,
  deliveredAt: Date,
  openedAt: Date,
  clickedAt: Date
}, { timestamps: true });

const Send = mongoose.model('Send', SendSchema);

// Analytics Model
const AnalyticsSchema = new mongoose.Schema({
  date: { type: Date, required: true, index: true },
  advertiserId: String,
  sent: { type: Number, default: 0 },
  delivered: { type: Number, default: 0 },
  opened: { type: Number, default: 0 },
  clicked: { type: Number, default: 0 },
  failed: { type: Number, default: 0 }
});

const Analytics = mongoose.model('Analytics', AnalyticsSchema);

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createNotificationSchema = z.object({
  advertiserId: z.string(),
  title: z.string().min(1),
  body: z.string().min(1),
  imageUrl: z.string().url().optional(),
  data: z.record(z.any()).optional(),
  target: z.object({
    type: z.enum(['all', 'segment', 'devices']),
    segment: z.string().optional(),
    deviceIds: z.array(z.string()).optional()
  }).optional(),
  scheduledAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional()
});

const registerDeviceSchema = z.object({
  advertiserId: z.string().optional(),
  userId: z.string().optional(),
  platform: z.enum(['ios', 'android', 'web']),
  pushToken: z.string().min(1)
});

// ============================================================================
// UTILITIES
// ============================================================================

function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

async function sendViaFCM(token: string, payload: {
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
}): Promise<{ messageId: string }> {
  if (!FCM_SERVER_KEY) {
    logger.warn('FCM_SERVER_KEY not set - mock send');
    return { messageId: `mock_${Date.now()}` };
  }

  try {
    const response = await axios.post(
      'https://fcm.googleapis.com/fcm/send',
      {
        to: token,
        notification: {
          title: payload.title,
          body: payload.body,
          image: payload.imageUrl
        },
        data: payload.data,
        priority: 'high'
      },
      {
        headers: {
          Authorization: `key=${FCM_SERVER_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.failure > 0) {
      throw new Error(response.data.results?.[0]?.error || 'FCM error');
    }

    return { messageId: response.data.results?.[0]?.message_id || `msg_${Date.now()}` };
  } catch (error: any) {
    logger.error('FCM send error', { error: error.response?.data || error.message });
    throw error;
  }
}

// ============================================================================
// HEALTH
// ============================================================================

app.get('/health', (_: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'push-notification-service',
    fcm: FCM_SERVER_KEY ? 'configured' : 'mock',
    timestamp: new Date().toISOString()
  });
});

app.get('/ready', async (_: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ status: 'ready', mongodb: mongoStatus });
});

app.get('/metrics', async (_: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});

// ============================================================================
// DEVICES
// ============================================================================

app.post('/api/devices', async (req: Request, res: Response) => {
  try {
    const validated = registerDeviceSchema.parse(req.body);

    let device = await Device.findOne({ pushToken: validated.pushToken });

    if (device) {
      device.advertiserId = validated.advertiserId || device.advertiserId;
      device.userId = validated.userId || device.userId;
      device.status = 'active';
      await device.save();
      return res.json({ success: true, data: device, message: 'Device updated' });
    }

    device = await Device.create({
      deviceId: generateId('DEV'),
      ...validated
    });

    logger.info('Device registered', { deviceId: device.deviceId });
    res.status(201).json({ success: true, data: device });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error('Register device error', { error });
    res.status(500).json({ success: false, error: 'Failed to register device' });
  }
});

app.get('/api/devices', async (req: Request, res: Response) => {
  try {
    const { advertiserId, platform, status } = req.query;
    const filter: Record<string, unknown> = {};
    if (advertiserId) filter.advertiserId = advertiserId;
    if (platform) filter.platform = platform;
    if (status) filter.status = status;

    const devices = await Device.find(filter).limit(1000);
    res.json({ success: true, data: devices, count: devices.length });
  } catch (error) {
    logger.error('List devices error', { error });
    res.status(500).json({ success: false, error: 'Failed to list devices' });
  }
});

app.delete('/api/devices/:id', async (req: Request, res: Response) => {
  try {
    await Device.findOneAndUpdate(
      { deviceId: req.params.id },
      { status: 'unsubscribed' }
    );
    res.json({ success: true, message: 'Device unsubscribed' });
  } catch (error) {
    logger.error('Unregister device error', { error });
    res.status(500).json({ success: false, error: 'Failed to unregister device' });
  }
});

// ============================================================================
// NOTIFICATIONS
// ============================================================================

app.post('/api/notifications', async (req: Request, res: Response) => {
  try {
    const validated = createNotificationSchema.parse(req.body);

    const notification = await Notification.create({
      notificationId: generateId('NOTIF'),
      ...validated,
      target: validated.target || { type: 'all' },
      scheduledAt: validated.scheduledAt ? new Date(validated.scheduledAt) : undefined,
      status: validated.scheduledAt ? 'scheduled' : 'draft'
    });

    logger.info('Notification created', { notificationId: notification.notificationId });
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error('Create notification error', { error });
    res.status(500).json({ success: false, error: 'Failed to create notification' });
  }
});

app.get('/api/notifications', async (req: Request, res: Response) => {
  try {
    const { advertiserId, status } = req.query;
    const filter: Record<string, unknown> = {};
    if (advertiserId) filter.advertiserId = advertiserId;
    if (status) filter.status = status;

    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: notifications });
  } catch (error) {
    logger.error('List notifications error', { error });
    res.status(500).json({ success: false, error: 'Failed to list notifications' });
  }
});

app.get('/api/notifications/:id', async (req: Request, res: Response) => {
  try {
    const notification = await Notification.findOne({ notificationId: req.params.id });
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    logger.error('Get notification error', { error });
    res.status(500).json({ success: false, error: 'Failed to get notification' });
  }
});

app.put('/api/notifications/:id', async (req: Request, res: Response) => {
  try {
    const { title, body, imageUrl, data, target, status, scheduledAt } = req.body;
    const notification = await Notification.findOneAndUpdate(
      { notificationId: req.params.id },
      { title, body, imageUrl, data, target, status, scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    logger.error('Update notification error', { error });
    res.status(500).json({ success: false, error: 'Failed to update notification' });
  }
});

app.delete('/api/notifications/:id', async (req: Request, res: Response) => {
  try {
    await Notification.findOneAndDelete({ notificationId: req.params.id });
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    logger.error('Delete notification error', { error });
    res.status(500).json({ success: false, error: 'Failed to delete notification' });
  }
});

// ============================================================================
// SEND NOTIFICATION
// ============================================================================

app.post('/api/notifications/:id/send', async (req: Request, res: Response) => {
  try {
    const notification = await Notification.findOne({ notificationId: req.params.id });
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    if (notification.status === 'sending') {
      return res.status(400).json({ success: false, error: 'Notification already sending' });
    }

    notification.status = 'sending';
    await notification.save();

    let devices: Array<{ deviceId: string; pushToken: string; advertiserId: string }> = [];

    if (notification.target.type === 'all') {
      devices = await Device.find({ advertiserId: notification.advertiserId, status: 'active' });
    } else if (notification.target.type === 'devices' && notification.target.deviceIds?.length) {
      devices = await Device.find({
        deviceId: { $in: notification.target.deviceIds },
        status: 'active'
      });
    }

    logger.info(`Sending notification ${notification.notificationId} to ${devices.length} devices`);

    let sent = 0;
    let failed = 0;

    const batchSize = 100;
    for (let i = 0; i < devices.length; i += batchSize) {
      const batch = devices.slice(i, i + batchSize);

      for (const device of batch) {
        try {
          const sendId = generateId('SEND');
          const result = await sendViaFCM(device.pushToken, {
            title: notification.title,
            body: notification.body,
            imageUrl: notification.imageUrl,
            data: {
              notificationId: notification.notificationId,
              ...(notification.data as Record<string, string> || {})
            }
          });

          await Send.create({
            sendId,
            notificationId: notification.notificationId,
            deviceId: device.deviceId,
            pushToken: device.pushToken,
            fcmMessageId: result.messageId,
            status: 'sent',
            sentAt: new Date()
          });

          sent++;
          pushSentTotal.inc({ notification_id: notification.notificationId, status: 'sent' });
        } catch (error) {
          logger.error(`Failed to send to device ${device.deviceId}`, { error });
          failed++;
          pushSentTotal.inc({ notification_id: notification.notificationId, status: 'failed' });
        }
      }

      notification.stats.sent = sent;
      notification.stats.failed = failed;
      await notification.save();
    }

    notification.status = 'sent';
    notification.stats.sent = sent;
    notification.stats.failed = failed;
    notification.sentAt = new Date();
    await notification.save();

    notificationMetrics.set({ notification_id: notification.notificationId, metric: 'sent' }, sent);
    notificationMetrics.set({ notification_id: notification.notificationId, metric: 'failed' }, failed);

    logger.info(`Notification ${notification.notificationId} sent`, { sent, failed });

    res.json({
      success: true,
      data: { notificationId: notification.notificationId, sent, failed, total: devices.length }
    });
  } catch (error) {
    logger.error('Send notification error', { error });
    res.status(500).json({ success: false, error: 'Failed to send notification' });
  }
});

// ============================================================================
// BROADCAST
// ============================================================================

app.post('/api/notifications/broadcast', async (req: Request, res: Response) => {
  try {
    const { advertiserId, title, body, imageUrl, data } = req.body;

    if (!advertiserId || !title || !body) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const notification = await Notification.create({
      notificationId: generateId('BCAST'),
      advertiserId,
      title,
      body,
      imageUrl,
      data,
      target: { type: 'all' },
      status: 'sending'
    });

    const devices = await Device.find({ advertiserId, status: 'active' });
    logger.info(`Broadcast ${notification.notificationId} to ${devices.length} devices`);

    let sent = 0;
    let failed = 0;

    for (const device of devices) {
      try {
        const sendId = generateId('SEND');
        const result = await sendViaFCM(device.pushToken, { title, body, imageUrl, data });

        await Send.create({
          sendId,
          notificationId: notification.notificationId,
          deviceId: device.deviceId,
          pushToken: device.pushToken,
          fcmMessageId: result.messageId,
          status: 'sent',
          sentAt: new Date()
        });

        sent++;
      } catch (error) {
        failed++;
      }
    }

    notification.status = 'sent';
    notification.stats.sent = sent;
    notification.stats.failed = failed;
    notification.sentAt = new Date();
    await notification.save();

    res.json({
      success: true,
      data: { notificationId: notification.notificationId, sent, failed, total: devices.length }
    });
  } catch (error) {
    logger.error('Broadcast error', { error });
    res.status(500).json({ success: false, error: 'Failed to broadcast' });
  }
});

// ============================================================================
// ANALYTICS
// ============================================================================

app.get('/api/notifications/analytics', async (req: Request, res: Response) => {
  try {
    const { advertiserId, startDate, endDate } = req.query;

    const filter: Record<string, unknown> = {};
    if (advertiserId) filter.advertiserId = advertiserId;

    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(100);

    const totalStats = notifications.reduce((acc, n) => ({
      sent: acc.sent + n.stats.sent,
      delivered: acc.delivered + n.stats.delivered,
      opened: acc.opened + n.stats.opened,
      clicked: acc.clicked + n.stats.clicked,
      failed: acc.failed + n.stats.failed
    }), { sent: 0, delivered: 0, opened: 0, clicked: 0, failed: 0 });

    const response = {
      total: notifications.length,
      stats: {
        sent: totalStats.sent,
        delivered: totalStats.delivered,
        opened: totalStats.opened,
        clicked: totalStats.clicked,
        failed: totalStats.failed,
        deliveryRate: totalStats.sent > 0 ? (totalStats.delivered / totalStats.sent * 100).toFixed(2) : 0,
        openRate: totalStats.delivered > 0 ? (totalStats.opened / totalStats.delivered * 100).toFixed(2) : 0,
        clickRate: totalStats.opened > 0 ? (totalStats.clicked / totalStats.opened * 100).toFixed(2) : 0
      },
      notifications: notifications.map(n => ({
        notificationId: n.notificationId,
        title: n.title,
        status: n.status,
        sentAt: n.sentAt,
        stats: n.stats
      }))
    };

    res.json({ success: true, data: response });
  } catch (error) {
    logger.error('Get analytics error', { error });
    res.status(500).json({ success: false, error: 'Failed to get analytics' });
  }
});

// ============================================================================
// WEBHOOKS (For FCM callbacks)
// ============================================================================

app.post('/api/webhooks/fcm', async (req: Request, res: Response) => {
  try {
    const { messageId, event } = req.body;

    const update: Record<string, unknown> = {};

    switch (event) {
      case 'DELIVERED':
        update.status = 'delivered';
        update.deliveredAt = new Date();
        break;
      case 'OPEN':
        update.status = 'opened';
        update.openedAt = new Date();
        break;
    }

    if (Object.keys(update).length > 0) {
      await Send.findOneAndUpdate({ fcmMessageId: messageId }, update);
    }

    res.sendStatus(200);
  } catch (error) {
    logger.error('FCM webhook error', { error });
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
});

// ============================================================================
// STARTUP
// ============================================================================

async function start() {
  logger.info('Starting Push Notification Service', { port: PORT });

  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB connected');

    app.listen(PORT, () => {
      logger.info(`Push Notification Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Startup failed', { error });
    process.exit(1);
  }
}

start();

export default app;