/**
 * ReZ Segments - Segmentation Service
 */

import { Segment, ISegment, SegmentRule } from '../models/Segment';
import { CustomerSegment } from '../models/CustomerSegment';

export interface CustomerData {
  customerId: string;
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  lastOrderDate?: Date;
  signupDate: Date;
  tags: string[];
  city?: string;
  state?: string;
  ordersThisMonth: number;
  ordersLastMonth: number;
  firstOrderDate?: Date;
  email: string;
}

export class SegmentationService {
  /**
   * Create a new segment
   */
  static async createSegment(data: {
    shop: string;
    tenantId: string;
    brandId: string;
    name: string;
    description?: string;
    type?: 'dynamic' | 'static';
    rules: SegmentRule[];
  }): Promise<ISegment> {
    const segment = await Segment.create({
      ...data,
      shop: data.shop.toLowerCase(),
      customerCount: 0,
    });
    return segment;
  }

  /**
   * Update segment
   */
  static async updateSegment(segmentId: string, data: Partial<ISegment>): Promise<ISegment | null> {
    const segment = await Segment.findByIdAndUpdate(segmentId, data, { new: true });
    return segment;
  }

  /**
   * Get segments for a shop
   */
  static async getSegments(shop: string): Promise<ISegment[]> {
    return Segment.find({ shop: shop.toLowerCase(), active: true });
  }

  /**
   * Check if customer matches segment rules
   */
  static customerMatchesRules(customer: CustomerData, rules: SegmentRule[]): boolean {
    let result = true;
    let lastConjunction: 'and' | 'or' = 'and';

    for (const rule of rules) {
      const ruleResult = this.evaluateRule(customer, rule);

      if (lastConjunction === 'and') {
        result = result && ruleResult;
      } else {
        result = result || ruleResult;
      }

      lastConjunction = rule.conjunction || 'and';
    }

    return result;
  }

  /**
   * Evaluate single rule
   */
  static evaluateRule(customer: CustomerData, rule: SegmentRule): boolean {
    const fieldValue = this.getFieldValue(customer, rule.field);

    switch (rule.operator) {
      case 'eq':
        return fieldValue === rule.value;
      case 'ne':
        return fieldValue !== rule.value;
      case 'gt':
        return (fieldValue as number) > rule.value;
      case 'gte':
        return (fieldValue as number) >= rule.value;
      case 'lt':
        return (fieldValue as number) < rule.value;
      case 'lte':
        return (fieldValue as number) <= rule.value;
      case 'contains':
        return String(fieldValue).includes(rule.value);
      case 'not_contains':
        return !String(fieldValue).includes(rule.value);
      case 'in':
        return Array.isArray(rule.value) && rule.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(rule.value) && !rule.value.includes(fieldValue);
      case 'between':
        return (fieldValue as number) >= rule.value[0] && (fieldValue as number) <= rule.value[1];
      case 'days_ago_gt':
        const daysAgo = Math.floor((Date.now() - new Date(fieldValue as string).getTime()) / (1000 * 60 * 60 * 24));
        return daysAgo > rule.value;
      case 'days_ago_lt':
        const daysAgo2 = Math.floor((Date.now() - new Date(fieldValue as string).getTime()) / (1000 * 60 * 60 * 24));
        return daysAgo2 < rule.value;
      default:
        return false;
    }
  }

  /**
   * Get field value from customer
   */
  static getFieldValue(customer: CustomerData, field: string): any {
    const fieldMap: Record<string, () => any> = {
      totalOrders: () => customer.totalOrders,
      totalSpent: () => customer.totalSpent,
      avgOrderValue: () => customer.avgOrderValue,
      lastOrderDate: () => customer.lastOrderDate,
      signupDate: () => customer.signupDate,
      ordersThisMonth: () => customer.ordersThisMonth,
      ordersLastMonth: () => customer.ordersLastMonth,
      email: () => customer.email,
      city: () => customer.city,
      state: () => customer.state,
      hasOrdered: () => customer.totalOrders > 0,
      isNew: () => {
        if (!customer.firstOrderDate) return false;
        const daysSinceFirst = Math.floor((Date.now() - new Date(customer.firstOrderDate).getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceFirst <= 30;
      },
      isReturning: () => customer.totalOrders > 1,
      isVIP: () => customer.totalSpent >= 10000,
      tags: () => customer.tags,
    };

    const getter = fieldMap[field];
    return getter ? getter() : null;
  }

  /**
   * Calculate segment membership
   */
  static async calculateSegment(segmentId: string, customers: CustomerData[]): Promise<string[]> {
    const segment = await Segment.findById(segmentId);
    if (!segment) return [];

    const matchingCustomerIds: string[] = [];

    for (const customer of customers) {
      if (this.customerMatchesRules(customer, segment.rules)) {
        matchingCustomerIds.push(customer.customerId);

        // Add to membership
        await CustomerSegment.findOneAndUpdate(
          { customerId: customer.customerId, shop: segment.shop, segmentId: segment._id.toString() },
          { customerId: customer.customerId, shop: segment.shop, segmentId: segment._id.toString(), addedAt: new Date() },
          { upsert: true }
        );
      }
    }

    // Update count
    segment.customerCount = matchingCustomerIds.length;
    segment.lastCalculated = new Date();
    await segment.save();

    return matchingCustomerIds;
  }

  /**
   * Get customers in segment
   */
  static async getSegmentCustomers(segmentId: string): Promise<string[]> {
    const memberships = await CustomerSegment.find({ segmentId });
    return memberships.map(m => m.customerId);
  }

  /**
   * Get all segments for a customer
   */
  static async getCustomerSegments(customerId: string, shop: string): Promise<string[]> {
    const memberships = await CustomerSegment.find({
      customerId,
      shop: shop.toLowerCase(),
    });
    return memberships.map(m => m.segmentId);
  }

  /**
   * Pre-built segment templates
   */
  static async createTemplateSegments(shop: string, tenantId: string, brandId: string): Promise<void> {
    const templates: Array<{
      name: string;
      description: string;
      rules: Array<{
        field: string;
        operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'not_contains' | 'in' | 'not_in' | 'between' | 'days_ago_gt' | 'days_ago_lt';
        value: any;
        conjunction?: 'and' | 'or';
      }>;
    }> = [
      {
        name: 'New Customers',
        description: 'Customers who placed their first order in the last 30 days',
        rules: [{ field: 'isNew', operator: 'eq', value: true }],
      },
      {
        name: 'Returning Customers',
        description: 'Customers with more than 1 order',
        rules: [{ field: 'isReturning', operator: 'eq', value: true }],
      },
      {
        name: 'VIP Customers',
        description: 'Customers with lifetime value over ₹10,000',
        rules: [{ field: 'totalSpent', operator: 'gte', value: 10000 }],
      },
      {
        name: 'At Risk',
        description: 'Customers who have not ordered in 60+ days',
        rules: [{ field: 'lastOrderDate', operator: 'days_ago_gt', value: 60 }],
      },
      {
        name: 'High Value Low Frequency',
        description: 'High spenders who order infrequently',
        rules: [
          { field: 'totalSpent', operator: 'gte', value: 5000 },
          { field: 'ordersThisMonth', operator: 'lt', value: 1, conjunction: 'and' },
        ],
      },
    ];

    for (const template of templates) {
      await this.createSegment({
        shop,
        tenantId,
        brandId,
        ...template,
      });
    }
  }
}
