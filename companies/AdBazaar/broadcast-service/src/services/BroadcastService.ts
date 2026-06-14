import axios from 'axios';
import { Broadcast, IBroadcast } from '../models/Broadcast';
import { Segment, ISegment } from '../models/Segment';
import { Send, ISend } from '../models/Send';
import { Analytics, IAnalytics } from '../models/Analytics';
import { createClient, RedisClientType } from 'redis';
import logger from 'utils/logger.js';
import { broadcastsTotal, messagesSentTotal, activeBroadcastsGauge, recipientsGauge } from '../utils/metrics';

interface Recipient {
  userId: string;
  email?: string;
  phone?: string;
  pushToken?: string;
  variables?: Record<string, unknown>;
}

export class BroadcastService {
  private redisClient: RedisClientType | null = null;
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  async initialize(): Promise<void> {
    try {
      this.redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
      await this.redisClient.connect();
      logger.info('Redis connected for broadcast service');
    } catch (error) {
      logger.warn('Redis not available, continuing without Redis');
    }

    this.processingInterval = setInterval(() => this.processScheduledBroadcasts(), 60000);
  }

  async createBroadcast(data: {
    name: string;
    subject?: string;
    content: string;
    channel: 'email' | 'sms' | 'push' | 'inApp';
    segmentId?: string;
    segmentCriteria?: Record<string, unknown>;
    ownerId: string;
    metadata?: Record<string, unknown>;
  }): Promise<IBroadcast> {
    const broadcast = new Broadcast({
      ...data,
      status: 'draft',
      recipientCount: 0,
      sentCount: 0,
      deliveredCount: 0,
      failedCount: 0,
    });

    await broadcast.save();
    await this.updateActiveBroadcastsGauge();

    logger.info(`Broadcast created: ${broadcast._id}`, { name: data.name, channel: data.channel });
    return broadcast;
  }

  async getBroadcast(id: string): Promise<IBroadcast | null> {
    return Broadcast.findById(id);
  }

  async getBroadcastsByOwner(ownerId: string, options: {
    status?: string;
    channel?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ broadcasts: IBroadcast[]; total: number }> {
    const { status, channel, page = 1, limit = 50 } = options;
    const query: Record<string, unknown> = { ownerId };

    if (status) query.status = status;
    if (channel) query.channel = channel;

    const [broadcasts, total] = await Promise.all([
      Broadcast.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Broadcast.countDocuments(query),
    ]);

    return { broadcasts, total };
  }

  async updateBroadcast(id: string, updates: Partial<IBroadcast>): Promise<IBroadcast | null> {
    return Broadcast.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
  }

  async deleteBroadcast(id: string): Promise<boolean> {
    const result = await Broadcast.findByIdAndDelete(id);
    if (result) {
      await Send.deleteMany({ broadcastId: id });
      await Analytics.deleteMany({ broadcastId: id });
      await this.updateActiveBroadcastsGauge();
      return true;
    }
    return false;
  }

  async scheduleBroadcast(id: string, scheduledAt: Date): Promise<IBroadcast | null> {
    return Broadcast.findByIdAndUpdate(
      id,
      { status: 'scheduled', scheduledAt },
      { new: true }
    );
  }

  async sendBroadcast(id: string, recipients: Recipient[]): Promise<{ sendCount: number }> {
    const broadcast = await Broadcast.findById(id);
    if (!broadcast) throw new Error('Broadcast not found');

    if (broadcast.status === 'sending') {
      throw new Error('Broadcast already sending');
    }

    broadcast.status = 'sending';
    broadcast.startedAt = new Date();
    broadcast.recipientCount = recipients.length;
    await broadcast.save();

    await this.updateActiveBroadcastsGauge();

    const sends: ISend[] = [];
    for (const recipient of recipients) {
      const send = new Send({
        broadcastId: broadcast._id,
        userId: recipient.userId,
        recipient: recipient.email || recipient.phone || recipient.pushToken || '',
        channel: broadcast.channel,
        status: 'pending',
      });
      sends.push(send);
    }

    await Send.insertMany(sends);
    await recipientsGauge.set(recipients.length);

    setTimeout(() => this.processBroadcastQueue(id), 1000);

    logger.info(`Broadcast queued: ${id}`, { recipientCount: recipients.length });
    return { sendCount: recipients.length };
  }

  private async processBroadcastQueue(broadcastId: string): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const broadcast = await Broadcast.findById(broadcastId);
      if (!broadcast || broadcast.status !== 'sending') {
        this.isProcessing = false;
        return;
      }

      const pendingSends = await Send.find({
        broadcastId,
        status: 'pending',
      }).limit(100);

      if (pendingSends.length === 0) {
        await this.completeBroadcast(broadcastId);
        this.isProcessing = false;
        return;
      }

      for (const send of pendingSends) {
        try {
          await this.sendToRecipient(broadcast, send);
 } catch (error) {
          logger.error(`Failed to send to ${send.recipient}`, { error });
          await Send.findByIdAndUpdate(send._id, {
            status: 'failed',
            failedAt: new Date(),
            error: (error as Error).message,
          });
        }
      }

      await this.updateBroadcastStats(broadcastId);

      setTimeout(() => this.processBroadcastQueue(broadcastId), 1000);
    } catch (error) {
      logger.error('Error processing broadcast queue', { error });
      this.isProcessing = false;
    }
  }

  private async sendToRecipient(broadcast: IBroadcast, send: ISend): Promise<void> {
    const content = broadcast.content;

    switch (broadcast.channel) {
      case 'email':
        await this.sendEmail(broadcast, send);
        break;
      case 'sms':
        await this.sendSMS(broadcast, send);
        break;
      case 'push':
        await this.sendPush(broadcast, send);
        break;
      case 'inApp':
        await this.sendInApp(broadcast, send);
        break;
    }

    await Send.findByIdAndUpdate(send._id, {
      status: 'sent',
      sentAt: new Date(),
    });

    messagesSentTotal.labels(broadcast.channel, 'sent').inc();
  }

  private async sendEmail(broadcast: IBroadcast, send: ISend): Promise<void> {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      logger.warn('SendGrid API key not configured');
      return;
    }

    await axios.post('https://api.sendgrid.com/v3/mail/send', {
      personalizations: [{ to: [{ email: send.recipient }] }],
      from: { email: process.env.EMAIL_FROM_ADDRESS || 'noreply@adbazaar.com' },
      subject: broadcast.subject || 'Message from AdBazaar',
      content: [{ type: 'text/html', value: broadcast.content }],
    }, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  private async sendSMS(broadcast: IBroadcast, send: ISend): Promise<void> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      logger.warn('Twilio credentials not configured');
      return;
    }

    await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      new URLSearchParams({
        To: send.recipient,
        From: fromNumber,
        Body: broadcast.content,
      }),
      {
        auth: { username: accountSid, password: authToken },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );
  }

  private async sendPush(broadcast: IBroadcast, send: ISend): Promise<void> {
    logger.info('Push notification would be sent', { recipient: send.recipient, content: broadcast.content });
  }

  private async sendInApp(broadcast: IBroadcast, send: ISend): Promise<void> {
    logger.info('In-app notification would be sent', { userId: send.userId, content: broadcast.content });
  }

  private async updateBroadcastStats(broadcastId: string): Promise<void> {
    const stats = await Send.aggregate([
      { $match: { broadcastId: broadcastId as unknown as typeof import('mongoose').Types.ObjectId } },
      { $group: {
        _id: null,
        sent: { $sum: { $cond: [{ $in: ['$status', ['sent', 'delivered']] }, 1, 0] } },
        delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
      }},
    ]);

    if (stats.length > 0) {
      await Broadcast.findByIdAndUpdate(broadcastId, {
        sentCount: stats[0].sent,
        deliveredCount: stats[0].delivered,
        failedCount: stats[0].failed,
      });
    }
  }

  private async completeBroadcast(broadcastId: string): Promise<void> {
    const broadcast = await Broadcast.findByIdAndUpdate(
      broadcastId,
      { status: 'completed', completedAt: new Date() },
      { new: true }
    );

    if (broadcast) {
      broadcastsTotal.labels(broadcast.channel, 'completed').inc();
      await this.updateActiveBroadcastsGauge();
      await this.recordAnalytics(broadcastId);
      logger.info(`Broadcast completed: ${broadcastId}`);
    }
  }

  private async recordAnalytics(broadcastId: string): Promise<void> {
    const broadcast = await Broadcast.findById(broadcastId);
    if (!broadcast) return;

    const analytics = new Analytics({
      broadcastId,
      timestamp: new Date(),
      metrics: {
        sent: broadcast.sentCount,
        delivered: broadcast.deliveredCount,
        failed: broadcast.failedCount,
        bounced: 0,
        opened: broadcast.openedCount || 0,
        clicked: broadcast.clickedCount || 0,
        unsubscribed: 0,
      },
    });

    await analytics.save();
  }

  async getBroadcastAnalytics(id: string): Promise<{
    broadcast: IBroadcast;
    sends: {
      total: number;
      pending: number;
      sent: number;
      delivered: number;
      failed: number;
    };
    engagement: {
      openRate: number;
      clickRate: number;
    };
    timeline: Array<{
      timestamp: Date;
      sent: number;
      delivered: number;
    }>;
  }> {
    const broadcast = await Broadcast.findById(id);
    if (!broadcast) throw new Error('Broadcast not found');

    const sends = await Send.find({ broadcastId: id });
    const analytics = await Analytics.find({ broadcastId: id }).sort({ timestamp: 1 });

    const stats = {
      total: sends.length,
      pending: sends.filter(s => s.status === 'pending').length,
      sent: sends.filter(s => s.status === 'sent').length,
      delivered: sends.filter(s => s.status === 'delivered').length,
      failed: sends.filter(s => s.status === 'failed').length,
    };

    const openRate = broadcast.sentCount > 0 ? ((broadcast.openedCount || 0) / broadcast.sentCount) * 100 : 0;
    const clickRate = broadcast.sentCount > 0 ? ((broadcast.clickedCount || 0) / broadcast.sentCount) * 100 : 0;

    return {
      broadcast,
      sends: stats,
      engagement: { openRate, clickRate },
      timeline: analytics.map(a => ({
        timestamp: a.timestamp,
        sent: a.metrics.sent,
        delivered: a.metrics.delivered,
      })),
    };
  }

  async createSegment(data: {
    name: string;
    description?: string;
    criteria: ISegment['criteria'];
    ownerId: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
  }): Promise<ISegment> {
    const segment = new Segment({
      ...data,
      estimatedSize: 0,
    });

    await segment.save();
    return segment;
  }

  async getSegment(id: string): Promise<ISegment | null> {
    return Segment.findById(id);
  }

  async getSegmentsByOwner(ownerId: string): Promise<ISegment[]> {
    return Segment.find({ ownerId }).sort({ createdAt: -1 });
  }

  async deleteSegment(id: string): Promise<boolean> {
    const result = await Segment.findByIdAndDelete(id);
    return !!result;
  }

  private async processScheduledBroadcasts(): Promise<void> {
    const scheduledBroadcasts = await Broadcast.find({
      status: 'scheduled',
      scheduledAt: { $lte: new Date() },
    });

    for (const broadcast of scheduledBroadcasts) {
      logger.info(`Processing scheduled broadcast: ${broadcast._id}`);
    }
  }

  private async updateActiveBroadcastsGauge(): Promise<void> {
    const count = await Broadcast.countDocuments({ status: { $in: ['sending', 'scheduled'] } });
    activeBroadcastsGauge.set(count);
  }

  async pauseBroadcast(id: string): Promise<IBroadcast | null> {
    return Broadcast.findByIdAndUpdate(id, { status: 'paused' }, { new: true });
  }

  async resumeBroadcast(id: string): Promise<IBroadcast | null> {
    return Broadcast.findByIdAndUpdate(id, { status: 'sending' }, { new: true });
  }

  async cleanup(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}

export const broadcastService = new BroadcastService();