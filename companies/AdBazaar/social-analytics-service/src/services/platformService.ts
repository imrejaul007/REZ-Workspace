import { Platform, IPlatform } from '../models';
import { createChildLogger } from '../utils/logger';

const logger = createChildLogger('PlatformService');

export class PlatformService {
  async connect(userId: string, data: {
    platform: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    accountId: string;
    accountName: string;
    accountType?: 'personal' | 'business';
    permissions?: string[];
  }): Promise<IPlatform> {
    logger.info('Connecting platform', { userId, platform: data.platform });

    // Check if platform already connected
    const existing = await Platform.findOne({ userId, platform: data.platform });
    if (existing) {
      // Update existing
      existing.accessToken = data.accessToken;
      existing.refreshToken = data.refreshToken || existing.refreshToken;
      existing.expiresAt = data.expiresAt || existing.expiresAt;
      existing.lastSync = new Date();
      await existing.save();
      return existing;
    }

    const platform = new Platform({
      userId,
      platform: data.platform,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt,
      accountId: data.accountId,
      accountName: data.accountName,
      accountType: data.accountType || 'personal',
      permissions: data.permissions || [],
      isActive: true,
      lastSync: new Date()
    });

    await platform.save();
    logger.info('Platform connected', { platformId: platform._id });
    return platform;
  }

  async disconnect(userId: string, platform: string): Promise<boolean> {
    const result = await Platform.findOneAndUpdate(
      { userId, platform },
      { isActive: false },
      { new: true }
    );
    return !!result;
  }

  async getConnectedPlatforms(userId: string): Promise<IPlatform[]> {
    return Platform.find({ userId, isActive: true }).select('-accessToken -refreshToken');
  }

  async getPlatformByUserAndType(userId: string, platform: string): Promise<IPlatform | null> {
    return Platform.findOne({ userId, platform, isActive: true });
  }

  async updateLastSync(userId: string, platform: string): Promise<void> {
    await Platform.findOneAndUpdate({ userId, platform }, { lastSync: new Date() });
  }

  async isTokenExpired(platform: IPlatform): Promise<boolean> {
    if (!platform.expiresAt) return false;
    return new Date() >= platform.expiresAt;
  }
}

export const platformService = new PlatformService();