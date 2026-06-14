import mongoose from 'mongoose';
import cron from 'node-cron';
import {
  ISubscription,
  Subscription,
  Invoice,
  IInvoice
} from '../models';
import {
  SubscriptionStatus,
  InvoiceStatus,
  InvoiceLineItem,
  UsageType,
  BillingCycle
} from '../types';
import {
  generateInvoiceId,
  generateId,
  calculateNextBillingDate,
  calculateUsageCharges,
  calculateTotalWithTax,
  billingLogger as logger,
  getMonthBoundaries
} from '../utils';
import { subscriptionManager } from './subscriptionManager';
import { NotFoundError, AppError } from '../../../../shared/rez-errors/src';
import { usageTracker } from './usageTracker';

export interface BillingResult {
  subscriptionId: string;
  invoiceId: string;
  amount: number;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
}

export interface DunningResult {
  subscriptionId: string;
  dunningState: string;
  action: string;
  success: boolean;
}

export class BillingEngine {
  private static instance: BillingEngine;
  private billingCronJob: cron.ScheduledTask | null = null;
  private dunningCronJob: cron.ScheduledTask | null = null;
  private isProcessing: boolean = false;

  private constructor() {}

  public static getInstance(): BillingEngine {
    if (!BillingEngine.instance) {
      BillingEngine.instance = new BillingEngine();
    }
    return BillingEngine.instance;
  }

  /**
   * Start the billing engine cron jobs
   */
  public start(): void {
    const billingSchedule = process.env.BILLING_CRON_SCHEDULE || '0 0 * * *'; // Daily at midnight
    const dunningSchedule = process.env.DUNNING_CRON_SCHEDULE || '0 6 * * *'; // Daily at 6 AM

    // Schedule billing run
    this.billingCronJob = cron.schedule(billingSchedule, async () => {
      logger.info('Starting scheduled billing run');
      await this.runBillingCycle();
    });

    // Schedule dunning run
    this.dunningCronJob = cron.schedule(dunningSchedule, async () => {
      logger.info('Starting scheduled dunning run');
      await this.runDunningCycle();
    });

    logger.info('Billing engine started', { billingSchedule, dunningSchedule });
  }

  /**
   * Stop the billing engine
   */
  public stop(): void {
    if (this.billingCronJob) {
      this.billingCronJob.stop();
    }
    if (this.dunningCronJob) {
      this.dunningCronJob.stop();
    }
    logger.info('Billing engine stopped');
  }

  /**
   * Run the full billing cycle
   */
  public async runBillingCycle(): Promise<BillingResult[]> {
    if (this.isProcessing) {
      logger.warn('Billing cycle already in progress, skipping');
      return [];
    }

    this.isProcessing = true;
    const results: BillingResult[] = [];

    try {
      const now = new Date();
      logger.info('Running billing cycle', { timestamp: now.toISOString() });

      // 1. Process due subscriptions
      const dueSubscriptions = await this.getSubscriptionsDueForBilling(now);
      logger.info(`Found ${dueSubscriptions.length} subscriptions due for billing`);

      for (const subscription of dueSubscriptions) {
        try {
          const result = await this.processSubscriptionBilling(subscription);
          results.push(result);
        } catch (error) {
          logger.error('Failed to process subscription billing', {
            subscriptionId: subscription.subscriptionId,
            error
          });
          results.push({
            subscriptionId: subscription.subscriptionId,
            invoiceId: '',
            amount: 0,
            status: 'failed',
            error: String(error)
          });
        }
      }

      // 2. Process usage-based charges
      await this.processUsageBasedBilling();

      // 3. Process trial conversions
      const convertedTrials = await subscriptionManager.processExpiredTrials();
      logger.info(`Converted ${convertedTrials.length} trials to paid`);

      // 4. Calculate and log metrics
      const metrics = await this.calculateBillingMetrics();
      logger.info('Billing cycle completed', { results: results.length, metrics });

      return results;
    } catch (error) {
      logger.error('Billing cycle failed', { error });
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get subscriptions due for billing
   */
  private async getSubscriptionsDueForBilling(date: Date): Promise<ISubscription[]> {
    return Subscription.find({
      status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
      nextPaymentDate: { $lte: date },
      autoRenew: true,
      $or: [
        { cancellationEffectiveDate: { $exists: false } },
        { cancellationEffectiveDate: { $gt: date } }
      ]
    }).lean();
  }

  /**
   * Process billing for a single subscription
   */
  private async processSubscriptionBilling(
    subscription: ISubscription | Record<string, unknown>
  ): Promise<BillingResult> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Refresh subscription from DB
      const freshSubscription = await Subscription.findOne({
        subscriptionId: subscription.subscriptionId
      }).session(session);

      if (!freshSubscription) {
        throw new NotFoundError('Subscription');
      }

      // Skip if not due
      if (freshSubscription.nextPaymentDate > new Date()) {
        return {
          subscriptionId: freshSubscription.subscriptionId,
          invoiceId: '',
          amount: 0,
          status: 'skipped'
        };
      }

      // Calculate total amount
      const totalAmount = await this.calculateSubscriptionTotal(freshSubscription);

      // Create invoice
      const invoice = await this.createBillingInvoice(freshSubscription, session);

      // Mark subscription as renewed (will be finalized after payment)
      await subscriptionManager.renewSubscription(freshSubscription.subscriptionId);

      await session.commitTransaction();

      logger.info('Billing processed', {
        subscriptionId: freshSubscription.subscriptionId,
        invoiceId: invoice.invoiceId,
        amount: totalAmount
      });

      return {
        subscriptionId: freshSubscription.subscriptionId,
        invoiceId: invoice.invoiceId,
        amount: totalAmount,
        status: 'success'
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Calculate total amount for subscription
   */
  private async calculateSubscriptionTotal(
    subscription: ISubscription
  ): Promise<number> {
    let total = subscription.currentTotal;

    // Add usage-based charges
    if (subscription.usageType !== UsageType.FLAT_RATE) {
      const usageCharges = await usageTracker.calculatePeriodCharges(
        subscription.subscriptionId,
        subscription.currentPeriodStart,
        subscription.currentPeriodEnd
      );
      total += usageCharges;
    }

    // Apply discounts
    if (subscription.discountPercent) {
      total = total * (1 - subscription.discountPercent / 100);
    }
    if (subscription.discountAmount) {
      total = Math.max(0, total - subscription.discountAmount);
    }

    return Math.round(total * 100) / 100;
  }

  /**
   * Create invoice for billing period
   */
  private async createBillingInvoice(
    subscription: ISubscription,
    session: mongoose.ClientSession
  ): Promise<IInvoice> {
    const invoiceId = generateInvoiceId();

    const lineItems: InvoiceLineItem[] = [];

    // Base subscription charge
    lineItems.push({
      id: generateId('item'),
      description: `${subscription.plan.name} - ${subscription.billingCycle} subscription`,
      quantity: 1,
      unitPrice: subscription.basePrice,
      amount: subscription.basePrice,
      currency: subscription.currency,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd
    });

    // Usage charges
    if (subscription.usageType !== UsageType.FLAT_RATE && subscription.usageThisPeriod > 0) {
      const overage = Math.max(0, subscription.usageThisPeriod - subscription.usageIncluded);
      if (overage > 0 && subscription.usageOverageRate) {
        const overageAmount = overage * subscription.usageOverageRate;
        lineItems.push({
          id: generateId('item'),
          description: `Usage overage - ${overage} units @ ${subscription.currency} ${subscription.usageOverageRate}/unit`,
          quantity: overage,
          unitPrice: subscription.usageOverageRate,
          amount: overageAmount,
          currency: subscription.currency,
          periodStart: subscription.currentPeriodStart,
          periodEnd: subscription.currentPeriodEnd
        });
      }
    }

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const { tax, discount, total } = calculateTotalWithTax(
      subtotal,
      0, // Tax calculated separately
      subscription.discountAmount || 0
    );

    const invoice = new Invoice({
      invoiceId,
      subscriptionId: subscription.subscriptionId,
      customerId: subscription.customerId,
      status: InvoiceStatus.PENDING,
      currency: subscription.currency,
      subtotal,
      tax,
      taxRate: 0,
      discount,
      discountCode: subscription.couponCode,
      total,
      amountDue: total,
      amountPaid: 0,
      lineItems,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
      dueDate: calculateNextBillingDate(new Date(), BillingCycle.MONTHLY),
      issuedAt: new Date(),
      billingAddress: subscription.billingAddress,
      paymentAttempts: [],
      metadata: {
        type: 'billing',
        billingCycle: subscription.billingCycle
      }
    });

    await invoice.save({ session });

    return invoice;
  }

  /**
   * Process usage-based billing
   */
  private async processUsageBasedBilling(): Promise<void> {
    const subscriptionsWithUsage = await Subscription.find({
      status: SubscriptionStatus.ACTIVE,
      usageType: { $ne: UsageType.FLAT_RATE },
      'plan.usageLimits.overageRate': { $exists: true, $gt: 0 }
    });

    for (const subscription of subscriptionsWithUsage) {
      try {
        const unprocessedUsage = await usageTracker.getUnprocessedUsage(
          subscription.subscriptionId
        );

        if (unprocessedUsage.length === 0) continue;

        // Create usage invoice
        await this.createUsageInvoice(subscription, unprocessedUsage);
      } catch (error) {
        logger.error('Failed to process usage billing', {
          subscriptionId: subscription.subscriptionId,
          error
        });
      }
    }
  }

  /**
   * Create invoice for usage charges
   */
  private async createUsageInvoice(
    subscription: ISubscription,
    usageRecords: Array<{ usageId: string; quantity: number; totalAmount: number }>
  ): Promise<IInvoice> {
    const invoiceId = generateInvoiceId();

    const lineItems: InvoiceLineItem[] = usageRecords.map(record => ({
      id: generateId('item'),
      description: `Usage charges`,
      quantity: record.quantity,
      unitPrice: record.totalAmount / record.quantity,
      amount: record.totalAmount,
      currency: subscription.currency,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd
    }));

    const total = lineItems.reduce((sum, item) => sum + item.amount, 0);

    const invoice = new Invoice({
      invoiceId,
      subscriptionId: subscription.subscriptionId,
      customerId: subscription.customerId,
      status: InvoiceStatus.PENDING,
      currency: subscription.currency,
      subtotal: total,
      tax: 0,
      taxRate: 0,
      discount: 0,
      total,
      amountDue: total,
      amountPaid: 0,
      lineItems,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
      dueDate: new Date(),
      issuedAt: new Date(),
      billingAddress: subscription.billingAddress,
      paymentAttempts: [],
      metadata: {
        type: 'usage',
        usageIds: usageRecords.map(r => r.usageId)
      }
    });

    await invoice.save();

    // Mark usage as processed
    await usageTracker.markUsageProcessed(
      usageRecords.map(r => r.usageId),
      invoiceId
    );

    return invoice;
  }

  /**
   * Run dunning cycle for failed payments
   */
  public async runDunningCycle(): Promise<DunningResult[]> {
    const results: DunningResult[] = [];

    try {
      logger.info('Running dunning cycle');

      // Get subscriptions in dunning or with failed payments
      const pastDueSubscriptions = await Subscription.find({
        status: SubscriptionStatus.PAST_DUE,
        dunningState: { $ne: 'none' }
      });

      for (const subscription of pastDueSubscriptions) {
        try {
          const result = await this.processDunningStep(subscription);
          results.push(result);
        } catch (error) {
          logger.error('Failed to process dunning', {
            subscriptionId: subscription.subscriptionId,
            error
          });
          results.push({
            subscriptionId: subscription.subscriptionId,
            dunningState: subscription.dunningState,
            action: 'error',
            success: false
          });
        }
      }

      logger.info('Dunning cycle completed', { results: results.length });
      return results;
    } catch (error) {
      logger.error('Dunning cycle failed', { error });
      throw error;
    }
  }

  /**
   * Process a single dunning step
   */
  private async processDunningStep(subscription: ISubscription): Promise<DunningResult> {
    const now = new Date();
    const nextRetryDate = subscription.nextRetryDate;

    // Check if it's time to retry
    if (nextRetryDate && nextRetryDate > now) {
      return {
        subscriptionId: subscription.subscriptionId,
        dunningState: subscription.dunningState,
        action: 'waiting',
        success: true
      };
    }

    const maxRetries = parseInt(process.env.MAX_RETRY_ATTEMPTS || '3', 10);

    if (subscription.retryCount >= maxRetries) {
      // Max retries reached, suspend or cancel
      if (subscription.dunningState === 'final_notice') {
        subscription.status = SubscriptionStatus.CANCELLED;
        subscription.cancelledAt = now;
        subscription.expiredAt = now;
        await subscription.save();

        return {
          subscriptionId: subscription.subscriptionId,
          dunningState: subscription.dunningState,
          action: 'cancelled',
          success: true
        };
      }

      // Move to next dunning state
      const nextState = this.getNextDunningState(subscription.dunningState);
      subscription.dunningState = nextState;
      subscription.dunningStartedAt = now;
      subscription.retryCount = 0;

      // Schedule next retry
      const retryDelay = this.getDunningRetryDelay(nextState);
      subscription.nextRetryDate = new Date(now.getTime() + retryDelay);

      await subscription.save();

      return {
        subscriptionId: subscription.subscriptionId,
        dunningState: nextState,
        action: 'escalated',
        success: true
      };
    }

    // Attempt payment retry
    try {
      // Payment will be attempted by payment collector
      subscription.retryCount += 1;
      subscription.nextRetryDate = new Date(
        now.getTime() + this.getDunningRetryDelay(subscription.dunningState)
      );
      await subscription.save();

      return {
        subscriptionId: subscription.subscriptionId,
        dunningState: subscription.dunningState,
        action: 'retry_scheduled',
        success: true
      };
    } catch (error) {
      return {
        subscriptionId: subscription.subscriptionId,
        dunningState: subscription.dunningState,
        action: 'retry_failed',
        success: false
      };
    }
  }

  /**
   * Get next dunning state
   */
  private getNextDunningState(currentState: string): string {
    const stateOrder = ['first_notice', 'second_notice', 'final_notice', 'suspended'];
    const currentIndex = stateOrder.indexOf(currentState);
    return stateOrder[Math.min(currentIndex + 1, stateOrder.length - 1)];
  }

  /**
   * Get retry delay based on dunning state
   */
  private getDunningRetryDelay(state: string): number {
    const delays: Record<string, number> = {
      first_notice: 3 * 24 * 60 * 60 * 1000, // 3 days
      second_notice: 5 * 24 * 60 * 60 * 1000, // 5 days
      final_notice: 7 * 24 * 60 * 60 * 1000,  // 7 days
      suspended: 0
    };
    return delays[state] || 3 * 24 * 60 * 60 * 1000;
  }

  /**
   * Calculate billing metrics
   */
  public async calculateBillingMetrics(): Promise<{
    totalRevenue: number;
    invoicesGenerated: number;
    invoicesPaid: number;
    invoicesFailed: number;
    mrr: number;
  }> {
    const { start, end } = getMonthBoundaries(new Date());

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$total' }
        }
      }
    ];

    const results = await Invoice.aggregate(pipeline);

    let totalRevenue = 0;
    let invoicesGenerated = 0;
    let invoicesPaid = 0;
    let invoicesFailed = 0;

    for (const result of results) {
      invoicesGenerated += result.count;
      if (result._id === InvoiceStatus.PAID) {
        invoicesPaid += result.count;
        totalRevenue += result.total;
      } else if (result._id === InvoiceStatus.FAILED) {
        invoicesFailed += result.count;
      }
    }

    // Calculate MRR from active subscriptions
    const mrrPipeline = [
      {
        $match: {
          status: SubscriptionStatus.ACTIVE
        }
      },
      {
        $group: {
          _id: null,
          mrr: { $sum: '$currentTotal' }
        }
      }
    ];

    const mrrResult = await Subscription.aggregate(mrrPipeline);
    const mrr = mrrResult.length > 0 ? mrrResult[0].mrr : 0;

    return {
      totalRevenue,
      invoicesGenerated,
      invoicesPaid,
      invoicesFailed,
      mrr
    };
  }

  /**
   * Generate billing report
   */
  public async generateBillingReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalInvoices: number;
    totalRevenue: number;
    byStatus: Record<string, number>;
    byDay: Array<{ date: string; invoices: number; revenue: number }>;
  }> {
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$total' }
        }
      }
    ];

    const statusResults = await Invoice.aggregate(pipeline);

    const byStatus: Record<string, number> = {};
    let totalInvoices = 0;
    let totalRevenue = 0;

    for (const result of statusResults) {
      byStatus[result._id] = result.count;
      totalInvoices += result.count;
      if (result._id === InvoiceStatus.PAID) {
        totalRevenue += result.total;
      }
    }

    // Daily breakdown
    const dailyPipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: InvoiceStatus.PAID
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          invoices: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ];

    const dailyResults = await Invoice.aggregate(dailyPipeline);

    return {
      totalInvoices,
      totalRevenue,
      byStatus,
      byDay: dailyResults.map(r => ({
        date: r._id,
        invoices: r.invoices,
        revenue: r.revenue
      }))
    };
  }
}

// Export singleton instance
export const billingEngine = BillingEngine.getInstance();
