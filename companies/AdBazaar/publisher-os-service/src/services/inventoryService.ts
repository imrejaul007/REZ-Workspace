import { Inventory, IInventory, IInventoryTargeting } from '../models/index.js';
import { logger } from 'utils/logger.js';

export interface CreateInventoryInput {
  publisherId: string;
  placementId?: string;
  name: string;
  code: string;
  type: 'banner' | 'video' | 'native' | 'interstitial' | 'rewarded' | 'CTV';
  adTypes: string[];
  dimensions: { width: number; height: number; size: string };
  position: string;
  environment?: 'web' | 'mobile-web' | 'app' | 'CTV';
  targeting?: IInventoryTargeting;
  floorPrice?: number;
  reservePrice?: number;
  maxBid?: number;
  currency?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateInventoryInput {
  name?: string;
  code?: string;
  type?: 'banner' | 'video' | 'native' | 'interstitial' | 'rewarded' | 'CTV';
  adTypes?: string[];
  dimensions?: { width: number; height: number; size: string };
  position?: string;
  environment?: 'web' | 'mobile-web' | 'app' | 'CTV';
  targeting?: IInventoryTargeting;
  floorPrice?: number;
  reservePrice?: number;
  maxBid?: number;
  enabled?: boolean;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface InventoryFilters {
  publisherId: string;
  type?: string;
  enabled?: boolean;
  tags?: string[];
  page?: number;
  limit?: number;
}

class InventoryService {
  /**
   * Create new inventory
   */
  async create(input: CreateInventoryInput): Promise<IInventory> {
    const inventory = new Inventory({
      ...input,
      enabled: true,
      stats: {
        totalRequests: 0,
        totalImpressions: 0,
        totalRevenue: 0,
        fillRate: 0,
        avgEcpm: 0,
        bidRate: 0
      }
    });

    await inventory.save();
    logger.info(`Inventory created: ${inventory._id}`, {
      publisherId: input.publisherId,
      code: input.code
    });

    return inventory;
  }

  /**
   * Get inventory by ID
   */
  async getById(id: string): Promise<IInventory | null> {
    return Inventory.findById(id);
  }

  /**
   * Get inventory by publisher and code
   */
  async getByPublisherAndCode(publisherId: string, code: string): Promise<IInventory | null> {
    return Inventory.findOne({ publisherId, code });
  }

  /**
   * List inventory for a publisher
   */
  async listByPublisher(filters: InventoryFilters): Promise<{
    inventories: IInventory[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { publisherId: filters.publisherId };

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.enabled !== undefined) {
      query.enabled = filters.enabled;
    }

    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    const [inventories, total] = await Promise.all([
      Inventory.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Inventory.countDocuments(query)
    ]);

    return {
      inventories,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Update inventory
   */
  async update(id: string, input: UpdateInventoryInput): Promise<IInventory | null> {
    const inventory = await Inventory.findByIdAndUpdate(
      id,
      { $set: input },
      { new: true, runValidators: true }
    );

    if (inventory) {
      logger.info(`Inventory updated: ${id}`);
    }

    return inventory;
  }

  /**
   * Enable/disable inventory
   */
  async setEnabled(id: string, enabled: boolean): Promise<IInventory | null> {
    return this.update(id, {
      enabled,
      pausedAt: enabled ? undefined : new Date()
    });
  }

  /**
   * Pause all inventory for a publisher
   */
  async pauseAllForPublisher(publisherId: string): Promise<number> {
    const result = await Inventory.updateMany(
      { publisherId, enabled: true },
      { $set: { enabled: false, pausedAt: new Date() } }
    );

    logger.info(`Paused ${result.modifiedCount} inventories for publisher: ${publisherId}`);
    return result.modifiedCount;
  }

  /**
   * Delete inventory
   */
  async delete(id: string): Promise<boolean> {
    const result = await Inventory.findByIdAndDelete(id);

    if (result) {
      logger.info(`Inventory deleted: ${id}`);
 return true;
    }

    return false;
  }

  /**
   * Record impression for inventory
   */
  async recordImpression(id: string, revenue: number): Promise<void> {
    await Inventory.findByIdAndUpdate(id, {
      $inc: {
        'stats.totalImpressions': 1,
        'stats.totalRevenue': revenue
      },
      $set: { lastPing: new Date() }
    });
  }

  /**
   * Record bid request
   */
  async recordBidRequest(id: string): Promise<void> {
    await Inventory.findByIdAndUpdate(id, {
      $inc: { 'stats.totalRequests': 1 }
    });
  }

  /**
   * Update inventory stats
   */
  async updateStats(
    id: string,
    stats: Partial<IInventory['stats']>
  ): Promise<void> {
    const updateFields: Record<string, unknown> = {};

    if (stats.totalRequests !== undefined) {
      updateFields['stats.totalRequests'] = stats.totalRequests;
    }
    if (stats.totalImpressions !== undefined) {
      updateFields['stats.totalImpressions'] = stats.totalImpressions;
    }
    if (stats.totalRevenue !== undefined) {
      updateFields['stats.totalRevenue'] = stats.totalRevenue;
    }
    if (stats.fillRate !== undefined) {
      updateFields['stats.fillRate'] = stats.fillRate;
    }
    if (stats.avgEcpm !== undefined) {
      updateFields['stats.avgEcpm'] = stats.avgEcpm;
    }
    if (stats.bidRate !== undefined) {
      updateFields['stats.bidRate'] = stats.bidRate;
    }

    if (Object.keys(updateFields).length > 0) {
      await Inventory.findByIdAndUpdate(id, { $set: updateFields });
    }
  }

  /**
   * Get inventory statistics summary
   */
  async getStatsSummary(publisherId: string): Promise<{
    totalInventory: number;
    activeInventory: number;
    totalImpressions: number;
    totalRevenue: number;
    avgFillRate: number;
    avgEcpm: number;
    byType: Record<string, {
      count: number;
      impressions: number;
      revenue: number;
    }>;
  }> {
    const stats = await Inventory.aggregate([
      { $match: { publisherId: publisherId } },
      {
        $group: {
          _id: null,
          totalInventory: { $sum: 1 },
          activeInventory: {
            $sum: { $cond: [{ $eq: ['$enabled', true] }, 1, 0] }
          },
          totalImpressions: { $sum: '$stats.totalImpressions' },
          totalRevenue: { $sum: '$stats.totalRevenue' },
          avgFillRate: { $avg: '$stats.fillRate' },
          avgEcpm: { $avg: '$stats.avgEcpm' }
        }
      }
    ]);

    const byType = await Inventory.aggregate([
      { $match: { publisherId: publisherId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          impressions: { $sum: '$stats.totalImpressions' },
          revenue: { $sum: '$stats.totalRevenue' }
        }
      }
    ]);

    const typeMap: Record<string, { count: number; impressions: number; revenue: number }> = {};
    byType.forEach(t => {
      typeMap[t._id] = {
        count: t.count,
        impressions: t.impressions,
        revenue: t.revenue
      };
    });

    return {
      totalInventory: stats[0]?.totalInventory || 0,
      activeInventory: stats[0]?.activeInventory || 0,
      totalImpressions: stats[0]?.totalImpressions || 0,
      totalRevenue: stats[0]?.totalRevenue || 0,
      avgFillRate: stats[0]?.avgFillRate || 0,
      avgEcpm: stats[0]?.avgEcpm || 0,
      byType: typeMap
    };
  }

  /**
   * Get available ad sizes
   */
  async getAvailableSizes(): Promise<Array<{ width: number; height: number; size: string }>> {
    const sizes = await Inventory.distinct('dimensions', {
      enabled: true
    });
    return sizes.filter(s => s && s.width && s.height);
  }
}

export const inventoryService = new InventoryService();
