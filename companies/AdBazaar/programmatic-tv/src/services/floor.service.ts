import { v4 as uuidv4 } from 'uuid';
import {
  FloorPriceRule,
  FloorFilter,
  PaginationParams,
  ListResponse,
  CTVDeviceCategory,
  DealType,
} from '../types/index.js';
import { FloorPriceRuleModel } from '../models/index.js';
import { getRedisClient } from './database.js';
import { config } from '../config/index.js';

export class FloorService {
  private redis = getRedisClient();

  /**
   * Create a floor price rule
   */
  async createRule(data: Omit<FloorPriceRule, 'ruleId' | 'createdAt' | 'updatedAt'>): Promise<FloorPriceRule> {
    const rule: Omit<FloorPriceRule, 'createdAt' | 'updatedAt'> = {
      ...data,
      ruleId: data.ruleId || `rule-${uuidv4()}`,
    };

    const doc = new FloorPriceRuleModel(rule);
    const saved = await doc.save();

    // Invalidate floor cache
    await this.invalidateFloorCache();

    return saved.toObject() as FloorPriceRule;
  }

  /**
   * Get a rule by ID
   */
  async getRuleById(ruleId: string): Promise<FloorPriceRule | null> {
    const cacheKey = `floor:${ruleId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const doc = await FloorPriceRuleModel.findOne({ ruleId });
    if (doc) {
      const rule = doc.toObject() as FloorPriceRule;
      await this.redis.setex(
        cacheKey,
        config.redis.ttl.floorCache,
        JSON.stringify(rule)
      );
      return rule;
    }

    return null;
  }

  /**
   * List floor rules with filtering and pagination
   */
  async listRules(
    filter: FloorFilter,
    pagination: PaginationParams
  ): Promise<ListResponse<FloorPriceRule>> {
    const query: Record<string, unknown> = {};

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.geo) {
      query['conditions.geo'] = filter.geo;
    }

    if (filter.deviceType) {
      query['conditions.deviceTypes'] = filter.deviceType;
    }

    const skip = (pagination.page - 1) * pagination.limit;
    const sort: Record<string, 1 | -1> = {};
    if (pagination.sortBy) {
      sort[pagination.sortBy] = pagination.sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.priority = -1;
    }

    const [items, total] = await Promise.all([
      FloorPriceRuleModel.find(query).sort(sort).skip(skip).limit(pagination.limit).lean(),
      FloorPriceRuleModel.countDocuments(query),
    ]);

    return {
      items: items as FloorPriceRule[],
      total,
      page: pagination.page,
      limit: pagination.limit,
      hasMore: skip + items.length < total,
    };
  }

  /**
   * Update a floor rule
   */
  async updateRule(
    ruleId: string,
    data: Partial<FloorPriceRule>
  ): Promise<FloorPriceRule | null> {
    const doc = await FloorPriceRuleModel.findOneAndUpdate(
      { ruleId },
      data,
      { new: true, runValidators: true }
    );

    if (doc) {
      await this.invalidateFloorCache(ruleId);
      return doc.toObject() as FloorPriceRule;
    }

    return null;
  }

  /**
   * Update rule status
   */
  async updateRuleStatus(
    ruleId: string,
    status: 'active' | 'paused' | 'deleted'
  ): Promise<FloorPriceRule | null> {
    return this.updateRule(ruleId, { status });
  }

  /**
   * Delete a floor rule
   */
  async deleteRule(ruleId: string): Promise<boolean> {
    const result = await FloorPriceRuleModel.updateOne(
      { ruleId },
      { status: 'deleted' }
    );

    if (result.modifiedCount > 0) {
      await this.invalidateFloorCache(ruleId);
      return true;
    }

    return false;
  }

  /**
   * Get active floor rules sorted by priority
   */
  async getActiveRules(): Promise<FloorPriceRule[]> {
    const docs = await FloorPriceRuleModel.find({ status: 'active' })
      .sort({ priority: -1 })
      .lean();

    return docs as FloorPriceRule[];
  }

  /**
   * Calculate floor price for a given context
   */
  async calculateFloorPrice(context: {
    geo?: string;
    deviceType?: CTVDeviceCategory;
    contentCategory?: string;
    appBundle?: string;
    dealType?: DealType;
  }): Promise<number> {
    // Get active rules
    const rules = await this.getActiveRules();

    // Find matching rules
    for (const rule of rules) {
      if (this.matchesConditions(rule.conditions, context)) {
        return rule.floorPrice;
      }
    }

    // Return default floor
    return config.auction.minBidFloor;
  }

  /**
   * Check if context matches rule conditions
   */
  private matchesConditions(
    conditions: FloorPriceRule['conditions'],
    context: {
      geo?: string;
      deviceType?: CTVDeviceCategory;
      contentCategory?: string;
      appBundle?: string;
      dealType?: DealType;
    }
  ): boolean {
    // Geo check
    if (conditions.geo && conditions.geo.length > 0) {
      if (!context.geo || !conditions.geo.includes(context.geo)) {
        return false;
      }
    }

    // Device type check
    if (conditions.deviceTypes && conditions.deviceTypes.length > 0) {
      if (!context.deviceType || !conditions.deviceTypes.includes(context.deviceType)) {
        return false;
      }
    }

    // Content category check
    if (conditions.contentCategories && conditions.contentCategories.length > 0) {
      if (!context.contentCategory || !conditions.contentCategories.includes(context.contentCategory)) {
        return false;
      }
    }

    // App bundle check
    if (conditions.appBundles && conditions.appBundles.length > 0) {
      if (!context.appBundle || !conditions.appBundles.includes(context.appBundle)) {
        return false;
      }
    }

    // Deal type check
    if (conditions.dealTypes && conditions.dealTypes.length > 0) {
      if (!context.dealType || !conditions.dealTypes.includes(context.dealType)) {
        return false;
      }
    }

    // Time of day check
    if (conditions.timeOfDay) {
      const now = new Date();
      const hour = now.getHours();
      const dayOfWeek = now.getDay();

      if (
        hour < conditions.timeOfDay.startHour ||
        hour > conditions.timeOfDay.endHour
      ) {
        return false;
      }

      if (
        conditions.timeOfDay.daysOfWeek &&
        !conditions.timeOfDay.daysOfWeek.includes(dayOfWeek)
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Batch update floor rules
   */
  async batchUpdateRules(
    updates: Array<{ ruleId: string; data: Partial<FloorPriceRule> }>
  ): Promise<FloorPriceRule[]> {
    const results: FloorPriceRule[] = [];

    for (const update of updates) {
      const updated = await this.updateRule(update.ruleId, update.data);
      if (updated) {
        results.push(updated);
      }
    }

    await this.invalidateFloorCache();
    return results;
  }

  /**
   * Get floor rules for a specific geo
   */
  async getRulesForGeo(geo: string): Promise<FloorPriceRule[]> {
    const docs = await FloorPriceRuleModel.find({
      status: 'active',
      'conditions.geo': geo,
    })
      .sort({ priority: -1 })
      .lean();

    return docs as FloorPriceRule[];
  }

  /**
   * Invalidate floor cache
   */
  private async invalidateFloorCache(ruleId?: string): Promise<void> {
    if (ruleId) {
      await this.redis.del(`floor:${ruleId}`);
    }
    const keys = await this.redis.keys('floor:*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Singleton instance
let floorService: FloorService | null = null;

export function getFloorService(): FloorService {
  if (!floorService) {
    floorService = new FloorService();
  }
  return floorService;
}