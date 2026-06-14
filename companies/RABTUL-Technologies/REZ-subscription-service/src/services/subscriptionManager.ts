import mongoose from 'mongoose';
import {
  ISubscription,
  Subscription,
  IPlan,
  Plan,
  Invoice
} from '../models';
import {
  SubscriptionStatus,
  SubscriptionEventType,
  SubscriptionCreate,
  SubscriptionUpdate,
  CancelSubscription,
  PauseSubscription,
  UpgradeDowngrade,
  BillingCycle,
  Plan as PlanType,
  InvoiceStatus,
  InvoiceLineItem
} from '../types';
import {
  generateSubscriptionId,
  calculateNextBillingDate,
  calculatePeriodDates,
  calculateProration,
  subscriptionLogger as logger,
  generateInvoiceId,
  generateId
} from '../utils';
import { EventEmitter } from 'events';
import { NotFoundError, ValidationError, AppError, BusinessRuleError } from '../../../../shared/rez-errors/src';

export class SubscriptionManager extends EventEmitter {
  private static instance: SubscriptionManager;

  private constructor() {
    super();
  }

  public static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  /**
   * Create a new subscription
   */
  async createSubscription(
    data: SubscriptionCreate,
    requestingService?: string
  ): Promise<ISubscription> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get the plan
      const plan = await Plan.findOne({ planId: data.planId, isActive: true });
      if (!plan) {
        throw new NotFoundError('Plan', data.planId);
      }

      // Determine billing cycle
      const billingCycle = data.billingCycle || plan.billingCycle;

      // Calculate dates
      const now = new Date();
      const startDate = data.startDate ? new Date(data.startDate) : now;

      let trialEnd: Date | undefined;
      let periodStart = startDate;
      let periodEnd: Date;
      let status: SubscriptionStatus;
      let basePrice: number;

      // Handle trial period
      if (plan.trialDays > 0 || data.trialEndDate) {
        status = SubscriptionStatus.TRIALING;
        trialEnd = data.trialEndDate
          ? new Date(data.trialEndDate)
          : new Date(startDate.getTime() + plan.trialDays * 24 * 60 * 60 * 1000);
        periodStart = trialEnd;
        periodEnd = calculateNextBillingDate(periodStart, billingCycle, data.billingAnchorDay);
        basePrice = 0; // No charge during trial
        logger.info('Creating trial subscription', {
          subscriptionId: data.customerId,
          planId: plan.planId,
          trialEnd: trialEnd.toISOString()
        });
      } else {
        status = SubscriptionStatus.ACTIVE;
        periodEnd = calculateNextBillingDate(startDate, billingCycle, data.billingAnchorDay);
        basePrice = plan.price;
        logger.info('Creating paid subscription', {
          subscriptionId: data.customerId,
          planId: plan.planId,
          billingCycle
        });
      }

      // Calculate grace period end
      const gracePeriodEnd = new Date(
        periodEnd.getTime() + plan.gracePeriodDays * 24 * 60 * 60 * 1000
      );

      // Create subscription
      const subscriptionId = generateSubscriptionId();
      const subscription = new Subscription({
        subscriptionId,
        customerId: data.customerId,
        planId: plan.planId,
        plan: {
          id: plan.planId,
          name: plan.name,
          description: plan.description,
          price: plan.price,
          currency: plan.currency,
          billingCycle: plan.billingCycle,
          features: plan.features,
          usageType: plan.usageType,
          usageLimits: plan.usageLimits,
          trialDays: plan.trialDays,
          gracePeriodDays: plan.gracePeriodDays,
          maxUsage: plan.maxUsage,
          metadata: plan.metadata
        } as PlanType,
        billingCycle,
        billingAnchorDay: data.billingAnchorDay,
        autoRenew: data.autoRenew,
        status,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        trialStart: trialEnd ? startDate : undefined,
        trialEnd,
        nextPaymentDate: periodEnd,
        basePrice,
        currentTotal: basePrice,
        currency: plan.currency,
        usageThisPeriod: 0,
        usageIncluded: plan.usageLimits?.included || 0,
        usageOverageRate: plan.usageLimits?.overageRate,
        usageType: plan.usageType,
        dunningState: 'none',
        retryCount: 0,
        isInGracePeriod: false,
        metadata: data.metadata || {},
        billingAddress: data.billingAddress,
        couponCode: data.couponCode,
        referralCode: data.referralCode
      });

      await subscription.save({ session });

      // Create initial invoice for paid subscriptions
      if (status === SubscriptionStatus.ACTIVE) {
        await this.createInvoice(subscription, session);
      }

      await session.commitTransaction();

      logger.info('Subscription created successfully', {
        subscriptionId,
        customerId: data.customerId,
        planId: plan.planId,
        status
      });

      // Emit event
      this.emit(SubscriptionEventType.CREATED, {
        subscription,
        plan,
        requestingService
      });

      return subscription;
    } catch (error) {
      await session.abortTransaction();
      logger.error('Failed to create subscription', { error, data });
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<ISubscription | null> {
    return Subscription.findOne({ subscriptionId });
  }

  /**
   * Get subscription by customer ID
   */
  async getSubscriptionsByCustomer(
    customerId: string,
    options: { includeCancelled?: boolean; limit?: number } = {}
  ): Promise<ISubscription[]> {
    const query: Record<string, unknown> = { customerId };

    if (!options.includeCancelled) {
      query.status = { $ne: SubscriptionStatus.CANCELLED };
    }

    return Subscription.find(query)
      .sort({ createdAt: -1 })
      .limit(options.limit || 50);
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    subscriptionId: string,
    data: SubscriptionUpdate
  ): Promise<ISubscription> {
    const subscription = await Subscription.findOne({ subscriptionId });
    if (!subscription) {
      throw new NotFoundError('Subscription', subscriptionId);
    }

    if (!subscription.canTransitionTo(subscription.status)) {
      throw new BusinessRuleError('Invalid subscription state for update', 'INVALID_STATE');
    }

    // Handle plan change
    if (data.planId && data.planId !== subscription.planId) {
      return this.changePlan(subscriptionId, {
        newPlanId: data.planId,
        effectiveDate: 'immediate',
        billingCycle: data.billingCycle
      });
    }

    // Update fields
    const updates: Record<string, unknown> = {};

    if (data.autoRenew !== undefined) {
      updates.autoRenew = data.autoRenew;
    }

    if (data.paymentMethodId) {
      updates.paymentMethodId = data.paymentMethodId;
    }

    if (data.billingAddress) {
      updates.billingAddress = data.billingAddress;
    }

    if (data.billingCycle && data.billingCycle !== subscription.billingCycle) {
      updates.billingCycle = data.billingCycle;
      updates.currentPeriodEnd = calculateNextBillingDate(
        subscription.currentPeriodEnd,
        data.billingCycle,
        data.billingAnchorDay
      );
    }

    if (data.metadata) {
      updates.metadata = { ...subscription.metadata, ...data.metadata };
    }

    Object.assign(subscription, updates);
    await subscription.save();

    logger.info('Subscription updated', { subscriptionId, updates });

    this.emit(SubscriptionEventType.UPDATED, { subscription, updates });

    return subscription;
  }

  /**
   * Change subscription plan (upgrade/downgrade)
   */
  async changePlan(
    subscriptionId: string,
    change: UpgradeDowngrade
  ): Promise<ISubscription> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const subscription = await Subscription.findOne({ subscriptionId }).session(session);
      if (!subscription) {
        throw new NotFoundError('Subscription', subscriptionId);
      }

      const newPlan = await Plan.findOne({ planId: change.newPlanId, isActive: true });
      if (!newPlan) {
        throw new NotFoundError('Plan', change.newPlanId);
      }

      const oldPlan = subscription.plan;
      const isUpgrade = newPlan.price > oldPlan.price;

      let prorationAmount = 0;
      let newPeriodStart: Date;
      let newPeriodEnd: Date;

      if (change.effectiveDate === 'immediate') {
        // Calculate proration
        prorationAmount = calculateProration(
          subscription.currentTotal,
          subscription.currentPeriodStart,
          subscription.currentPeriodEnd,
          new Date(),
          subscription.billingCycle
        );

        // Create prorated invoice
        if (prorationAmount > 0) {
          await this.createProratedInvoice(
            subscription,
            newPlan,
            prorationAmount,
            session
          );
        }

        // Update subscription immediately
        newPeriodStart = new Date();
        newPeriodEnd = calculateNextBillingDate(
          newPeriodStart,
          change.billingCycle || subscription.billingCycle,
          subscription.billingAnchorDay
        );
      } else {
        // Change at period end
        newPeriodStart = subscription.currentPeriodEnd;
        newPeriodEnd = calculateNextBillingDate(
          newPeriodStart,
          change.billingCycle || subscription.billingCycle,
          subscription.billingAnchorDay
        );
      }

      // Update subscription
      subscription.planId = newPlan.planId;
      subscription.plan = {
        id: newPlan.planId,
        name: newPlan.name,
        description: newPlan.description,
        price: newPlan.price,
        currency: newPlan.currency,
        billingCycle: newPlan.billingCycle,
        features: newPlan.features,
        usageType: newPlan.usageType,
        usageLimits: newPlan.usageLimits,
        trialDays: newPlan.trialDays,
        gracePeriodDays: newPlan.gracePeriodDays,
        maxUsage: newPlan.maxUsage,
        metadata: newPlan.metadata
      } as PlanType;
      subscription.basePrice = newPlan.price;
      subscription.currentTotal = newPlan.price;
      subscription.usageIncluded = newPlan.usageLimits?.included || 0;
      subscription.usageOverageRate = newPlan.usageLimits?.overageRate;
      subscription.usageType = newPlan.usageType;

      if (change.billingCycle) {
        subscription.billingCycle = change.billingCycle;
      }

      subscription.currentPeriodStart = newPeriodStart;
      subscription.currentPeriodEnd = newPeriodEnd;
      subscription.nextPaymentDate = newPeriodEnd;

      await subscription.save({ session });

      // Update grace period
      const gracePeriodEnd = new Date(
        newPeriodEnd.getTime() + newPlan.gracePeriodDays * 24 * 60 * 60 * 1000
      );
      subscription.gracePeriodEnd = gracePeriodEnd;

      await session.commitTransaction();

      logger.info('Plan changed', {
        subscriptionId,
        oldPlanId: oldPlan.id,
        newPlanId: newPlan.planId,
        isUpgrade,
        effectiveDate: change.effectiveDate,
        prorationAmount
      });

      // Emit event
      this.emit(
        isUpgrade ? SubscriptionEventType.UPGRADED : SubscriptionEventType.DOWNGRADED,
        {
          subscription,
          oldPlan,
          newPlan,
          prorationAmount,
          effectiveDate: change.effectiveDate
        }
      );

      return subscription;
    } catch (error) {
      await session.abortTransaction();
      logger.error('Failed to change plan', { error, subscriptionId, change });
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Pause subscription
   */
  async pauseSubscription(
    subscriptionId: string,
    pauseData: PauseSubscription
  ): Promise<ISubscription> {
    const subscription = await Subscription.findOne({ subscriptionId });
    if (!subscription) {
      throw new NotFoundError('Subscription', subscriptionId);
    }

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BusinessRuleError('Cannot pause a cancelled subscription', 'CANNOT_PAUSE_CANCELLED');
    }

    if (subscription.status === SubscriptionStatus.PAUSED) {
      throw new Error('Subscription is already paused');
    }

    const previousStatus = subscription.status;
    subscription.status = SubscriptionStatus.PAUSED;
    subscription.pausedAt = new Date();
    subscription.pauseReason = pauseData.reason;
    subscription.resumeDate = pauseData.resumeDate
      ? new Date(pauseData.resumeDate)
      : undefined;

    await subscription.save();

    logger.info('Subscription paused', {
      subscriptionId,
      reason: pauseData.reason,
      resumeDate: pauseData.resumeDate
    });

    this.emit(SubscriptionEventType.PAUSED, {
      subscription,
      previousStatus,
      reason: pauseData.reason
    });

    return subscription;
  }

  /**
   * Resume paused subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<ISubscription> {
    const subscription = await Subscription.findOne({ subscriptionId });
    if (!subscription) {
      throw new NotFoundError('Subscription', subscriptionId);
    }

    if (subscription.status !== SubscriptionStatus.PAUSED) {
      throw new Error('Subscription is not paused');
    }

    const previousStatus = subscription.status;

    // Adjust period dates for pause duration
    const pauseDuration = subscription.pausedAt
      ? new Date().getTime() - subscription.pausedAt.getTime()
      : 0;

    subscription.currentPeriodEnd = new Date(
      subscription.currentPeriodEnd.getTime() + pauseDuration
    );
    subscription.nextPaymentDate = new Date(
      subscription.nextPaymentDate.getTime() + pauseDuration
    );
    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.pausedAt = undefined;
    subscription.pauseReason = undefined;
    subscription.resumeDate = undefined;

    await subscription.save();

    logger.info('Subscription resumed', {
      subscriptionId,
      pauseDurationDays: Math.round(pauseDuration / (24 * 60 * 60 * 1000))
    });

    this.emit(SubscriptionEventType.RESUMED, {
      subscription,
      previousStatus
    });

    return subscription;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelData: CancelSubscription
  ): Promise<ISubscription> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const subscription = await Subscription.findOne({ subscriptionId }).session(session);
      if (!subscription) {
        throw new NotFoundError('Subscription', subscriptionId);
      }

      if (subscription.status === SubscriptionStatus.CANCELLED) {
        throw new Error('Subscription is already cancelled');
      }

      const previousStatus = subscription.status;

      if (cancelData.cancellationEffectiveDate === 'now' || cancelData.immediate) {
        // Cancel immediately
        subscription.status = SubscriptionStatus.CANCELLED;
        subscription.cancelledAt = new Date();
        subscription.cancellationReason = cancelData.reason;
        subscription.cancellationFeedback = cancelData.feedback;
        subscription.expiredAt = new Date();

        logger.info('Subscription cancelled immediately', {
          subscriptionId,
          reason: cancelData.reason
        });
      } else if (cancelData.cancellationEffectiveDate === 'period_end') {
        // Schedule cancellation at period end
        subscription.cancellationEffectiveDate = subscription.currentPeriodEnd;
        subscription.cancellationReason = cancelData.reason;
        subscription.cancellationFeedback = cancelData.feedback;
        subscription.autoRenew = false;

        logger.info('Subscription cancellation scheduled', {
          subscriptionId,
          effectiveDate: subscription.currentPeriodEnd.toISOString(),
          reason: cancelData.reason
        });
      } else if (cancelData.cancellationEffectiveDate === 'specific_date' && cancelData.specificDate) {
        // Schedule cancellation at specific date
        subscription.cancellationEffectiveDate = new Date(cancelData.specificDate);
        subscription.cancellationReason = cancelData.reason;
        subscription.cancellationFeedback = cancelData.feedback;
        subscription.autoRenew = false;

        logger.info('Subscription cancellation scheduled for specific date', {
          subscriptionId,
          effectiveDate: subscription.cancellationEffectiveDate.toISOString(),
          reason: cancelData.reason
        });
      }

      await subscription.save({ session });
      await session.commitTransaction();

      this.emit(SubscriptionEventType.CANCELLED, {
        subscription,
        previousStatus,
        reason: cancelData.reason,
        effectiveDate: cancelData.cancellationEffectiveDate
      });

      return subscription;
    } catch (error) {
      await session.abortTransaction();
      logger.error('Failed to cancel subscription', { error, subscriptionId });
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Reactivate a cancelled subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<ISubscription> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const subscription = await Subscription.findOne({ subscriptionId }).session(session);
      if (!subscription) {
        throw new NotFoundError('Subscription', subscriptionId);
      }

      if (subscription.status !== SubscriptionStatus.CANCELLED) {
        throw new Error('Subscription is not cancelled');
      }

      // Reset cancellation flags
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.cancelledAt = undefined;
      subscription.cancellationEffectiveDate = undefined;
      subscription.cancellationReason = undefined;
      subscription.cancellationFeedback = undefined;
      subscription.expiredAt = undefined;
      subscription.autoRenew = true;

      // Extend period
      const now = new Date();
      subscription.currentPeriodStart = now;
      subscription.currentPeriodEnd = calculateNextBillingDate(
        now,
        subscription.billingCycle,
        subscription.billingAnchorDay
      );
      subscription.nextPaymentDate = subscription.currentPeriodEnd;

      // Reset dunning
      subscription.dunningState = 'none';
      subscription.retryCount = 0;

      await subscription.save({ session });
      await session.commitTransaction();

      logger.info('Subscription reactivated', { subscriptionId });

      this.emit(SubscriptionEventType.CREATED, { subscription });

      return subscription;
    } catch (error) {
      await session.abortTransaction();
      logger.error('Failed to reactivate subscription', { error, subscriptionId });
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Convert trial to paid subscription
   */
  async convertTrialToPaid(subscriptionId: string): Promise<ISubscription> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const subscription = await Subscription.findOne({ subscriptionId }).session(session);
      if (!subscription) {
        throw new NotFoundError('Subscription', subscriptionId);
      }

      if (subscription.status !== SubscriptionStatus.TRIALING) {
        throw new Error('Subscription is not in trial');
      }

      const now = new Date();

      // Update to active status
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.currentPeriodStart = now;
      subscription.currentPeriodEnd = calculateNextBillingDate(
        now,
        subscription.billingCycle,
        subscription.billingAnchorDay
      );
      subscription.nextPaymentDate = subscription.currentPeriodEnd;
      subscription.basePrice = subscription.plan.price;
      subscription.currentTotal = subscription.plan.price;

      await subscription.save({ session });

      // Create first invoice
      await this.createInvoice(subscription, session);

      await session.commitTransaction();

      logger.info('Trial converted to paid', { subscriptionId });

      this.emit(SubscriptionEventType.RENEWED, { subscription });

      return subscription;
    } catch (error) {
      await session.abortTransaction();
      logger.error('Failed to convert trial to paid', { error, subscriptionId });
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Renew subscription (end of billing period)
   */
  async renewSubscription(subscriptionId: string): Promise<ISubscription> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const subscription = await Subscription.findOne({ subscriptionId }).session(session);
      if (!subscription) {
        throw new NotFoundError('Subscription', subscriptionId);
      }

      // Check if subscription should be cancelled
      if (subscription.cancellationEffectiveDate) {
        if (new Date() >= subscription.cancellationEffectiveDate) {
          subscription.status = SubscriptionStatus.CANCELLED;
          subscription.expiredAt = new Date();
          subscription.cancelledAt = subscription.cancellationEffectiveDate;
          await subscription.save({ session });
          await session.commitTransaction();

          logger.info('Subscription expired due to scheduled cancellation', {
            subscriptionId
          });

          this.emit(SubscriptionEventType.CANCELLED, { subscription });
          return subscription;
        }
      }

      // Check if auto-renew is disabled
      if (!subscription.autoRenew) {
        subscription.status = SubscriptionStatus.EXPIRED;
        subscription.expiredAt = new Date();
        await subscription.save({ session });
        await session.commitTransaction();

        logger.info('Subscription expired (auto-renew disabled)', { subscriptionId });

        this.emit(SubscriptionEventType.EXPIRED, { subscription });
        return subscription;
      }

      // Process renewal
      const now = new Date();
      subscription.currentPeriodStart = now;
      subscription.currentPeriodEnd = calculateNextBillingDate(
        now,
        subscription.billingCycle,
        subscription.billingAnchorDay
      );
      subscription.nextPaymentDate = subscription.currentPeriodEnd;
      subscription.usageThisPeriod = 0;
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.dunningState = 'none';
      subscription.retryCount = 0;
      subscription.isInGracePeriod = false;
      subscription.gracePeriodEnd = new Date(
        subscription.currentPeriodEnd.getTime() +
        subscription.plan.gracePeriodDays * 24 * 60 * 60 * 1000
      );

      await subscription.save({ session });

      // Create renewal invoice
      await this.createInvoice(subscription, session);

      await session.commitTransaction();

      logger.info('Subscription renewed', {
        subscriptionId,
        newPeriodEnd: subscription.currentPeriodEnd.toISOString()
      });

      this.emit(SubscriptionEventType.RENEWED, { subscription });

      return subscription;
    } catch (error) {
      await session.abortTransaction();
      logger.error('Failed to renew subscription', { error, subscriptionId });
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Create invoice for subscription
   */
  private async createInvoice(
    subscription: ISubscription,
    session: mongoose.ClientSession
  ): Promise<void> {
    const invoiceId = generateInvoiceId();

    const lineItem: InvoiceLineItem = {
      id: generateId('item'),
      description: `${subscription.plan.name} - ${subscription.billingCycle} subscription`,
      quantity: 1,
      unitPrice: subscription.currentTotal,
      amount: subscription.currentTotal,
      currency: subscription.currency,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd
    };

    const invoice = new Invoice({
      invoiceId,
      subscriptionId: subscription.subscriptionId,
      customerId: subscription.customerId,
      status: InvoiceStatus.PENDING,
      currency: subscription.currency,
      subtotal: subscription.currentTotal,
      tax: 0,
      taxRate: 0,
      discount: 0,
      total: subscription.currentTotal,
      amountDue: subscription.currentTotal,
      amountPaid: 0,
      lineItems: [lineItem],
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
      dueDate: subscription.currentPeriodEnd,
      issuedAt: new Date(),
      billingAddress: subscription.billingAddress,
      paymentAttempts: [],
      metadata: {
        type: 'subscription',
        billingCycle: subscription.billingCycle
      }
    });

    await invoice.save({ session });

    logger.info('Invoice created', {
      invoiceId,
      subscriptionId: subscription.subscriptionId,
      amount: subscription.currentTotal
    });
  }

  /**
   * Create prorated invoice for plan change
   */
  private async createProratedInvoice(
    subscription: ISubscription,
    newPlan: IPlan,
    prorationAmount: number,
    session: mongoose.ClientSession
  ): Promise<void> {
    const invoiceId = generateInvoiceId();

    const lineItem: InvoiceLineItem = {
      id: generateId('item'),
      description: `Proration - Upgrade to ${newPlan.name}`,
      quantity: 1,
      unitPrice: prorationAmount,
      amount: prorationAmount,
      currency: subscription.currency,
      periodStart: new Date(),
      periodEnd: subscription.currentPeriodEnd
    };

    const invoice = new Invoice({
      invoiceId,
      subscriptionId: subscription.subscriptionId,
      customerId: subscription.customerId,
      status: InvoiceStatus.PENDING,
      currency: subscription.currency,
      subtotal: prorationAmount,
      tax: 0,
      taxRate: 0,
      discount: 0,
      total: prorationAmount,
      amountDue: prorationAmount,
      amountPaid: 0,
      lineItems: [lineItem],
      periodStart: new Date(),
      periodEnd: subscription.currentPeriodEnd,
      dueDate: new Date(),
      issuedAt: new Date(),
      billingAddress: subscription.billingAddress,
      paymentAttempts: [],
      metadata: {
        type: 'proration',
        oldPlanId: subscription.planId,
        newPlanId: newPlan.planId
      }
    });

    await invoice.save({ session });

    logger.info('Prorated invoice created', {
      invoiceId,
      subscriptionId: subscription.subscriptionId,
      amount: prorationAmount
    });
  }

  /**
   * Get subscription analytics
   */
  async getAnalytics(customerId?: string): Promise<{
    total: number;
    active: number;
    trialing: number;
    pastDue: number;
    cancelled: number;
    paused: number;
  }> {
    const matchStage: Record<string, unknown> = {};
    if (customerId) {
      matchStage.customerId = customerId;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ];

    const results = await Subscription.aggregate(pipeline);

    const counts = {
      total: 0,
      active: 0,
      trialing: 0,
      pastDue: 0,
      cancelled: 0,
      paused: 0
    };

    for (const result of results) {
      switch (result._id) {
        case SubscriptionStatus.ACTIVE:
          counts.active = result.count;
          break;
        case SubscriptionStatus.TRIALING:
          counts.trialing = result.count;
          break;
        case SubscriptionStatus.PAST_DUE:
          counts.pastDue = result.count;
          break;
        case SubscriptionStatus.CANCELLED:
          counts.cancelled = result.count;
          break;
        case SubscriptionStatus.PAUSED:
          counts.paused = result.count;
          break;
      }
      counts.total += result.count;
    }

    return counts;
  }

  /**
   * Check and process expired trials
   */
  async processExpiredTrials(): Promise<ISubscription[]> {
    const now = new Date();
    const expiredTrials = await Subscription.find({
      status: SubscriptionStatus.TRIALING,
      trialEnd: { $lte: now }
    });

    const processed: ISubscription[] = [];

    for (const subscription of expiredTrials) {
      try {
        await this.convertTrialToPaid(subscription.subscriptionId);
        processed.push(subscription);

        // Emit trial ending event before conversion
        this.emit(SubscriptionEventType.TRIAL_ENDING, { subscription });
      } catch (error) {
        logger.error('Failed to process expired trial', {
          subscriptionId: subscription.subscriptionId,
          error
        });
      }
    }

    return processed;
  }

  /**
   * Check for upcoming trial endings (for notifications)
   */
  async getTrialsEndingSoon(daysBeforeEnd: number = 3): Promise<ISubscription[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysBeforeEnd * 24 * 60 * 60 * 1000);

    return Subscription.find({
      status: SubscriptionStatus.TRIALING,
      trialEnd: {
        $gt: now,
        $lte: futureDate
      }
    });
  }
}

// Export singleton instance
export const subscriptionManager = SubscriptionManager.getInstance();
