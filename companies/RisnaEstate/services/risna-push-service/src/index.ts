import { logger } from './logger';
/**
 * RisnaEstate - Mobile Push Notification Service
 *
 * Firebase Cloud Messaging for mobile app push.
 */

import express, { Request, Response } from 'express';
import mongoose, { Schema } from 'mongoose';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4126;

app.use(express.json());
app.use(cors());

const SubscriptionSchema = new Schema({
  userId: { type: String, index: true },
  fcmToken: String,
  device: { type: String, enum: ['ios', 'android'] },
  notifications: {
    leads: { type: Boolean, default: true },
    bookings: { type: Boolean, default: true },
    messages: { type: Boolean, default: true },
    updates: { type: Boolean, default: true }
  },
  lastActive: Date
});

const Subscription = mongoose.model('Subscription', SubscriptionSchema);
const PushLogSchema = new Schema({ logId: String, userId: String, title: String, status: String, sentAt: Date });
const PushLog = mongoose.model('PushLog', PushLogSchema);

app.get('/health', (req, res) => res.json({ service: 'push-notifications', status: 'ok' }));

/**
 * Register device
 * POST /api/subscriptions
 */
app.post('/api/subscriptions', async (req: Request, res: Response) => {
  try {
    const { userId, fcmToken, device, notifications } = req.body;

    const sub = await Subscription.findOneAndUpdate(
      { userId },
      { fcmToken, device, notifications, lastActive: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true, subscription: sub });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send push notification
 * POST /api/send
 */
app.post('/api/send', async (req: Request, res: Response) => {
  try {
    const { userId, title, body, data, badge } = req.body;

    const sub = await Subscription.findOne({ userId });
    if (!sub?.fcmToken) {
      return res.json({ success: false, reason: 'No FCM token' });
    }

    // In production, would send to Firebase
    // For now, just log
    await new PushLog({
      logId: `push_${Date.now()}`,
      userId,
      title,
      status: 'sent',
      sentAt: new Date()
    }).save();

    res.json({ success: true, sent: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send to topic
 * POST /api/send/topic
 */
app.post('/api/send/topic', async (req: Request, res: Response) => {
  try {
    const { topic, title, body, data } = req.body;

    // Would send to Firebase topic
    res.json({ success: true, topic });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function start() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/risna-push');
  await Subscription.createIndexes();
  app.listen(PORT, () => logger.info(`🚀 Push Service running on port ${PORT}`));
}

start();

export default app;
