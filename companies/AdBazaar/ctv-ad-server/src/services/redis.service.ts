import { createClient, RedisClientType } from 'redis';
import { config } from '../config/index.js';

class RedisService {
  private client: RedisClientType | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.client && this.isConnected) {
      return;
    }

    try {
      this.client = createClient({
        url: config.redis.url,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis max reconnection attempts reached');
              return new Error('Redis max reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      this.client.on('error', (err) => {
        logger.error('Redis error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis connected');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      // Don't throw - allow service to run without Redis
      this.isConnected = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }

  getClient(): RedisClientType | null {
    return this.client;
  }

  isHealthy(): boolean {
    return this.isConnected && this.client !== null;
  }

  // Frequency capping methods
  async incrementFrequency(deviceId: string, campaignId: string, windowHours: number): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }

    const key = `freq:${campaignId}:${deviceId}`;
    const now = Date.now();
    const windowMs = windowHours * 60 * 60 * 1000;

    try {
      // Increment counter
      await this.client.zAdd(key, { score: now, value: now.toString() });

      // Remove expired entries
      const windowStart = now - windowMs;
      await this.client.zRemRangeByScore(key, 0, windowStart);

      // Get count
      const count = await this.client.zCard(key);

      // Set TTL
      await this.client.expire(key, windowHours * 3600);

      return count;
    } catch (error) {
      logger.error('Redis frequency increment error:', error);
      return 0;
    }
  }

  async getFrequency(deviceId: string, campaignId: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }

    const key = `freq:${campaignId}:${deviceId}`;

    try {
      return await this.client.zCard(key);
    } catch (error) {
      logger.error('Redis frequency get error:', error);
      return 0;
    }
  }

  async clearFrequency(deviceId: string, campaignId: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    const key = `freq:${campaignId}:${deviceId}`;

    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis frequency clear error:', error);
    }
  }

  // Budget tracking methods
  async trackSpend(campaignId: string, amount: number): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    const key = `spend:${campaignId}:${this.getDayKey()}`;

    try {
      await this.client.incrByFloat(key, amount);
      await this.client.expire(key, 48 * 3600); // 48 hour TTL
    } catch (error) {
      logger.error('Redis track spend error:', error);
    }
  }

  async getDailySpend(campaignId: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }

    const key = `spend:${campaignId}:${this.getDayKey()}`;

    try {
      const spend = await this.client.get(key);
      return spend ? parseFloat(spend) : 0;
    } catch (error) {
      logger.error('Redis get daily spend error:', error);
      return 0;
    }
  }

  // Campaign pacing cache
  async cacheCampaignPacing(campaignId: string, pacingData: object): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    const key = `pacing:${campaignId}`;

    try {
      await this.client.set(key, JSON.stringify(pacingData), { EX: 60 }); // 60 second TTL
    } catch (error) {
      logger.error('Redis cache pacing error:', error);
    }
  }

  async getCachedPacing(campaignId: string): Promise<object | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    const key = `pacing:${campaignId}`;

    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Redis get cached pacing error:', error);
      return null;
    }
  }

  private getDayKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
}

export const redisService = new RedisService();
