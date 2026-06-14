import { v4 as uuidv4 } from 'uuid';
import { Asset, IAsset } from '../models/Asset';
import { Version } from '../models/Version';
import { logger } from '../utils/logger';
import { recordAssetOperation, updateStorageMetrics } from '../utils/metrics';
import { IVersion } from '../models/Version';

export interface CreateAssetInput {
  name: string;
  description?: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  folderId?: string;
  tags: string[];
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
    colorSpace?: string;
    resolution?: string;
  };
  createdBy: string;
  updatedBy: string;
  permissions?: {
    public: boolean;
    allowedUsers?: string[];
    allowedRoles?: string[];
  };
}

export interface UpdateAssetInput {
  name?: string;
  description?: string;
  url?: string;
  thumbnailUrl?: string;
  folderId?: string;
  tags?: string[];
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
    colorSpace?: string;
    resolution?: string;
  };
  status?: 'draft' | 'active' | 'archived' | 'deleted';
  updatedBy: string;
}

export interface AssetFilters {
  type?: string;
  status?: string;
  folderId?: string;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class AssetService {
  async create(input: CreateAssetInput): Promise<IAsset> {
    try {
      const assetId = `asset-${uuidv4()}`;

      const asset = new Asset({
        assetId,
        ...input,
        status: 'draft'
      });

      await asset.save();
      recordAssetOperation('create', 'success');

      // Update storage metrics
      await this.updateStorageMetrics();

      logger.info('Asset created', { assetId, name: input.name });
      return asset;
    } catch (error) {
      recordAssetOperation('create', 'error');
      logger.error('Failed to create asset', { error, input });
      throw error;
    }
  }

  async findById(assetId: string): Promise<IAsset | null> {
    try {
      const asset = await Asset.findOne({ assetId });
      if (asset) {
        recordAssetOperation('read', 'success');
      } else {
        recordAssetOperation('read', 'not_found');
      }
      return asset;
    } catch (error) {
      recordAssetOperation('read', 'error');
      logger.error('Failed to find asset', { error, assetId });
      throw error;
    }
  }

  async findAll(filters: AssetFilters): Promise<{ assets: IAsset[]; total: number; page: number; limit: number }> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const query: any = {};

      if (filters.type) query.type = filters.type;
      if (filters.status) query.status = filters.status;
      if (filters.folderId) query.folderId = filters.folderId;
      if (filters.tags && filters.tags.length > 0) query.tags = { $all: filters.tags };

      if (filters.search) {
        query.$text = { $search: filters.search };
      }

      const sortField = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;

      const [assets, total] = await Promise.all([
        Asset.find(query).sort({ [sortField]: sortOrder }).skip(skip).limit(limit),
        Asset.countDocuments(query)
      ]);

      recordAssetOperation('list', 'success');

      return { assets, total, page, limit };
    } catch (error) {
      recordAssetOperation('list', 'error');
      logger.error('Failed to list assets', { error, filters });
      throw error;
    }
  }

  async update(assetId: string, input: UpdateAssetInput): Promise<IAsset | null> {
    try {
      const asset = await Asset.findOneAndUpdate(
        { assetId },
        { $set: input },
        { new: true, runValidators: true }
      );

      if (asset) {
        recordAssetOperation('update', 'success');
        await this.updateStorageMetrics();
        logger.info('Asset updated', { assetId });
      } else {
        recordAssetOperation('update', 'not_found');
      }

      return asset;
    } catch (error) {
      recordAssetOperation('update', 'error');
      logger.error('Failed to update asset', { error, assetId, input });
      throw error;
    }
  }

  async delete(assetId: string): Promise<boolean> {
    try {
      const result = await Asset.findOneAndUpdate(
        { assetId },
        { $set: { status: 'deleted' } },
        { new: true }
      );

      if (result) {
        recordAssetOperation('delete', 'success');
        await this.updateStorageMetrics();
        logger.info('Asset deleted', { assetId });
        return true;
      }

      recordAssetOperation('delete', 'not_found');
      return false;
    } catch (error) {
      recordAssetOperation('delete', 'error');
      logger.error('Failed to delete asset', { error, assetId });
      throw error;
    }
  }

  async createVersion(assetId: string, input: {
    url: string;
    thumbnailUrl?: string;
    size: number;
    checksum: string;
    changes?: string;
    createdBy: string;
  }): Promise<IVersion | null> {
    try {
      const asset = await Asset.findOne({ assetId });
      if (!asset) {
        recordAssetOperation('version', 'not_found');
        return null;
      }

      const newVersion = asset.version + 1;

      // Create version record
      const versionId = `ver-${uuidv4()}`;
      const version = new Version({
        versionId,
        assetId,
        version: newVersion,
        url: input.url,
        thumbnailUrl: input.thumbnailUrl,
        size: input.size,
        checksum: input.checksum,
        changes: input.changes,
        createdBy: input.createdBy
      });

      await version.save();

      // Update asset with new version
      asset.version = newVersion;
      asset.url = input.url;
      asset.thumbnailUrl = input.thumbnailUrl || asset.thumbnailUrl;
      asset.size = input.size;
      asset.updatedBy = input.createdBy;
      await asset.save();

      recordAssetOperation('version', 'success');
      logger.info('Asset version created', { assetId, version: newVersion });

      return version;
    } catch (error) {
      recordAssetOperation('version', 'error');
      logger.error('Failed to create version', { error, assetId });
      throw error;
    }
  }

  async getVersions(assetId: string): Promise<IVersion[]> {
    try {
      const versions = await Version.find({ assetId }).sort({ version: -1 });
      recordAssetOperation('versions', 'success');
      return versions;
    } catch (error) {
      recordAssetOperation('versions', 'error');
      logger.error('Failed to get versions', { error, assetId });
      throw error;
    }
  }

  async incrementAnalytics(assetId: string, type: 'views' | 'downloads' | 'shares'): Promise<void> {
    try {
      const update: any = {};
      update[`analytics.${type}`] = 1;

      await Asset.findOneAndUpdate({ assetId }, { $inc: update });
      recordAssetOperation('analytics', 'success');
    } catch (error) {
      recordAssetOperation('analytics', 'error');
      logger.error('Failed to increment analytics', { error, assetId, type });
    }
  }

  private async updateStorageMetrics(): Promise<void> {
    try {
      const [totalAssets, totalBytes] = await Promise.all([
        Asset.countDocuments({ status: { $ne: 'deleted' } }),
        Asset.aggregate([
          { $match: { status: { $ne: 'deleted' } } },
          { $group: { _id: null, total: { $sum: '$size' } } }
        ])
      ]);

      const bytes = totalBytes[0]?.total || 0;
      await updateStorageMetrics(bytes, totalAssets);
    } catch (error) {
      logger.error('Failed to update storage metrics', { error });
    }
  }
}

export const assetService = new AssetService();