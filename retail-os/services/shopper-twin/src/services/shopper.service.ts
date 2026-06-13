import { ShopperProfile } from '../schemas/shopper.schema';
import { ShopperModel } from '../models/shopper.model';
import Redis from 'redis';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

export class ShopperService {
  private redisClient: Redis.RedisType | null = null;
  private profiles: Map<string, ShopperProfile> = new Map();

  constructor(redisUrl?: string) {
    if (redisUrl) {
      this.redisClient = Redis.createClient({ url: redisUrl });
    }
  }

  async initialize(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.connect();
      logger.info('Shopper twin connected to Redis');
    }
  }

  async createShopper(data: { email: string; firstName: string; lastName: string; phone?: string; dateOfBirth?: string }): Promise<ShopperProfile> {
    const existingShopper = await this.findShopperByEmail(data.email);
    if (existingShopper) {
      throw new Error(`Shopper with email ${data.email} already exists`);
    }

    const profile = ShopperModel.createProfile(data);
    await this.saveProfile(profile);
    logger.info(`Created shopper profile: ${profile.id}`);
    return profile;
  }

  async getShopper(id: string): Promise<ShopperProfile | null> {
    const cached = await this.getFromCache(id);
    if (cached) {
      return cached;
    }

    const profile = this.profiles.get(id);
    if (profile) {
      await this.setCache(id, profile);
      return profile;
    }

    return null;
  }

  async findShopperByEmail(email: string): Promise<ShopperProfile | null> {
    for (const profile of this.profiles.values()) {
      if (profile.email === email) {
        return profile;
      }
    }
    return null;
  }

  async updateShopper(id: string, updates: Partial<ShopperProfile>): Promise<ShopperProfile | null> {
    const profile = await this.getShopper(id);
    if (!profile) {
      return null;
    }

    const updated = ShopperModel.updateProfile(profile, updates);
    await this.saveProfile(updated);
    await this.invalidateCache(id);
    logger.info(`Updated shopper profile: ${id}`);
    return updated;
  }

  async deleteShopper(id: string): Promise<boolean> {
    const existed = this.profiles.has(id);
    if (existed) {
      this.profiles.delete(id);
      await this.invalidateCache(id);
      logger.info(`Deleted shopper profile: ${id}`);
    }
    return existed;
  }

  async listShoppers(filter?: { loyaltyTier?: string; minPoints?: number }): Promise<ShopperProfile[]> {
    let shoppers = Array.from(this.profiles.values());

    if (filter?.loyaltyTier) {
      shoppers = shoppers.filter(s => s.loyaltyTier === filter.loyaltyTier);
    }
    if (filter?.minPoints !== undefined) {
      shoppers = shoppers.filter(s => s.loyaltyPoints >= filter.minPoints);
    }

    return shoppers;
  }

  async addLoyaltyPoints(id: string, points: number): Promise<ShopperProfile | null> {
    const profile = await this.getShopper(id);
    if (!profile) {
      return null;
    }

    const updated = ShopperModel.addLoyaltyPoints(profile, points);
    await this.saveProfile(updated);
    await this.invalidateCache(id);
    logger.info(`Added ${points} loyalty points to shopper: ${id}`);
    return updated;
  }

  async recordPurchase(id: string, orderTotal: number, categories: string[]): Promise<ShopperProfile | null> {
    const profile = await this.getShopper(id);
    if (!profile) {
      return null;
    }

    const updated = ShopperModel.recordPurchase(profile, orderTotal, categories);
    await this.saveProfile(updated);
    await this.invalidateCache(id);
    return updated;
  }

  async recordSession(id: string, durationMinutes: number): Promise<ShopperProfile | null> {
    const profile = await this.getShopper(id);
    if (!profile) {
      return null;
    }

    const updated = ShopperModel.recordSession(profile, durationMinutes);
    await this.saveProfile(updated);
    await this.invalidateCache(id);
    return updated;
  }

  async recordBasketAbandonment(id: string): Promise<ShopperProfile | null> {
    const profile = await this.getShopper(id);
    if (!profile) {
      return null;
    }

    const updated = ShopperModel.recordBasketAbandonment(profile);
    await this.saveProfile(updated);
    await this.invalidateCache(id);
    return updated;
  }

  async getShopperInsights(id: string): Promise<{
    profile: ShopperProfile;
    lifetimeValue: 'low' | 'medium' | 'high' | 'vip';
    engagementScore: number;
    recommendedTier: string;
  } | null> {
    const profile = await this.getShopper(id);
    if (!profile) {
      return null;
    }

    const lifetimeValue = profile.purchaseHistory.totalSpent >= 5000 ? 'vip' :
                          profile.purchaseHistory.totalSpent >= 2000 ? 'high' :
                          profile.purchaseHistory.totalSpent >= 500 ? 'medium' : 'low';

    const engagementScore = Math.min(100, Math.round(
      (profile.behaviorMetrics.conversionRate * 30) +
      (profile.behaviorMetrics.sessionsCount * 2) +
      (profile.purchaseHistory.totalOrders * 5) +
      (profile.loyaltyPoints / 100)
    ));

    const recommendedTier = ShopperModel.calculateLoyaltyTier(profile.loyaltyPoints + 1000);

    return {
      profile,
      lifetimeValue,
      engagementScore,
      recommendedTier,
    };
  }

  private async saveProfile(profile: ShopperProfile): Promise<void> {
    this.profiles.set(profile.id, profile);
    await this.setCache(profile.id, profile);
  }

  private async getFromCache(id: string): Promise<ShopperProfile | null> {
    if (!this.redisClient) return null;
    try {
      const cached = await this.redisClient.get(`shopper:${id}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error(`Cache read error: ${error}`);
      return null;
    }
  }

  private async setCache(id: string, profile: ShopperProfile): Promise<void> {
    if (!this.redisClient) return;
    try {
      await this.redisClient.setEx(`shopper:${id}`, 3600, JSON.stringify(profile));
    } catch (error) {
      logger.error(`Cache write error: ${error}`);
    }
  }

  private async invalidateCache(id: string): Promise<void> {
    if (!this.redisClient) return;
    try {
      await this.redisClient.del(`shopper:${id}`);
    } catch (error) {
      logger.error(`Cache invalidation error: ${error}`);
    }
  }

  async close(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}
