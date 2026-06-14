import mongoose from 'mongoose';
import {
  IUsageRecord,
  UsageRecord,
  Subscription,
  Invoice,
  IInvoice
} from '../models';
import {
  UsageType,
  UsageRecord as UsageRecordData,
  InvoiceLineItem
} from '../types';
import {
  generateUsageId,
  usageLogger as logger,
  retryWithBackoff,
  getDayBoundaries
} from '../utils';

export interface UsageSummary {
  subscriptionId: string;
  periodStart: Date;
  periodEnd: Date;
  totalQuantity: number;
  includedUnits: number;
  overageUnits: number;
  overageCharges: number;
  totalCharges: number;
}

export class UsageTracker {
  private static instance: UsageTracker;

  private constructor() {}

  public static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

  /**
   * Record usage for a subscription
   */
  async recordUsage(
    data: UsageRecordData
  ): Promise<IUsageRecord> {
    // Check for idempotency
    if (data.idempotencyKey) {
      const existing = await UsageRecord.findByIdempotencyKey(data.idempotencyKey);
      if (existing) {
        logger.debug('Returning existing usage record', {
          idempotencyKey: data.idempotencyKey,
          usageId: existing.usageId
        });
        return existing;
      }
    }

    // Get subscription
    const subscription = await Subscription.findOne({
      subscriptionId: data.subscriptionId
    });

    if (!subscription) {
      throw new Error(`Subscription not found: ${data.subscriptionId}`);
    }

    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      throw new Error(`Subscription is not active: ${subscription.status}`);
    }

    // Calculate charges based on usage type
    const unitPrice = subscription.usageOverageRate || 0;
    const totalAmount = data.quantity * unitPrice;

    // Create usage record
    const usageId = generateUsageId();
    const now = new Date();

    const usageRecord = new UsageRecord({
      usageId,
      subscriptionId: data.subscriptionId,
      customerId: subscription.customerId,
      quantity: data.quantity,
      unitPrice,
      totalAmount,
      currency: subscription.currency,
      timestamp: data.timestamp ? new Date(data.timestamp) : now,
      idempotencyKey: data.idempotencyKey,
      description: data.metadata?.description,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
      metadata: data.metadata || {},
      processed: false
    });

    await usageRecord.save();

    // Update subscription usage
    subscription.usageThisPeriod += data.quantity;
    await subscription.save();

    logger.info('Usage recorded', {
      usageId,
      subscriptionId: data.subscriptionId,
      quantity: data.quantity,
      totalAmount
    });

    return usageRecord;
  }

  /**
   * Get usage records for a subscription
   */
  async getUsageRecords(
    subscriptionId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      includeProcessed?: boolean;
      limit?: number;
    } = {}
  ): Promise<IUsageRecord[]> {
    const query: Record<string, unknown> = { subscriptionId };

    if (options.startDate || options.endDate) {
      query.timestamp = {};
      if (options.startDate) {
        query.timestamp.$gte = options.startDate;
      }
      if (options.endDate) {
        query.timestamp.$lte = options.endDate;
      }
    }

    if (!options.includeProcessed) {
      query.processed = false;
    }

    return UsageRecord.find(query)
      .sort({ timestamp: -1 })
      .limit(options.limit || 100);
  }

  /**
   * Get unprocessed usage for a subscription
   */
  async getUnprocessedUsage(subscriptionId: string): Promise<IUsageRecord[]> {
    return UsageRecord.getUnprocessedUsage(subscriptionId);
  }

  /**
   * Get usage summary for a billing period
   */
  async getUsageSummary(
    subscriptionId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<UsageSummary> {
    const subscription = await Subscription.findOne({ subscriptionId });
    if (!subscription) {
      throw new Error(`Subscription not found: ${subscriptionId}`);
    }

    const totalUsage = await UsageRecord.getTotalUsage(
      subscriptionId,
      periodStart,
      periodEnd
    );

    const includedUnits = subscription.usageIncluded || 0;
    const overageUnits = Math.max(0, totalUsage - includedUnits);
    const overageRate = subscription.usageOverageRate || 0;
    const overageCharges = overageUnits * overageRate;

    return {
      subscriptionId,
      periodStart,
      periodEnd,
      totalQuantity: totalUsage,
      includedUnits,
      overageUnits,
      overageCharges,
      totalCharges: overageCharges
    };
  }

  /**
   * Calculate period charges for a subscription
   */
  async calculatePeriodCharges(
    subscriptionId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<number> {
    if (subscription.usageType === UsageType.FLAT_RATE) {
      return 0;
    }

    const summary = await this.getUsageSummary(subscriptionId, periodStart, periodEnd);
    return summary.totalCharges;
  }

  /**
   * Mark usage records as processed
   */
  async markUsageProcessed(
    usageIds: string[],
    invoiceId: string
  ): Promise<void> {
    await UsageRecord.markAsProcessed(usageIds, invoiceId);

    logger.info('Usage records marked as processed', {
      count: usageIds.length,
      invoiceId
    });
  }

  /**
   * Get daily usage breakdown
   */
  async getDailyUsage(
    subscriptionId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; quantity: number; amount: number }>> {
    return UsageRecord.getDailyUsageSummary(subscriptionId, startDate, endDate);
  }

  /**
   * Get usage trends for a subscription
   */
  async getUsageTrends(
    subscriptionId: string,
    days: number = 30
  ): Promise<{
    daily: Array<{ date: string; quantity: number }>;
    average: number;
    peak: { date: string; quantity: number };
    total: number;
  }> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const dailyUsage = await this.getDailyUsage(subscriptionId, startDate, endDate);

    if (dailyUsage.length === 0) {
      return {
        daily: [],
        average: 0,
        peak: { date: '', quantity: 0 },
        total: 0
      };
    }

    const total = dailyUsage.reduce((sum, day) => sum + day.quantity, 0);
    const average = total / dailyUsage.length;
    const peak = dailyUsage.reduce(
      (max, day) => (day.quantity > max.quantity ? day : max),
      { date: '', quantity: 0 }
    );

    return {
      daily: dailyUsage.map(d => ({ date: d.date, quantity: d.quantity })),
      average: Math.round(average * 100) / 100,
      peak,
      total
    };
  }

  /**
   * Get all usage for a customer
   */
  async getCustomerUsage(
    customerId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<IUsageRecord[]> {
    const query: Record<string, unknown> = { customerId };

    if (options.startDate || options.endDate) {
      query.timestamp = {};
      if (options.startDate) {
        query.timestamp.$gte = options.startDate;
      }
      if (options.endDate) {
        query.timestamp.$lte = options.endDate;
      }
    }

    return UsageRecord.find(query)
      .sort({ timestamp: -1 })
      .limit(options.limit || 1000);
  }

  /**
   * Reset usage for a new billing period
   */
  async resetPeriodUsage(subscriptionId: string): Promise<void> {
    const subscription = await Subscription.findOne({ subscriptionId });
    if (!subscription) {
      throw new Error(`Subscription not found: ${subscriptionId}`);
    }

    subscription.usageThisPeriod = 0;
    await subscription.save();

    logger.info('Period usage reset', { subscriptionId });
  }

  /**
   * Process usage and create invoice
   */
  async processUsageCharges(subscriptionId: string): Promise<IInvoice | null> {
    const subscription = await Subscription.findOne({ subscriptionId });
    if (!subscription) {
      throw new Error(`Subscription not found: ${subscriptionId}`);
    }

    if (subscription.usageType === UsageType.FLAT_RATE) {
      return null;
    }

    const unprocessedUsage = await this.getUnprocessedUsage(subscriptionId);
    if (unprocessedUsage.length === 0) {
      return null;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Calculate total charges
      const totalAmount = unprocessedUsage.reduce(
        (sum, record) => sum + record.totalAmount,
        0
      );

      if (totalAmount <= 0) {
        return null;
      }

      // Create invoice
      const invoiceId = `inv_usage_${Date.now()}`;
      const lineItems: InvoiceLineItem[] = unprocessedUsage.map(record => ({
        id: record.usageId,
        description: record.description || `Usage - ${record.quantity} units`,
        quantity: record.quantity,
        unitPrice: record.unitPrice,
        amount: record.totalAmount,
        currency: record.currency,
        periodStart: record.periodStart,
        periodEnd: record.periodEnd
      }));

      const invoice = new Invoice({
        invoiceId,
        subscriptionId,
        customerId: subscription.customerId,
        status: 'pending',
        currency: subscription.currency,
        subtotal: totalAmount,
        tax: 0,
        taxRate: 0,
        discount: 0,
        total: totalAmount,
        amountDue: totalAmount,
        amountPaid: 0,
        lineItems,
        periodStart: subscription.currentPeriodStart,
        periodEnd: subscription.currentPeriodEnd,
        dueDate: new Date(),
        issuedAt: new Date(),
        billingAddress: subscription.billingAddress,
        paymentAttempts: [],
        metadata: {
          type: 'usage'
        }
      });

      await invoice.save({ session });

      // Mark usage as processed
      const usageIds = unprocessedUsage.map(r => r.usageId);
      await UsageRecord.markAsProcessed(usageIds, invoiceId);

      await session.commitTransaction();

      logger.info('Usage invoice created', {
        invoiceId,
        subscriptionId,
        amount: totalAmount
      });

      return invoice;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get usage analytics
   */
  async getUsageAnalytics(
    options: {
      startDate?: Date;
      endDate?: Date;
      customerId?: string;
      subscriptionId?: string;
    } = {}
  ): Promise<{
    totalRecords: number;
    totalQuantity: number;
    totalRevenue: number;
    bySubscription: Array<{
      subscriptionId: string;
      quantity: number;
      revenue: number;
    }>;
  }> {
    const matchStage: Record<string, unknown> = {};

    if (options.startDate || options.endDate) {
      matchStage.timestamp = {};
      if (options.startDate) {
        matchStage.timestamp.$gte = options.startDate;
      }
      if (options.endDate) {
        matchStage.timestamp.$lte = options.endDate;
      }
    }

    if (options.customerId) {
      matchStage.customerId = options.customerId;
    }

    if (options.subscriptionId) {
      matchStage.subscriptionId = options.subscriptionId;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$subscriptionId',
          quantity: { $sum: '$quantity' },
          revenue: { $sum: '$totalAmount' }
        }
      }
    ];

    const results = await UsageRecord.aggregate(pipeline);

    const totalRecords = await UsageRecord.countDocuments(matchStage);
    const totalQuantity = results.reduce((sum, r) => sum + r.quantity, 0);
    const totalRevenue = results.reduce((sum, r) => sum + r.revenue, 0);

    return {
      totalRecords,
      totalQuantity,
      totalRevenue,
      bySubscription: results.map(r => ({
        subscriptionId: r._id,
        quantity: r.quantity,
        revenue: r.revenue
      }))
    };
  }

  /**
   * Delete usage record (for corrections)
   */
  async deleteUsageRecord(
    usageId: string,
    reason: string
  ): Promise<void> {
    const usageRecord = await UsageRecord.findOne({ usageId });
    if (!usageRecord) {
      throw new Error(`Usage record not found: ${usageId}`);
    }

    if (usageRecord.processed) {
      throw new Error('Cannot delete processed usage record');
    }

    // Update subscription usage
    const subscription = await Subscription.findOne({
      subscriptionId: usageRecord.subscriptionId
    });

    if (subscription) {
      subscription.usageThisPeriod = Math.max(
        0,
        subscription.usageThisPeriod - usageRecord.quantity
      );
      await subscription.save();
    }

    // Delete the record
    await UsageRecord.deleteOne({ usageId });

    logger.info('Usage record deleted', {
      usageId,
      reason,
      quantity: usageRecord.quantity
    });
  }
}

// Export singleton instance
export const usageTracker = UsageTracker.getInstance();
