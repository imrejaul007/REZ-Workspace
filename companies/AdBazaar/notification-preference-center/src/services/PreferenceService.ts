import { Preference, IPreference } from '../models/Preference';
import { Subscription, ISubscription } from '../models/Subscription';
import { createClient, RedisClientType } from 'redis';
import logger from 'utils/logger.js';
import { preferencesUpdatedTotal, subscriptionsTotal, activeUsersGauge, channelEngagementGauge } from '../utils/metrics';

export class PreferenceService {
  private redisClient: RedisClientType | null = null;

  async initialize(): Promise<void> {
    try {
      this.redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
      await this.redisClient.connect();
      logger.info('Redis connected for preferences');
    } catch (error) {
      logger.warn('Redis not available, continuing without Redis');
    }
  }

  async getPreferences(userId: string): Promise<IPreference | null> {
    return Preference.findOne({ userId });
  }

  async getOrCreatePreferences(userId: string): Promise<IPreference> {
    let preferences = await Preference.findOne({ userId });

    if (!preferences) {
      preferences = new Preference({
        userId,
        channels: {
          email: { enabled: true, frequency: 'realtime' },
          sms: { enabled: true },
          push: { enabled: true, sound: true, vibration: true },
          inApp: { enabled: true, sound: true },
        },
        categories: {},
        marketing: { enabled: true, frequency: 'weekly', categories: [] },
        transactional: { enabled: true, types: [] },
      });
      await preferences.save();
      await this.updateActiveUsersGauge();
    }

    return preferences;
  }

  async updatePreferences(userId: string, updates: Partial<IPreference>): Promise<IPreference> {
    const preferences = await this.getOrCreatePreferences(userId);

    if (updates.channels) {
      for (const [channel, settings] of Object.entries(updates.channels)) {
        if (settings && typeof settings === 'object') {
          (preferences.channels as any)[channel] = {
            ...(preferences.channels as any)[channel],
            ...settings,
          };
          preferencesUpdatedTotal.labels(channel, 'update').inc();
        }
      }
    }

    if (updates.categories) {
      for (const [category, settings] of Object.entries(updates.categories)) {
        if (settings && typeof settings === 'object') {
          (preferences.categories as any)[category] = settings;
        }
      }
    }

    if (updates.marketing) {
      preferences.marketing = {
        ...preferences.marketing,
        ...updates.marketing,
      };
    }

    if (updates.transactional) {
      preferences.transactional = {
        ...preferences.transactional,
        ...updates.transactional,
      };
    }

    await preferences.save();
    logger.info(`Preferences updated for user: ${userId}`);

    return preferences;
  }

  async resetPreferences(userId: string): Promise<IPreference> {
    const preferences = await this.getOrCreatePreferences(userId);

    preferences.channels = {
      email: { enabled: true, frequency: 'realtime' },
      sms: { enabled: true },
      push: { enabled: true, sound: true, vibration: true },
      inApp: { enabled: true, sound: true },
    };
    preferences.categories = {};
    preferences.marketing = { enabled: true, frequency: 'weekly', categories: [] };
    preferences.transactional = { enabled: true, types: [] };

    await preferences.save();
    logger.info(`Preferences reset for user: ${userId}`);

    return preferences;
  }

  async canSendNotification(userId: string, channel: string, category?: string): Promise<boolean> {
    const preferences = await Preference.findOne({ userId });
    if (!preferences) return true;

    const channelSettings = (preferences.channels as any)[channel];
    if (!channelSettings?.enabled) return false;

    if (channelSettings?.quietHours) {
      const now = new Date();
      const timezone = channelSettings.quietHours.timezone || 'UTC';
      const hour = parseInt(now.toLocaleString('en-US', { hour: '2-digit', hour12: false, timeZone: timezone }), 10);
      const start = parseInt(channelSettings.quietHours.start.split(':')[0], 10);
      const end = parseInt(channelSettings.quietHours.end.split(':')[0], 10);

      if (start< end) {
        if (hour >= start && hour < end) return false;
      } else {
        if (hour >= start || hour < end) return false;
      }
    }

    if (category) {
      const categorySettings = (preferences.categories as any)[category];
      if (categorySettings && !categorySettings.enabled) return false;
    }

    return true;
  }

  async subscribe(data: {
    userId: string;
    type: 'campaign' | 'promotion' | 'update' | 'reminder' | 'alert';
    name: string;
    description?: string;
    channels?: string[];
    frequency?: 'realtime' | 'daily' | 'weekly' | 'monthly';
    source?: 'user' | 'system' | 'advertiser';
    metadata?: Record<string, unknown>;
  }): Promise<ISubscription> {
    const existing = await Subscription.findOne({
      userId: data.userId,
      type: data.type,
      name: data.name,
      status: 'active',
    });

    if (existing) {
      throw new Error('Subscription already exists');
    }

    const subscription = new Subscription({
      ...data,
      status: 'active',
      source: data.source || 'user',
      channels: data.channels || ['email', 'push'],
    });

    await subscription.save();
    subscriptionsTotal.labels(data.type, 'subscribe').inc();

    logger.info(`Subscription created for user: ${data.userId}`, { type: data.type, name: data.name });
    return subscription;
  }

  async unsubscribe(subscriptionId: string, userId: string): Promise<boolean> {
    const subscription = await Subscription.findOneAndUpdate(
      { _id: subscriptionId, userId },
      {
        status: 'unsubscribed',
        unsubscribedAt: new Date(),
      },
      { new: true }
    );

    if (subscription) {
      subscriptionsTotal.labels(subscription.type, 'unsubscribe').inc();
      logger.info(`Subscription unsubscribed: ${subscriptionId}`);
      return true;
    }
    return false;
  }

  async getUserSubscriptions(userId: string, options: {
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ subscriptions: ISubscription[]; total: number }> {
    const { type, status, page = 1, limit = 50 } = options;
    const query: Record<string, unknown> = { userId };

    if (type) query.type = type;
    if (status) query.status = status;

    const [subscriptions, total] = await Promise.all([
      Subscription.find(query).sort({ subscribedAt: -1 }).skip((page - 1) * limit).limit(limit),
      Subscription.countDocuments(query),
    ]);

    return { subscriptions, total };
  }

  async pauseSubscription(subscriptionId: string, userId: string): Promise<ISubscription | null> {
    return Subscription.findOneAndUpdate(
      { _id: subscriptionId, userId, status: 'active' },
      { status: 'paused' },
      { new: true }
    );
  }

  async resumeSubscription(subscriptionId: string, userId: string): Promise<ISubscription | null> {
    return Subscription.findOneAndUpdate(
      { _id: subscriptionId, userId, status: 'paused' },
      { status: 'active' },
      { new: true }
    );
  }

  async getPreferenceAnalytics(userId: string): Promise<{
    channels: {
      email: { enabled: boolean; frequency: string };
      sms: { enabled: boolean };
      push: { enabled: boolean };
      inApp: { enabled: boolean };
    };
    activeSubscriptions: number;
    categories: string[];
    marketingEnabled: boolean;
  }> {
    const preferences = await this.getOrCreatePreferences(userId);
    const subscriptions = await Subscription.find({ userId, status: 'active' });

    return {
      channels: preferences.channels as any,
      activeSubscriptions: subscriptions.length,
      categories: Object.keys(preferences.categories as any),
      marketingEnabled: preferences.marketing.enabled,
    };
  }

  async bulkUpdateCategory(userId: string, category: string, enabled: boolean, channels?: string[]): Promise<IPreference> {
    const preferences = await this.getOrCreatePreferences(userId);

    (preferences.categories as any)[category] = {
      enabled,
      channels: channels || ['email', 'push', 'sms', 'inApp'],
    };

    await preferences.save();
    preferencesUpdatedTotal.labels('category', category).inc();

    return preferences;
  }

  async optOutAllMarketing(userId: string): Promise<IPreference> {
    const preferences = await this.getOrCreatePreferences(userId);

    preferences.marketing.enabled = false;
    await preferences.save();

    await Subscription.updateMany(
      { userId, type: { $in: ['campaign', 'promotion'] }, status: 'active' },
      { status: 'unsubscribed', unsubscribedAt: new Date() }
    );

    preferencesUpdatedTotal.labels('marketing', 'optout').inc();
    logger.info(`User opted out of all marketing: ${userId}`);

    return preferences;
  }

  private async updateActiveUsersGauge(): Promise<void> {
    const count = await Preference.countDocuments();
    activeUsersGauge.set(count);
  }

  async cleanup(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}

export const preferenceService = new PreferenceService();