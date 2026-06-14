/**
 * CorpID Notification Service
 * Alerts, notifications, and webhooks
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose, { Schema, model } from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { randomBytes } from 'crypto';
import { createHmac } from 'crypto';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(rateLimit({ windowMs: 60000, max: 100, message: { success: false, error: { code: 'RATE_LIMITED' } } }));

// NOTE: Port 4710 is reserved for Salar OS (Workforce Intelligence)
// CorpID Notification Service uses port 4720
const PORT = parseInt(process.env.PORT || '4720', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpid';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'corpid-internal-token';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'corpid-webhook-secret';

const notificationSchema = new Schema({
  notificationId: { type: String, required: true, unique: true, index: true },
  corpId: { type: String, required: true, index: true },
  type: { type: String, enum: ['EMAIL', 'SMS', 'PUSH', 'WEBHOOK'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: Schema.Types.Mixed },
  read: { type: Boolean, default: false },
  sentAt: { type: Date, default: Date.now },
  readAt: Date,
});

const webhookSchema = new Schema({
  webhookId: { type: String, required: true, unique: true, index: true },
  corpId: { type: String, required: true, index: true },
  url: { type: String, required: true },
  events: [String],
  secret: { type: String, required: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastTriggeredAt: Date,
  failureCount: { type: Number, default: 0 },
});

const webhookDeliverySchema = new Schema({
  deliveryId: { type: String, required: true, unique: true, index: true },
  webhookId: { type: String, required: true, index: true },
  event: String,
  payload: { type: Schema.Types.Mixed },
  attemptedAt: { type: Date, default: Date.now },
  deliveredAt: Date,
  status: { type: String, enum: ['PENDING', 'DELIVERED', 'FAILED'], default: 'PENDING' },
  responseCode: Number,
  error: String,
});

const Notification = model('Notification', notificationSchema);
const Webhook = model('Webhook', webhookSchema);
const WebhookDelivery = model('WebhookDelivery', webhookDeliverySchema);

function generateId(prefix: string): string {
  return `${prefix}-${randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString(36)}`;
}

function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (req.headers['x-internal-token'] === INTERNAL_TOKEN) return next();
  next();
}

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'corpid-notification-service', timestamp: new Date().toISOString() });
});

// Send notification
app.post('/notifications', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId, type, title, message, data, email, phone } = req.body;

    const notification = new Notification({
      notificationId: generateId('NTF'),
      corpId,
      type,
      title,
      message,
      data: data || { email, phone },
    });

    await notification.save();

    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    logger.error('Error sending notification:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Get notifications
app.get('/notifications/:corpId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;
    const { read } = req.query;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));

    const filter: Record<string, unknown> = { corpId };
    if (read === 'true') filter.read = true;
    else if (read === 'false') filter.read = false;

    const [notifications, total] = await Promise.all([
      Notification.find(filter).sort({ sentAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
      Notification.countDocuments(filter),
    ]);

    res.json({ success: true, data: { items: notifications, total, page, pageSize, totalPages: Math.ceil(total / pageSize) } });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Mark as read
app.patch('/notifications/:notificationId/read', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { notificationId },
      { $set: { read: true, readAt: new Date() } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Create webhook
app.post('/webhooks', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId, url, events, secret } = req.body;

    const webhook = new Webhook({
      webhookId: generateId('WHK'),
      corpId,
      url,
      events: events || ['*'],
      secret: secret || randomBytes(32).toString('hex'),
    });

    await webhook.save();

    res.status(201).json({ success: true, data: webhook });
  } catch (error) {
    logger.error('Error creating webhook:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Get webhooks
app.get('/webhooks/:corpId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;

    const webhooks = await Webhook.find({ corpId }).lean();

    res.json({ success: true, data: webhooks });
  } catch (error) {
    logger.error('Error fetching webhooks:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Delete webhook
app.delete('/webhooks/:webhookId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;

    await Webhook.deleteOne({ webhookId });

    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    logger.error('Error deleting webhook:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Trigger webhook (internal)
app.post('/webhooks/trigger', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId, event, payload } = req.body;

    const webhooks = await Webhook.find({ corpId, active: true, $or: [{ events: event }, { events: '*' }] });

    const deliveries = [];
    for (const webhook of webhooks) {
      const signature = signPayload(JSON.stringify(payload), webhook.secret);

      const delivery = new WebhookDelivery({
        deliveryId: generateId('DLV'),
        webhookId: webhook.webhookId,
        event,
        payload,
        status: 'PENDING',
      });

      try {
        // Simulate webhook delivery
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CorpID-Signature': signature,
            'X-CorpID-Event': event,
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          delivery.status = 'DELIVERED';
          delivery.deliveredAt = new Date();
          delivery.responseCode = response.status;
        } else {
          delivery.status = 'FAILED';
          delivery.error = `HTTP ${response.status}`;
          delivery.responseCode = response.status;
          webhook.failureCount += 1;
        }
      } catch (err) {
        delivery.status = 'FAILED';
        delivery.error = (err as Error).message;
        webhook.failureCount += 1;
      }

      webhook.lastTriggeredAt = new Date();
      if (webhook.failureCount > 10) webhook.active = false;

      await Promise.all([delivery.save(), webhook.save()]);
      deliveries.push(delivery);
    }

    res.json({ success: true, data: { triggered: webhooks.length, deliveries } });
  } catch (error) {
    logger.error('Error triggering webhooks:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Get unread count
app.get('/notifications/:corpId/unread/count', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;
    const count = await Notification.countDocuments({ corpId, read: false });
    res.json({ success: true, data: { count } });
  } catch (error) {
    logger.error('Error counting unread:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Notification service error:', err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
});

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');
    await Promise.all([Notification.createIndexes(), Webhook.createIndexes(), WebhookDelivery.createIndexes()]);
    logger.info('Indexes created');
    app.listen(PORT, () => logger.info(`CorpID Notification Service running on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
export default app;
