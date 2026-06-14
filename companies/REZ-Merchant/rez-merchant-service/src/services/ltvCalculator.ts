// @ts-nocheck
import mongoose, { Types } from 'mongoose';
import { Order } from '../models/Order';
import { Store } from '../models/Store';
import { CustomerMeta } from '../models/CustomerMeta';

export type LTTSegment = 'Low' | 'Medium' | 'High' | 'VIP';

export interface LTVMetrics {
  userId: string;
  averageOrderValue: number;
  orderFrequency: number;       // Orders per month
  customerLifespan: number;       // Months
  totalOrders: number;
  totalSpent: number;
  ltv: number;
  ltvSegment: LTTSegment;
  confidence: 'high' | 'medium' | 'low';
  calculatedAt: Date;
}

export interface LTVAnalysisResult {
  merchantId: string;
  analyzedAt: Date;
  totalCustomers: number;
  withSufficientData: number;
  customers: LTVMetrics[];
  segmentDistribution: {
    vip: number;
    high: number;
    medium: number;
    low: number;
  };
  summary: {
    totalLTV: number;
    averageLTV: number;
    medianLTV: number;
    topPercentile: number;
    vipTotalLTV: number;
    vipPercentage: number;
  };
}

export interface LTVSegmentProfile {
  segment: LTTSegment;
  count: number;
  averageLTV: number;
  totalLTV: number;
  averageOrderValue: number;
  averageOrderFrequency: number;
  averageCustomerLifespan: number;
  percentageOfCustomers: number;
  percentageOfTotalLTV: number;
  characteristics: string[];
  recommendedActions: string[];
}

const DEFAULT_LTV_SEGMENTS = {
  vip: { minLTV: 50000, minOrders: 10, minFrequency: 2 },
  high: { minLTV: 15000, minOrders: 5, minFrequency: 1 },
  medium: { minLTV: 5000, minOrders: 2, minFrequency: 0.5 },
  low: { minLTV: 0, minOrders: 1, minFrequency: 0 },
};

const DEFAULT_LIFESPAN_MONTHS = 24; // Default customer lifespan assumption
const MIN_ORDERS_FOR_LIFESPAN = 2;  // Minimum orders to calculate lifespan

export class LTVCalculator {
  /**
   * Calculate LTV for a single customer
   * Formula: LTV = Average Order Value × Order Frequency × Customer Lifespan
   */
  static calculateLTV(
    averageOrderValue: number,
    orderFrequency: number,
    customerLifespan: number
  ): number {
    return averageOrderValue * orderFrequency * customerLifespan;
  }

  /**
   * Calculate average order value from orders
   */
  static calculateAOV(totalSpent: number, totalOrders: number): number {
    if (totalOrders === 0) return 0;
    return totalSpent / totalOrders;
  }

  /**
   * Calculate order frequency (orders per month)
   */
  static calculateOrderFrequency(
    totalOrders: number,
    customerAgeDays: number
  ): number {
    if (customerAgeDays === 0) return 0;
    const customerAgeMonths = customerAgeDays / 30;
    return customerAgeMonths > 0 ? totalOrders / customerAgeMonths : 0;
  }

  /**
   * Calculate customer lifespan in months
   */
  static calculateCustomerLifespan(
    firstOrderDate: Date,
    lastOrderDate: Date,
    totalOrders: number
  ): number {
    if (totalOrders === 0) return 0;

    // If only one order, use assumed lifespan from last order
    if (totalOrders < MIN_ORDERS_FOR_LIFESPAN) {
      return DEFAULT_LIFESPAN_MONTHS;
    }

    const customerAgeDays = Math.floor(
      (lastOrderDate.getTime() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // If customer has recent order, project remaining lifespan
    const now = new Date();
    const daysSinceLastOrder = Math.floor(
      (now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate historical rate and project future
    const historicalMonths = customerAgeDays / 30;
    const orderRate = totalOrders / historicalMonths;

    // Estimate remaining months based on purchase pattern
    // Cap at reasonable maximum
    const estimatedRemainingMonths = Math.min(24, 30 / orderRate);

    return Math.min(DEFAULT_LIFESPAN_MONTHS, historicalMonths + estimatedRemainingMonths);
  }

  /**
   * Determine LTV segment based on customer metrics
   */
  static determineSegment(
    ltv: number,
    totalOrders: number,
    orderFrequency: number
  ): LTTSegment {
    if (
      ltv >= DEFAULT_LTV_SEGMENTS.vip.minLTV ||
      (totalOrders >= DEFAULT_LTV_SEGMENTS.vip.minOrders &&
        orderFrequency >= DEFAULT_LTV_SEGMENTS.vip.minFrequency)
    ) {
      return 'VIP';
    }
    if (
      ltv >= DEFAULT_LTV_SEGMENTS.high.minLTV ||
      (totalOrders >= DEFAULT_LTV_SEGMENTS.high.minOrders &&
        orderFrequency >= DEFAULT_LTV_SEGMENTS.high.minFrequency)
    ) {
      return 'High';
    }
    if (
      ltv >= DEFAULT_LTV_SEGMENTS.medium.minLTV ||
      totalOrders >= DEFAULT_LTV_SEGMENTS.medium.minOrders
    ) {
      return 'Medium';
    }
    return 'Low';
  }

  /**
   * Determine confidence level based on data quality
   */
  static determineConfidence(
    totalOrders: number,
    customerAgeDays: number
  ): 'high' | 'medium' | 'low' {
    if (totalOrders >= 10 && customerAgeDays >= 180) {
      return 'high';
    }
    if (totalOrders >= 3 && customerAgeDays >= 30) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Analyze LTV for all customers of a merchant
   */
  static async analyzeLTV(
    merchantId: string,
    options?: {
      lookbackDays?: number;
      minOrdersForAnalysis?: number;
    }
  ): Promise<LTVAnalysisResult> {
    const lookbackDays = options?.lookbackDays || 365;
    const minOrdersForAnalysis = options?.minOrdersForAnalysis || 1;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackDays);

    // Get merchant's stores
    const stores = await Store.find({ merchantId: new mongoose.Types.ObjectId(merchantId) })
      .select('_id')
      .lean();
    const storeIds = stores.map((s) => s._id);

    if (storeIds.length === 0) {
      return this.emptyLTVResult(merchantId);
    }

    // Aggregate customer order data
    const customerData = await Order.aggregate([
      {
        $match: {
          store: { $in: storeIds },
          'payment.status': 'paid',
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$user',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totals.total' },
          firstOrderDate: { $min: '$createdAt' },
          lastOrderDate: { $max: '$createdAt' },
        },
      },
      {
        $match: {
          totalOrders: { $gte: minOrdersForAnalysis },
        },
      },
    ]);

    const now = new Date();
    const ltvMetrics: LTVMetrics[] = [];

    for (const customer of customerData) {
      const customerAgeDays = Math.floor(
        (now.getTime() - new Date(customer.firstOrderDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      const averageOrderValue = this.calculateAOV(customer.totalSpent, customer.totalOrders);
      const orderFrequency = this.calculateOrderFrequency(customer.totalOrders, customerAgeDays);
      const customerLifespan = this.calculateCustomerLifespan(
        new Date(customer.firstOrderDate),
        new Date(customer.lastOrderDate),
        customer.totalOrders
      );
      const ltv = this.calculateLTV(averageOrderValue, orderFrequency, customerLifespan);

      ltvMetrics.push({
        userId: customer._id.toString(),
        averageOrderValue,
        orderFrequency: Math.round(orderFrequency * 100) / 100,
        customerLifespan: Math.round(customerLifespan * 100) / 100,
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent,
        ltv: Math.round(ltv * 100) / 100,
        ltvSegment: this.determineSegment(ltv, customer.totalOrders, orderFrequency),
        confidence: this.determineConfidence(customer.totalOrders, customerAgeDays),
        calculatedAt: now,
      });
    }

    // Sort by LTV descending
    ltvMetrics.sort((a, b) => b.ltv - a.ltv);

    // Calculate segment distribution
    const segmentDistribution = {
      vip: ltvMetrics.filter((m) => m.ltvSegment === 'VIP').length,
      high: ltvMetrics.filter((m) => m.ltvSegment === 'High').length,
      medium: ltvMetrics.filter((m) => m.ltvSegment === 'Medium').length,
      low: ltvMetrics.filter((m) => m.ltvSegment === 'Low').length,
    };

    // Calculate summary statistics
    const totalLTV = ltvMetrics.reduce((sum, m) => sum + m.ltv, 0);
    const averageLTV = ltvMetrics.length > 0 ? totalLTV / ltvMetrics.length : 0;
    const medianLTV = this.calculateMedian(ltvMetrics.map((m) => m.ltv));
    const topPercentile = ltvMetrics.length > 0 ? ltvMetrics[Math.floor(ltvMetrics.length * 0.1)]?.ltv || 0 : 0;
    const vipTotalLTV = ltvMetrics
      .filter((m) => m.ltvSegment === 'VIP')
      .reduce((sum, m) => sum + m.ltv, 0);
    const vipPercentage = totalLTV > 0 ? (vipTotalLTV / totalLTV) * 100 : 0;

    return {
      merchantId,
      analyzedAt: now,
      totalCustomers: customerData.length,
      withSufficientData: customerData.length,
      customers: ltvMetrics,
      segmentDistribution,
      summary: {
        totalLTV: Math.round(totalLTV * 100) / 100,
        averageLTV: Math.round(averageLTV * 100) / 100,
        medianLTV: Math.round(medianLTV * 100) / 100,
        topPercentile: Math.round(topPercentile * 100) / 100,
        vipTotalLTV: Math.round(vipTotalLTV * 100) / 100,
        vipPercentage: Math.round(vipPercentage * 100) / 100,
      },
    };
  }

  /**
   * Calculate median value
   */
  private static calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * Get LTV segment profile with recommendations
   */
  static getSegmentProfile(segment: LTTSegment): LTVSegmentProfile {
    const profiles: Record<LTTSegment, LTVSegmentProfile> = {
      VIP: {
        segment: 'VIP',
        count: 0,
        averageLTV: 0,
        totalLTV: 0,
        averageOrderValue: 0,
        averageOrderFrequency: 0,
        averageCustomerLifespan: 0,
        percentageOfCustomers: 0,
        percentageOfTotalLTV: 0,
        characteristics: [
          'High spenders with frequent purchases',
          'Longest customer relationships',
          'Brand advocates and referral sources',
          'Early adopters of new offerings',
        ],
        recommendedActions: [
          'Provide exclusive VIP experiences and early access',
          'Personal account managers for top accounts',
          'Request testimonials and referrals',
          'Offer premium loyalty rewards',
          'Involve in product development feedback',
        ],
      },
      High: {
        segment: 'High',
        count: 0,
        averageLTV: 0,
        totalLTV: 0,
        averageOrderValue: 0,
        averageOrderFrequency: 0,
        averageCustomerLifespan: 0,
        percentageOfCustomers: 0,
        percentageOfTotalLTV: 0,
        characteristics: [
          'Consistent purchasers with solid spending',
          'Good potential to upgrade to VIP',
          'Responsive to upselling opportunities',
        ],
        recommendedActions: [
          'Target with premium product offerings',
          'Increase engagement through personalized campaigns',
          'Create upgrade path to VIP status',
          'Encourage repeat purchases with loyalty incentives',
        ],
      },
      Medium: {
        segment: 'Medium',
        count: 0,
        averageLTV: 0,
        totalLTV: 0,
        averageOrderValue: 0,
        averageOrderFrequency: 0,
        averageCustomerLifespan: 0,
        percentageOfCustomers: 0,
        percentageOfTotalLTV: 0,
        characteristics: [
          'Occasional purchasers',
          'Potential for growth with right incentives',
          'May respond to promotions and offers',
        ],
        recommendedActions: [
          'Increase purchase frequency with targeted promotions',
          'Introduce bundle offers to increase AOV',
          'Win-back campaigns for dormant periods',
          'Cross-sell complementary products',
        ],
      },
      Low: {
        segment: 'Low',
        count: 0,
        averageLTV: 0,
        totalLTV: 0,
        averageOrderValue: 0,
        averageOrderFrequency: 0,
        averageCustomerLifespan: 0,
        percentageOfCustomers: 0,
        percentageOfTotalLTV: 0,
        characteristics: [
          'New or one-time customers',
          'Price-sensitive segment',
          'Highest churn risk',
        ],
        recommendedActions: [
          'Onboarding sequences to encourage repeat purchase',
          'First-time buyer incentives',
          'Reactivation campaigns for lapsed customers',
          'Minimize acquisition cost for this segment',
        ],
      },
    };

    return profiles[segment];
  }

  /**
   * Calculate segment profiles with actual data
   */
  static async getSegmentProfiles(merchantId: string): Promise<LTVSegmentProfile[]> {
    const analysis = await this.analyzeLTV(merchantId);

    const segments: LTTSegment[] = ['VIP', 'High', 'Medium', 'Low'];
    const profiles: LTVSegmentProfile[] = [];

    for (const segment of segments) {
      const segmentCustomers = analysis.customers.filter((c) => c.ltvSegment === segment);
      const baseProfile = this.getSegmentProfile(segment);

      const totalLTV = analysis.summary.totalLTV;

      profiles.push({
        ...baseProfile,
        count: segmentCustomers.length,
        averageLTV:
          segmentCustomers.length > 0
            ? segmentCustomers.reduce((sum, c) => sum + c.ltv, 0) / segmentCustomers.length
            : 0,
        totalLTV: segmentCustomers.reduce((sum, c) => sum + c.ltv, 0),
        averageOrderValue:
          segmentCustomers.length > 0
            ? segmentCustomers.reduce((sum, c) => sum + c.averageOrderValue, 0) / segmentCustomers.length
            : 0,
        averageOrderFrequency:
          segmentCustomers.length > 0
            ? segmentCustomers.reduce((sum, c) => sum + c.orderFrequency, 0) / segmentCustomers.length
            : 0,
        averageCustomerLifespan:
          segmentCustomers.length > 0
            ? segmentCustomers.reduce((sum, c) => sum + c.customerLifespan, 0) / segmentCustomers.length
            : 0,
        percentageOfCustomers:
          analysis.totalCustomers > 0
            ? (segmentCustomers.length / analysis.totalCustomers) * 100
            : 0,
        percentageOfTotalLTV: totalLTV > 0
          ? (segmentCustomers.reduce((sum, c) => sum + c.ltv, 0) / totalLTV) * 100
          : 0,
      });
    }

    return profiles;
  }

  /**
   * Get LTV for a specific customer
   */
  static async getCustomerLTV(
    merchantId: string,
    userId: string
  ): Promise<LTVMetrics | null> {
    const stores = await Store.find({ merchantId: new mongoose.Types.ObjectId(merchantId) })
      .select('_id')
      .lean();
    const storeIds = stores.map((s) => s._id);

    if (storeIds.length === 0) return null;

    const customerData = await Order.aggregate([
      {
        $match: {
          store: { $in: storeIds },
          user: userId,
          'payment.status': 'paid',
        },
      },
      {
        $group: {
          _id: '$user',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totals.total' },
          firstOrderDate: { $min: '$createdAt' },
          lastOrderDate: { $max: '$createdAt' },
        },
      },
    ]);

    if (customerData.length === 0) {
      // Customer with no orders
      return {
        userId,
        averageOrderValue: 0,
        orderFrequency: 0,
        customerLifespan: 0,
        totalOrders: 0,
        totalSpent: 0,
        ltv: 0,
        ltvSegment: 'Low',
        confidence: 'low',
        calculatedAt: new Date(),
      };
    }

    const customer = customerData[0];
    const now = new Date();
    const customerAgeDays = Math.floor(
      (now.getTime() - new Date(customer.firstOrderDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    const averageOrderValue = this.calculateAOV(customer.totalSpent, customer.totalOrders);
    const orderFrequency = this.calculateOrderFrequency(customer.totalOrders, customerAgeDays);
    const customerLifespan = this.calculateCustomerLifespan(
      new Date(customer.firstOrderDate),
      new Date(customer.lastOrderDate),
      customer.totalOrders
    );
    const ltv = this.calculateLTV(averageOrderValue, orderFrequency, customerLifespan);

    return {
      userId,
      averageOrderValue,
      orderFrequency: Math.round(orderFrequency * 100) / 100,
      customerLifespan: Math.round(customerLifespan * 100) / 100,
      totalOrders: customer.totalOrders,
      totalSpent: customer.totalSpent,
      ltv: Math.round(ltv * 100) / 100,
      ltvSegment: this.determineSegment(ltv, customer.totalOrders, orderFrequency),
      confidence: this.determineConfidence(customer.totalOrders, customerAgeDays),
      calculatedAt: now,
    };
  }

  /**
   * Store LTV scores in customer profile
   */
  static async storeLTVInProfile(
    merchantId: string,
    userId: string,
    ltvMetrics: LTVMetrics
  ): Promise<void> {
    await CustomerMeta.findOneAndUpdate(
      { merchantId: new mongoose.Types.ObjectId(merchantId), userId },
      {
        $set: {
          ltvScore: ltvMetrics.ltv,
          ltvSegment: ltvMetrics.ltvSegment,
          ltvMetrics: {
            averageOrderValue: ltvMetrics.averageOrderValue,
            orderFrequency: ltvMetrics.orderFrequency,
            customerLifespan: ltvMetrics.customerLifespan,
            totalOrders: ltvMetrics.totalOrders,
            totalSpent: ltvMetrics.totalSpent,
            confidence: ltvMetrics.confidence,
            calculatedAt: ltvMetrics.calculatedAt,
          },
        },
      },
      { upsert: true, new: true }
    );
  }

  /**
   * Get customers by LTV segment
   */
  static async getCustomersBySegment(
    merchantId: string,
    segment: LTTSegment
  ): Promise<LTVMetrics[]> {
    const analysis = await this.analyzeLTV(merchantId);
    return analysis.customers.filter((c) => c.ltvSegment === segment);
  }

  /**
   * Get top N customers by LTV
   */
  static async getTopLTVCustomers(
    merchantId: string,
    limit: number = 10
  ): Promise<LTVMetrics[]> {
    const analysis = await this.analyzeLTV(merchantId);
    return analysis.customers.slice(0, limit);
  }

  /**
   * Empty LTV result for merchants with no data
   */
  private static emptyLTVResult(merchantId: string): LTVAnalysisResult {
    return {
      merchantId,
      analyzedAt: new Date(),
      totalCustomers: 0,
      withSufficientData: 0,
      customers: [],
      segmentDistribution: {
        vip: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      summary: {
        totalLTV: 0,
        averageLTV: 0,
        medianLTV: 0,
        topPercentile: 0,
        vipTotalLTV: 0,
        vipPercentage: 0,
      },
    };
  }
}

export default LTVCalculator;
