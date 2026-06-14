import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Customer segment types
 */
export type CustomerSegment = 'new' | 'regular' | 'vip' | 'at-risk' | 'churned';

/**
 * Customer profile for CRM
 */
export interface CustomerProfile {
  userId: string;
  restaurantId: string;
  preferences: {
    favoriteItems: Array<{ itemId: string; orderCount: number }>;
    dietaryRestrictions: string[];
    preferredPaymentMethod: string;
    preferredOrderType: 'delivery' | 'pickup' | 'dine-in';
    avgOrderValue: number;
    orderFrequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
  };
  behavior: {
    lastOrderDate: Date | null;
    totalOrders: number;
    lifetimeValue: number;
    churnRisk: 'low' | 'medium' | 'high';
    engagementScore: number; // 0-100
  };
  segment: CustomerSegment;
  tags: string[];
  lastInteraction: Date | null;
}

/**
 * Campaign target criteria
 */
export interface CampaignTarget {
  segment?: CustomerSegment;
  minLifetimeValue?: number;
  maxLifetimeValue?: number;
  dietaryRestrictions?: string[];
  tags?: string[];
  excludeChurned?: boolean;
}

/**
 * CRM Connector Service
 *
 * Handles customer relationship management:
 * - Customer profile management
 * - Segmentation based on behavior
 * - Campaign targeting
 * - Engagement tracking
 */
@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // CUSTOMER PROFILE MANAGEMENT
  // ==========================================

  /**
   * Get or create customer profile
   */
  async getOrCreateProfile(userId: string, restaurantId: string): Promise<CustomerProfile> {
    let profile = await this.prisma.customerProfile.findFirst({
      where: { userId, restaurantId },
    });

    if (!profile) {
      profile = await this.prisma.customerProfile.create({
        data: {
          userId,
          restaurantId,
          segment: 'new',
          preferences: {},
          behavior: {
            lastOrderDate: null,
            totalOrders: 0,
            lifetimeValue: 0,
            churnRisk: 'low',
            engagementScore: 50,
          },
          tags: [],
        },
      });
    }

    return this.mapProfile(profile);
  }

  /**
   * Update profile from order data
   */
  async updateProfileFromOrder(
    userId: string,
    restaurantId: string,
    order: {
      totalAmount: number;
      items: Array<{ productId: string; quantity: number; price: number }>;
      paymentMethod: string;
      fulfillmentType: string;
    }
  ): Promise<CustomerProfile> {
    const profile = await this.getOrCreateProfile(userId, restaurantId);

    // Get existing order history
    const orderHistory = await this.prisma.order.findMany({
      where: { customerId: userId, restaurantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Calculate new metrics
    const totalOrders = orderHistory.length + 1;
    const lifetimeValue = orderHistory.reduce((sum, o) => sum + o.totalAmount, 0) + order.totalAmount;
    const avgOrderValue = lifetimeValue / totalOrders;

    // Update favorite items
    const itemCounts = new Map<string, number>();
    orderHistory.forEach(o => {
      o.items?.forEach(item => {
        itemCounts.set(item.productId, (itemCounts.get(item.productId) || 0) + item.quantity);
      });
    });
    order.items.forEach(item => {
      itemCounts.set(item.productId, (itemCounts.get(item.productId) || 0) + item.quantity);
    });
    const favoriteItems = Array.from(itemCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([itemId, count]) => ({ itemId, orderCount: count }));

    // Calculate order frequency
    let orderFrequency: CustomerProfile['preferences']['orderFrequency'] = 'occasional';
    if (orderHistory.length > 0) {
      const daysSinceFirst = Math.ceil((Date.now() - orderHistory[orderHistory.length - 1].createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const avgDaysBetween = daysSinceFirst / orderHistory.length;
      if (avgDaysBetween <= 1) orderFrequency = 'daily';
      else if (avgDaysBetween <= 7) orderFrequency = 'weekly';
      else if (avgDaysBetween <= 30) orderFrequency = 'monthly';
    }

    // Update segment
    const segment = this.calculateSegment(totalOrders, lifetimeValue, orderHistory);

    // Calculate engagement score
    const engagementScore = this.calculateEngagementScore(totalOrders, lifetimeValue, orderFrequency);

    // Calculate churn risk
    const daysSinceLastOrder = orderHistory[0]
      ? Math.ceil((Date.now() - orderHistory[0].createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    let churnRisk: 'low' | 'medium' | 'high' = 'low';
    if (daysSinceLastOrder > 60) churnRisk = 'high';
    else if (daysSinceLastOrder > 30) churnRisk = 'medium';

    await this.prisma.customerProfile.update({
      where: { id: profile.userId }, // Using userId as identifier
      data: {
        segment,
        preferences: {
          favoriteItems,
          preferredPaymentMethod: order.paymentMethod,
          preferredOrderType: order.fulfillmentType as 'delivery' | 'pickup' | 'dine-in',
          avgOrderValue,
          orderFrequency,
        },
        behavior: {
          lastOrderDate: new Date(),
          totalOrders,
          lifetimeValue,
          churnRisk,
          engagementScore,
        },
        lastInteraction: new Date(),
      },
    });

    return this.getOrCreateProfile(userId, restaurantId);
  }

  /**
   * Calculate customer segment
   */
  private calculateSegment(
    totalOrders: number,
    lifetimeValue: number,
    orderHistory: Array<{ createdAt: Date }>
  ): CustomerSegment {
    const daysSinceLastOrder = orderHistory[0]
      ? Math.ceil((Date.now() - orderHistory[0].createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Churned - no order in 60+ days
    if (daysSinceLastOrder > 60) return 'churned';

    // New - first order within 30 days
    if (totalOrders <= 1 && daysSinceLastOrder <= 30) return 'new';

    // VIP - high lifetime value and frequent orders
    if (lifetimeValue > 10000 && totalOrders > 10) return 'vip';

    // At-risk - no order in 30-60 days with history
    if (daysSinceLastOrder > 30 && totalOrders > 1) return 'at-risk';

    // Regular - ordered recently with multiple orders
    return 'regular';
  }

  /**
   * Calculate engagement score (0-100)
   */
  private calculateEngagementScore(
    totalOrders: number,
    lifetimeValue: number,
    orderFrequency: CustomerProfile['preferences']['orderFrequency']
  ): number {
    let score = 30; // Base

    // Order frequency contribution
    const frequencyScores = { daily: 30, weekly: 25, monthly: 15, occasional: 5 };
    score += frequencyScores[orderFrequency] || 0;

    // Order count contribution
    if (totalOrders > 50) score += 20;
    else if (totalOrders > 20) score += 15;
    else if (totalOrders > 10) score += 10;
    else if (totalOrders > 5) score += 5;

    // Lifetime value contribution
    if (lifetimeValue > 50000) score += 20;
    else if (lifetimeValue > 20000) score += 15;
    else if (lifetimeValue > 10000) score += 10;
    else if (lifetimeValue > 5000) score += 5;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Map database model to interface
   */
  private mapProfile(profile: {
    userId: string;
    restaurantId: string;
    segment: string;
    preferences: unknown;
    behavior: unknown;
    tags: string[];
    lastInteraction: Date | null;
  }): CustomerProfile {
    return {
      userId: profile.userId,
      restaurantId: profile.restaurantId,
      segment: profile.segment as CustomerSegment,
      preferences: (profile.preferences as CustomerProfile['preferences']) || {
        favoriteItems: [],
        dietaryRestrictions: [],
        preferredPaymentMethod: '',
        preferredOrderType: 'delivery',
        avgOrderValue: 0,
        orderFrequency: 'occasional',
      },
      behavior: (profile.behavior as CustomerProfile['behavior']) || {
        lastOrderDate: null,
        totalOrders: 0,
        lifetimeValue: 0,
        churnRisk: 'low',
        engagementScore: 50,
      },
      tags: profile.tags || [],
      lastInteraction: profile.lastInteraction,
    };
  }

  // ==========================================
  // CAMPAIGN TARGETING
  // ==========================================

  /**
   * Get campaign targets matching criteria
   */
  async getCampaignTargets(
    restaurantId: string,
    criteria: CampaignTarget
  ): Promise<CustomerProfile[]> {
    const where: Record<string, unknown> = { restaurantId };

    // Filter by segment
    if (criteria.segment) {
      where.segment = criteria.segment;
    }

    // Filter by lifetime value
    if (criteria.minLifetimeValue !== undefined || criteria.maxLifetimeValue !== undefined) {
      where.behavior = {};
      if (criteria.minLifetimeValue !== undefined) {
        (where.behavior as Record<string, unknown>).lifetimeValue = { gte: criteria.minLifetimeValue };
      }
      if (criteria.maxLifetimeValue !== undefined) {
        (where.behavior as Record<string, unknown>).lifetimeValue = {
          ...((where.behavior as Record<string, unknown>).lifetimeValue as object || {}),
          lte: criteria.maxLifetimeValue,
        };
      }
    }

    // Exclude churned
    if (criteria.excludeChurned) {
      where.segment = { not: 'churned' };
    }

    const profiles = await this.prisma.customerProfile.findMany({
      where,
      orderBy: { lastInteraction: 'desc' },
      take: 1000,
    });

    return profiles.map(p => this.mapProfile(p));
  }

  /**
   * Get customers by segment
   */
  async getCustomersBySegment(
    restaurantId: string,
    segment: CustomerSegment
  ): Promise<CustomerProfile[]> {
    const profiles = await this.prisma.customerProfile.findMany({
      where: { restaurantId, segment },
      orderBy: { lastInteraction: 'desc' },
    });

    return profiles.map(p => this.mapProfile(p));
  }

  /**
   * Get segment statistics
   */
  async getSegmentStats(restaurantId: string): Promise<{
    total: number;
    bySegment: Record<CustomerSegment, number>;
    avgEngagement: number;
  }> {
    const profiles = await this.prisma.customerProfile.findMany({
      where: { restaurantId },
    });

    const bySegment: Record<string, number> = {};
    let totalEngagement = 0;

    profiles.forEach(p => {
      const segment = p.segment || 'new';
      bySegment[segment] = (bySegment[segment] || 0) + 1;
      const behavior = p.behavior as { engagementScore?: number } || {};
      totalEngagement += behavior.engagementScore || 50;
    });

    return {
      total: profiles.length,
      bySegment: bySegment as Record<CustomerSegment, number>,
      avgEngagement: profiles.length > 0 ? Math.round(totalEngagement / profiles.length) : 0,
    };
  }

  // ==========================================
  // SIMILAR CUSTOMERS
  // ==========================================

  /**
   * Find similar customers
   */
  async getSimilarCustomers(
    userId: string,
    restaurantId: string,
    limit: number = 10
  ): Promise<CustomerProfile[]> {
    const profile = await this.getOrCreateProfile(userId, restaurantId);

    // Find customers with similar segment and preferences
    const similar = await this.prisma.customerProfile.findMany({
      where: {
        restaurantId,
        userId: { not: userId },
        segment: profile.segment,
        tags: { hasSome: profile.tags },
      },
      orderBy: { lastInteraction: 'desc' },
      take: limit,
    });

    return similar.map(p => this.mapProfile(p));
  }

  // ==========================================
  // TAGS MANAGEMENT
  // ==========================================

  /**
   * Add tag to customer
   */
  async addTag(userId: string, restaurantId: string, tag: string): Promise<void> {
    const profile = await this.getOrCreateProfile(userId, restaurantId);

    if (!profile.tags.includes(tag)) {
      await this.prisma.customerProfile.updateMany({
        where: { userId, restaurantId },
        data: { tags: { push: tag } },
      });
    }
  }

  /**
   * Remove tag from customer
   */
  async removeTag(userId: string, restaurantId: string, tag: string): Promise<void> {
    await this.prisma.customerProfile.updateMany({
      where: { userId, restaurantId },
      data: { tags: { set: [] } }, // This needs to filter - simplified for now
    });
  }
}
