import ConnectedPlatformModel, { IConnectedPlatformDocument } from '../models/connected-platform.model';
import { PlatformType } from '../models/platform-config.model';
import { ConnectPlatformInput } from '../middleware/validation.middleware';
import { NotFoundError, ConflictError } from '../middleware/error.middleware';
import { logger } from '../config/logger';
import config from '../config';

export interface PlatformFilters {
  companyId: string;
  platform?: PlatformType;
  status?: string;
  enabled?: boolean;
}

export class PlatformService {
  async connect(
    userId: string,
    companyId: string,
    data: ConnectPlatformInput
  ): Promise<IConnectedPlatformDocument> {
    // Check if platform already connected
    const existing = await ConnectedPlatformModel.findOne({
      userId,
      companyId,
      platform: data.platform,
      accountId: data.accountId,
    });

    if (existing) {
      throw new ConflictError(`Platform ${data.platform} with account ${data.accountId} already connected`);
    }

    const platform = new ConnectedPlatformModel({
      userId,
      companyId,
      platform: data.platform,
      accountId: data.accountId,
      accountName: data.accountName,
      accountHandle: data.accountHandle,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      tokenExpiresAt: data.tokenExpiresAt ? new Date(data.tokenExpiresAt) : undefined,
      permissions: data.permissions,
      enabled: true,
      status: 'active',
    });

    await platform.save();
    logger.info('Platform connected', { platform: data.platform, accountId: data.accountId, companyId });

    return platform;
  }

  async disconnect(userId: string, companyId: string, platformId: string): Promise<void> {
    const platform = await ConnectedPlatformModel.findOne({
      _id: platformId,
      companyId,
      userId,
    });

    if (!platform) {
      throw new NotFoundError(`Platform connection not found: ${platformId}`);
    }

    await ConnectedPlatformModel.findByIdAndDelete(platformId);
    logger.info('Platform disconnected', { platformId, platform: platform.platform });
  }

  async findById(id: string): Promise<IConnectedPlatformDocument> {
    const platform = await ConnectedPlatformModel.findById(id);
    if (!platform) {
      throw new NotFoundError(`Platform connection not found: ${id}`);
    }
    return platform;
  }

  async findAll(filters: PlatformFilters): Promise<IConnectedPlatformDocument[]> {
    const query: any = { companyId: filters.companyId };

    if (filters.platform) {
      query.platform = filters.platform;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.enabled !== undefined) {
      query.enabled = filters.enabled;
    }

    return ConnectedPlatformModel.find(query)
      .select('-accessToken -refreshToken')
      .sort({ createdAt: -1 })
      .lean();
  }

  async findByCompany(companyId: string): Promise<IConnectedPlatformDocument[]> {
    return ConnectedPlatformModel.find({ companyId })
      .select('-accessToken -refreshToken')
      .sort({ createdAt: -1 })
      .lean();
  }

  async findByPlatform(companyId: string, platform: PlatformType): Promise<IConnectedPlatformDocument[]> {
    return ConnectedPlatformModel.find({ companyId, platform })
      .select('-accessToken -refreshToken')
      .lean();
  }

  async getActivePlatforms(companyId: string): Promise<IConnectedPlatformDocument[]> {
    return ConnectedPlatformModel.find({
      companyId,
      enabled: true,
      status: 'active',
    })
      .select('-accessToken -refreshToken')
      .lean();
  }

  async updateToken(id: string, accessToken: string, refreshToken?: string, expiresAt?: Date): Promise<void> {
    const update: any = { accessToken };
    if (refreshToken) update.refreshToken = refreshToken;
    if (expiresAt) update.tokenExpiresAt = expiresAt;

    await ConnectedPlatformModel.findByIdAndUpdate(id, update);
    logger.info('Platform token updated', { platformId: id });
  }

  async updateStatus(id: string, status: 'active' | 'expired' | 'revoked' | 'error', errorMessage?: string): Promise<void> {
    const update: any = { status };
    if (errorMessage) update.errorMessage = errorMessage;

    await ConnectedPlatformModel.findByIdAndUpdate(id, update);
    logger.info('Platform status updated', { platformId: id, status, errorMessage });
  }

  async setEnabled(id: string, enabled: boolean): Promise<void> {
    await ConnectedPlatformModel.findByIdAndUpdate(id, { enabled });
    logger.info('Platform enabled status changed', { platformId: id, enabled });
  }

  async syncPlatform(id: string): Promise<void> {
    const platform = await this.findById(id);

    // In a real implementation, this would call the platform's API to sync data
    // For now, just update the lastSyncAt timestamp
    platform.lastSyncAt = new Date();
    await platform.save();

    logger.info('Platform synced', { platformId: id, platform: platform.platform });
  }

  async bulkSync(companyId: string): Promise<{ synced: number; failed: number }> {
    const platforms = await ConnectedPlatformModel.find({
      companyId,
      enabled: true,
      status: 'active',
    });

    let synced = 0;
    let failed = 0;

    for (const platform of platforms) {
      try {
        await this.syncPlatform(platform.id);
        synced++;
      } catch (error) {
        logger.error('Platform sync failed', { platformId: platform.id, error });
        failed++;
      }
    }

    logger.info('Bulk sync completed', { companyId, synced, failed });
    return { synced, failed };
  }

  async getPlatformStats(companyId: string): Promise<{
    total: number;
    active: number;
    expired: number;
    byPlatform: Record<string, number>;
  }> {
    const platforms = await ConnectedPlatformModel.find({ companyId });

    const stats = {
      total: platforms.length,
      active: 0,
      expired: 0,
      byPlatform: {} as Record<string, number>,
    };

    platforms.forEach((p) => {
      if (p.status === 'active') stats.active++;
      if (p.status === 'expired') stats.expired++;
      stats.byPlatform[p.platform] = (stats.byPlatform[p.platform] || 0) + 1;
    });

    return stats;
  }

  async getAccessToken(platformId: string): Promise<string> {
    const platform = await this.findById(platformId);

    if (!platform.enabled) {
      throw new ConflictError('Platform is disabled');
    }

    if (platform.status !== 'active') {
      throw new ConflictError(`Platform status is ${platform.status}`);
    }

    // Check if token is expired
    if (platform.tokenExpiresAt && platform.tokenExpiresAt < new Date()) {
      // In a real implementation, this would refresh the token
      throw new ConflictError('Platform token has expired');
    }

    return platform.accessToken;
  }
}

export const platformService = new PlatformService();