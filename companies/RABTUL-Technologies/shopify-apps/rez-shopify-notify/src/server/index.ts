/**
 * ReZ Notify - Shopify App
 * Multi-channel Notifications
 */

import 'dotenv/config';
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Notification, NotificationTemplate } from '../models/Notification';

const { MONGODB_URI } = process.env;
const PORT = parseInt(process.env.PORT || '3003', 10);
const app = express();
app.use(express.json());

async function connectDB() {
  await mongoose.connect(MONGODB_URI || 'mongodb://localhost:27017/rez_notify');
}

// Send notification
app.post('/api/notify/send', async (req: Request, res: Response) => {
  const { shop, type, customerId, customerEmail, customerPhone, title, message } = req.body;

  const notification = await Notification.create({
    shop: shop.toLowerCase(),
    type,
    customerId,
    customerEmail,
    customerPhone,
    title,
    message,
    status: 'pending',
  });

  // Simulate sending
  console.log(`[Notify] Sending ${type} to ${customerEmail || customerPhone}: ${title}`);
  notification.status = 'sent';
  notification.sentAt = new Date();
  await notification.save();

  res.json({ success: true, notification });
});

// Broadcast to segment
app.post('/api/notify/broadcast', async (req: Request, res: Response) => {
  const { shop, templateId, customerIds } = req.body;
  const template = await NotificationTemplate.findById(templateId);

  if (!template) { res.status(404).json({ error: 'Template not found' }); return; }

  let sent = 0;
  for (const customerId of customerIds) {
    await Notification.create({
      shop: shop.toLowerCase(),
      type: template.type,
      templateId,
      customerId,
      title: template.title,
      message: template.body,
      status: 'sent',
      sentAt: new Date(),
    });
    sent++;
  }

  res.json({ success: true, sent });
});

// Get stats
app.get('/api/notify/stats/:shop', async (req: Request, res: Response) => {
  const { shop } = req.params;
  const [sent, delivered, read] = await Promise.all([
    Notification.countDocuments({ shop: shop.toLowerCase(), status: 'sent' }),
    Notification.countDocuments({ shop: shop.toLowerCase(), status: 'delivered' }),
    Notification.countDocuments({ shop: shop.toLowerCase(), readAt: { $exists: true } }),
  ]);
  res.json({ success: true, stats: { sent, delivered, read } });
});

app.get('/health', (req: Request, res: Response) => res.json({ status: 'ok', service: 'rez-notify' }));

async function main() {
  await connectDB();
  app.listen(PORT, () => console.log(`ReZ Notify running on port ${PORT}`));
}
main().catch(console.error);
