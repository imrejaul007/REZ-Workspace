import { Inventory } from '../models/index.js';
import { logger } from 'utils/logger.js';
import Redis from 'ioredis';

export interface FloorPriceRule {
  id: string;
  publisherId: string;
  name: string;
  priority: number;
  conditions: FloorPriceConditions;
  price: number;
  currency: string;
  algorithm: 'static' | 'dynamic' | 'auction';
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FloorPriceConditions {
  inventoryTypes?: ('banner' | 'video' | 'native' | 'interstitial' | 'rewarded' | 'CTV')[];
  adTypes?: string[];
  positions?: string[];
  environments?: ('web' | 'mobile-web' | 'app' | 'CTV')[];
  countries?: string[];
  devices?: ('desktop' | 'mobile' | 'tablet' | 'CTV')[];
  dayparting?: {
    days?: string[];
    hours?: number[];
  };
  audienceSegments?: string[];
  minBidHistory?: number;
  minEcpm?: number;
}

export interface DynamicFloorPriceParams {
  basePrice: number;
  historicalEcpm: number;
  demandMultiplier: number;
  timeOfDay: number;
  dayOfWeek: number;
  geoDemand: number;
  deviceDemand: number;
}

class FloorPriceService {
  private redis: Redis | null = null;
  private rulesCache: Map<string, FloorPriceRule[]> = new Map();
  private cacheTimeout = 300; // 5 minutes

  constructor() {
    this.initRedis();
  }

  private async initRedis(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redis = new Redis(redisUrl);
      logger.info('Floor price service connected to Redis');
    } catch (error) {
      logger.warn('Redis not available, using in-memory caching');
 }
  }

  /**
   * Get floor price for an inventory
   */
  async getFloorPrice(
    publisherId: string,
    inventoryId: string,
    params?: {
      country?: string;
      device?: string;
      hour?: number;
      bidHistory?: number;
    }
  ): Promise<{
    floorPrice: number;
    currency: string;
    algorithm: string;
    rule?: FloorPriceRule;
  }> {
    // Get inventory details
    const inventory = await Inventory.findById(inventoryId);
    if (!inventory) {
      throw new Error('Inventory not found');
    }

    // Get applicable rules
    const rules = await this.getApplicableRules(publisherId, {
      type: inventory.type,
      adTypes: inventory.adTypes,
      position: inventory.position,
      environment: inventory.environment,
      country: params?.country,
      device: params?.device,
      hour: params?.hour
    });

    // If no rules, use inventory default
    if (rules.length === 0) {
      return {
        floorPrice: inventory.floorPrice,
        currency: inventory.currency,
        algorithm: 'static'
      };
    }

    // Sort by priority and get highest priority rule
    rules.sort((a, b) => b.priority - a.priority);
    const rule = rules[0];

    // Calculate floor price based on algorithm
    let floorPrice = rule.price;

    if (rule.algorithm === 'dynamic') {
      floorPrice = this.calculateDynamicPrice(
        rule.price,
        params?.bidHistory || inventory.stats.avgEcpm || 0,
        params?.hour || new Date().getHours()
      );
    }

    return {
      floorPrice,
      currency: rule.currency,
      algorithm: rule.algorithm,
      rule
    };
  }

  /**
   * Get applicable rules for a context
   */
  async getApplicableRules(
    publisherId: string,
    context: {
      type?: string;
      adTypes?: string[];
      position?: string;
      environment?: string;
      country?: string;
      device?: string;
      hour?: number;
    }
  ): Promise<FloorPriceRule[]> {
    // Try cache first
    const cacheKey = `floor_rules:${publisherId}`;
    let rules = this.rulesCache.get(cacheKey);

    if (!rules) {
      rules = await this.loadRulesFromDb(publisherId);
      this.rulesCache.set(cacheKey, rules);
    }

    // Filter applicable rules
    return rules.filter(rule => {
      if (!rule.enabled) return false;

      const conditions = rule.conditions;

      // Check inventory type
      if (conditions.inventoryTypes && conditions.inventoryTypes.length > 0) {
        if (!conditions.inventoryTypes.includes(context.type as 'banner' | 'video' | 'native' | 'interstitial' | 'rewarded' | 'CTV')) {
          return false;
        }
      }

      // Check ad types
      if (conditions.adTypes && conditions.adTypes.length > 0 && context.adTypes) {
        const hasMatch = context.adTypes.some(t => conditions.adTypes!.includes(t));
        if (!hasMatch) return false;
      }

      // Check position
      if (conditions.positions && conditions.positions.length > 0) {
        if (!conditions.positions.includes(context.position as string)) {
          return false;
        }
      }

      // Check environment
      if (conditions.environments && conditions.environments.length > 0) {
        if (!conditions.environments.includes(context.environment as 'web' | 'mobile-web' | 'app' | 'CTV')) {
          return false;
        }
      }

      // Check country
      if (conditions.countries && conditions.countries.length > 0 && context.country) {
        if (!conditions.countries.includes(context.country)) {
          return false;
        }
      }

      // Check device
      if (conditions.devices && conditions.devices.length > 0 && context.device) {
        if (!conditions.devices.includes(context.device as 'desktop' | 'mobile' | 'tablet' | 'CTV')) {
          return false;
        }
      }

      // Check dayparting
      if (conditions.dayparting) {
        const now = new Date();
        const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
        const hour = context.hour || now.getHours();

        if (conditions.dayparting.days && conditions.dayparting.days.length > 0) {
          if (!conditions.dayparting.days.includes(day)) {
            return false;
          }
        }

        if (conditions.dayparting.hours && conditions.dayparting.hours.length > 0) {
          if (!conditions.dayparting.hours.includes(hour)) {
            return false;
          }
        }
      }

      return true;
    });
  }

  /**
   * Set floor price rule
   */
  async setRule(rule: Omit<FloorPriceRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<FloorPriceRule> {
    const id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newRule: FloorPriceRule = {
      ...rule,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store in Redis
    if (this.redis) {
      const key = `floor_rules:${rule.publisherId}`;
      await this.redis.lpush(key, JSON.stringify(newRule));
      await this.redis.expire(key, this.cacheTimeout);
    }

    // Invalidate cache
    this.rulesCache.delete(`floor_rules:${rule.publisherId}`);

    logger.info(`Floor price rule created: ${id}`, { publisherId: rule.publisherId });
    return newRule;
  }

  /**
   * Update floor price rule
   */
  async updateRule(
    publisherId: string,
    ruleId: string,
    updates: Partial<FloorPriceRule>
  ): Promise<FloorPriceRule | null> {
    if (this.redis) {
      const key = `floor_rules:${publisherId}`;
      const rules = await this.redis.lrange(key, 0, -1);

      for (let i = 0; i < rules.length; i++) {
        const rule = JSON.parse(rules[i]) as FloorPriceRule;
        if (rule.id === ruleId) {
          const updatedRule = {
            ...rule,
            ...updates,
            id: rule.id,
            createdAt: rule.createdAt,
            updatedAt: new Date()
          };
          await this.redis.lset(key, i, JSON.stringify(updatedRule));
          await this.redis.expire(key, this.cacheTimeout);

          // Invalidate cache
          this.rulesCache.delete(key);

          logger.info(`Floor price rule updated: ${ruleId}`);
          return updatedRule;
        }
      }
    }

    return null;
  }

  /**
   * Delete floor price rule
   */
  async deleteRule(publisherId: string, ruleId: string): Promise<boolean> {
    if (this.redis) {
      const key = `floor_rules:${publisherId}`;
      const rules = await this.redis.lrange(key, 0, -1);

      for (let i = 0; i < rules.length; i++) {
        const rule = JSON.parse(rules[i]) as FloorPriceRule;
        if (rule.id === ruleId) {
          await this.redis.lrem(key, 1, rules[i]);
          await this.redis.expire(key, this.cacheTimeout);

          // Invalidate cache
          this.rulesCache.delete(key);

          logger.info(`Floor price rule deleted: ${ruleId}`);
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get all rules for a publisher
   */
  async getRules(publisherId: string): Promise<FloorPriceRule[]> {
    return this.loadRulesFromDb(publisherId);
  }

  /**
   * Calculate dynamic floor price
   */
  private calculateDynamicPrice(
    basePrice: number,
    historicalEcpm: number,
    hour: number
  ): number {
    // Time-of-day multiplier (peak hours have higher demand)
    const hourMultiplier = this.getHourMultiplier(hour);

    // Historical performance factor
    const performanceFactor = historicalEcpm > 0
      ? Math.min(historicalEcpm / basePrice, 2) // Cap at 2x
      : 1;

    // Calculate dynamic price
    const dynamicPrice = basePrice * hourMultiplier * performanceFactor;

    // Return minimum of base price and calculated price
    return Math.max(basePrice, dynamicPrice);
  }

  /**
   * Get hour multiplier for time-of-day pricing
   */
  private getHourMultiplier(hour: number): number {
    // Peak hours: 9-12 AM, 6-10 PM
    if (hour >= 9 && hour <= 12) return 1.3;
    if (hour >= 18 && hour <= 22) return 1.2;
    if (hour >= 6 && hour <= 8) return 1.1;
    if (hour >= 23 || hour <= 5) return 0.8;
    return 1.0;
  }

  /**
   * Load rules from database
   */
  private async loadRulesFromDb(publisherId: string): Promise<FloorPriceRule[]> {
    if (this.redis) {
      const key = `floor_rules:${publisherId}`;
      const rules = await this.redis.lrange(key, 0, -1);
      return rules.map(r => JSON.parse(r) as FloorPriceRule);
    }

    // Return empty array if Redis not available
    return [];
  }

  /**
   * Optimize floor prices based on historical data
   */
  async optimizeFloorPrices(publisherId: string): Promise<{
    inventoryId: string;
    currentPrice: number;
    recommendedPrice: number;
    reason: string;
  }[]> {
    // Get all inventory for publisher
    const inventories = await Inventory.find({ publisherId, enabled: true });

    const recommendations: Array<{
      inventoryId: string;
      currentPrice: number;
      recommendedPrice: number;
      reason: string;
    }> = [];

    for (const inventory of inventories) {
      const stats = inventory.stats;

      if (stats.totalImpressions < 1000) {
        // Not enough data
        continue;
      }

      const currentPrice = inventory.floorPrice;
      const avgEcpm = stats.avgEcpm;

      // If eCPM is significantly higher than floor, suggest raising floor
      if (avgEcpm > currentPrice * 1.5) {
        const recommendedPrice = avgEcpm * 0.9; // 90% of eCPM
        recommendations.push({
          inventoryId: inventory._id.toString(),
          currentPrice,
          recommendedPrice: Math.round(recommendedPrice * 100) / 100,
          reason: 'High demand detected. Consider raising floor price.'
        });
      }

      // If fill rate is low and eCPM is close to floor, suggest lowering floor
      if (stats.fillRate < 30 && avgEcpm < currentPrice * 1.2) {
        const recommendedPrice = currentPrice * 0.8; // 20% lower
        recommendations.push({
          inventoryId: inventory._id.toString(),
          currentPrice,
          recommendedPrice: Math.round(recommendedPrice * 100) / 100,
          reason: 'Low fill rate. Consider lowering floor price to attract more bids.'
        });
      }
    }

    return recommendations;
  }
}

export const floorPriceService = new FloorPriceService();
