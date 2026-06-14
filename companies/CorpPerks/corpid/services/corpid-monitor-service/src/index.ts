/**
 * CorpID Monitor Service
 * Continuous monitoring and alerts
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose, { Schema, model } from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { randomBytes } from 'crypto';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(rateLimit({ windowMs: 60000, max: 100, message: { success: false, error: { code: 'RATE_LIMITED' } } }));

const PORT = parseInt(process.env.PORT || '4707', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpid';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'corpid-internal-token';

const alertSchema = new Schema({
  alertId: { type: String, required: true, unique: true, index: true },
  corpId: { type: String, required: true, index: true },
  type: { type: String, required: true },
  severity: { type: String, enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'], default: 'INFO' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  triggeredAt: { type: Date, default: Date.now },
  acknowledgedAt: Date,
  resolvedAt: Date,
  metadata: { type: Schema.Types.Mixed, default: {} },
});

const subscriptionSchema = new Schema({
  subscriptionId: { type: String, required: true, unique: true, index: true },
  corpId: { type: String, required: true, index: true },
  entityCorpId: { type: String, required: true },
  alertTypes: [String],
  notifyEmail: { type: Boolean, default: true },
  notifySms: { type: Boolean, default: false },
  notifyWebhook: { type: Boolean, default: false },
  webhookUrl: String,
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const Alert = model('Alert', alertSchema);
const Subscription = model('Subscription', subscriptionSchema);

function generateId(prefix: string): string {
  return `${prefix}-${randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString(36)}`;
}

function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (req.headers['x-internal-token'] === INTERNAL_TOKEN) return next();
  next();
}

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'corpid-monitor-service', timestamp: new Date().toISOString() });
});

// Create alert
app.post('/alerts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId, type, severity, title, message, metadata } = req.body;

    const alert = new Alert({
      alertId: generateId('ALT'),
      corpId,
      type,
      severity: severity || 'INFO',
      title,
      message,
      metadata: metadata || {},
    });

    await alert.save();

    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    logger.error('Error creating alert:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create alert' } });
  }
});

// Get alerts for entity
app.get('/alerts/:corpId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;
    const { severity, acknowledged } = req.query;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));

    const filter: Record<string, unknown> = { corpId };
    if (severity) filter.severity = severity;
    if (acknowledged === 'true') filter.acknowledgedAt = { $ne: null };
    else if (acknowledged === 'false') filter.acknowledgedAt = null;

    const [alerts, total] = await Promise.all([
      Alert.find(filter).sort({ triggeredAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
      Alert.countDocuments(filter),
    ]);

    res.json({ success: true, data: { items: alerts, total, page, pageSize, totalPages: Math.ceil(total / pageSize) } });
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Acknowledge alert
app.patch('/alerts/:alertId/acknowledge', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;

    const alert = await Alert.findOneAndUpdate(
      { alertId },
      { $set: { acknowledgedAt: new Date() } },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    logger.error('Error acknowledging alert:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Subscribe to monitoring
app.post('/monitor/subscribe', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId, entityCorpId, alertTypes, notifyEmail, notifySms, notifyWebhook, webhookUrl } = req.body;

    const subscription = new Subscription({
      subscriptionId: generateId('SUB'),
      corpId,
      entityCorpId,
      alertTypes: alertTypes || ['LICENSE_EXPIRY', 'VERIFICATION_EXPIRY', 'RISK_CHANGE'],
      notifyEmail: notifyEmail ?? true,
      notifySms: notifySms ?? false,
      notifyWebhook: notifyWebhook ?? false,
      webhookUrl,
    });

    await subscription.save();

    res.status(201).json({ success: true, data: subscription });
  } catch (error) {
    logger.error('Error creating subscription:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Get monitoring status
app.get('/monitor/:corpId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;

    const [alerts, subscriptions] = await Promise.all([
      Alert.find({ corpId, resolvedAt: null }).sort({ triggeredAt: -1 }).limit(10).lean(),
      Subscription.find({ entityCorpId: corpId, active: true }).lean(),
    ]);

    res.json({
      success: true,
      data: {
        activeAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.severity === 'CRITICAL').length,
        subscriptions: subscriptions.length,
        recentAlerts: alerts.slice(0, 5),
      },
    });
  } catch (error) {
    logger.error('Error fetching monitoring status:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Get alert stats
app.get('/alerts/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const stats = await Alert.aggregate([
      { $group: { _id: { severity: '$severity', type: '$type' }, count: { $sum: 1 } } },
    ]);

    const total = await Alert.countDocuments();
    const unacknowledged = await Alert.countDocuments({ acknowledgedAt: null });

    res.json({
      success: true,
      data: {
        bySeverity: Object.fromEntries(
          ['INFO', 'WARNING', 'ERROR', 'CRITICAL'].map(s => [s, stats.filter(x => x._id.severity === s).reduce((a, b) => a + b.count, 0)])
        ),
        total,
        unacknowledged,
      },
    });
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Monitor service error:', err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
});

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');
    await Promise.all([Alert.createIndexes(), Subscription.createIndexes()]);
    logger.info('Indexes created');
    app.listen(PORT, () => logger.info(`CorpID Monitor Service running on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
export default app;
