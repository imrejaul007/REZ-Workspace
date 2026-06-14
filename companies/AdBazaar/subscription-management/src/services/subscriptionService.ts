import {
  Subscription,
  Plan,
  Invoice,
  SubscriptionEvent
} from '../models/index.js';
import {
  ISubscription,
  IPlan,
  SubscriptionStatus,
  BillingCycle,
  SubscriptionEventType,
  CreateSubscriptionSchema,
  UpdateSubscriptionSchema,
  ApiResponse
} from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';
import logger from 'utils/logger.js';
import {
  subscriptionCreatedTotal,
  activeSubscriptionsGauge
} from '../utils/metrics.js';
import { planService } from './planService.js';
import { invoiceService } from './invoiceService.js';

export class SubscriptionService {
  /**
   * Create a new subscription
   */
  async createSubscription(
    data: CreateSubscriptionSchema
  ): Promise<ApiResponse<ISubscription>> {
    try {
      logger.info('Creating subscription', { publisherId: data.publisherId, planId: data.planId });

      // Validate plan exists and is active
      const plan = await planService.getPlanById(data.planId);
      if (!plan) {
        return { success: false, error: 'Plan not found' };
      }

      // Calculate dates
      const now = new Date();
      let startDate = data.startDate ? new Date(data.startDate) : now;
      let endDate: Date;
      let trialEndDate: Date | undefined;
      let status = SubscriptionStatus.ACTIVE;

      // Handle trial period
      if (data.trialDays > 0) {
        trialEndDate = new Date(startDate);
        trialEndDate.setDate(trialEndDate.getDate() + data.trialDays);
        status = SubscriptionStatus.TRIAL;
      }

      // Calculate end date based on billing cycle
      endDate = this.calculateEndDate(startDate, data.billingCycle);

      // Create subscription
      const subscription = new Subscription({
        publisherId: data.publisherId,
        planId: data.planId,
        status,
        billingCycle: data.billingCycle,
        startDate,
        endDate,
        nextBillingDate: trialEndDate || endDate,
        trialEndDate,
        autoRenew: true,
        metadata: data.metadata || {}
      });

      await subscription.save();

      // Log event
      await this.logEvent(subscription._id.toString(), data.publisherId, SubscriptionEventType.CREATED, {
        planId: data.planId,
        billingCycle: data.billingCycle,
        trialDays: data.trialDays,
        status
      });

      // Create initial invoice
      await invoiceService.createInvoice({
        subscriptionId: subscription._id.toString(),
        publisherId: data.publisherId,
        planId: data.planId,
        billingPeriodStart: startDate,
        billingPeriodEnd: endDate,
        amount: data.trialDays > 0 ? 0 : this.calculateAmount(plan, data.billingCycle)
      });

      // Update metrics
      subscriptionCreatedTotal.inc({ plan_type: plan.type });
      await this.updateActiveSubscriptionsMetrics();

      logger.info('Subscription created successfully', {
        subscriptionId: subscription._id,
        publisherId: data.publisherId
      });

      return { success: true, data: subscription.toObject() };
    } catch (error) {
      logger.error('Failed to create subscription', { error, data });
      return { success: false, error: 'Failed to create subscription' };
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(id: string): Promise<ApiResponse<ISubscription>> {
    try {
      const subscription = await Subscription.findById(id).lean();
      if (!subscription) {
        return { success: false, error: 'Subscription not found' };
      }
      return { success: true, data: subscription as ISubscription };
    } catch (error) {
      logger.error('Failed to get subscription', { error, id });
      return { success: false, error: 'Failed to get subscription' };
    }
  }

  /**
   * Get subscription by publisher ID
   */
  async getSubscriptionByPublisher(publisherId: string): Promise<ApiResponse<ISubscription>> {
    try {
      const subscription = await Subscription.findOne({
        publisherId,
        status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] }
      }).lean();
      if (!subscription) {
        return { success: false, error: 'No active subscription found' };
      }
      return { success: true, data: subscription as ISubscription };
    } catch (error) {
      logger.error('Failed to get subscription by publisher', { error, publisherId });
      return { success: false, error: 'Failed to get subscription' };
    }
  }

  /**
   * List subscriptions with filters and pagination
   */
  async listSubscriptions(filters: {
    publisherId?: string;
    status?: SubscriptionStatus;
    planId?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ subscriptions: ISubscription[]; total: number; page: number; limit: number }>> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const query: any = {};
      if (filters.publisherId) query.publisherId = filters.publisherId;
      if (filters.status) query.status = filters.status;
      if (filters.planId) query.planId = filters.planId;

      const [subscriptions, total] = await Promise.all([
        Subscription.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Subscription.countDocuments(query)
      ]);

      return {
        success: true,
        data: { subscriptions: subscriptions as ISubscription[], total, page, limit }
      };
    } catch (error) {
      logger.error('Failed to list subscriptions', { error, filters });
      return { success: false, error: 'Failed to list subscriptions' };
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    id: string,
    data: UpdateSubscriptionSchema
  ): Promise<ApiResponse<ISubscription>> {
    try {
      const subscription = await Subscription.findById(id);
      if (!subscription) {
        return { success: false, error: 'Subscription not found' };
      }

      // Apply updates
      if (data.status) subscription.status = data.status;
      if (data.billingCycle) subscription.billingCycle = data.billingCycle;
      if (data.autoRenew !== undefined) subscription.autoRenew = data.autoRenew;
      if (data.metadata) subscription.metadata = { ...subscription.metadata, ...data.metadata };

      await subscription.save();
      await this.updateActiveSubscriptionsMetrics();

      logger.info('Subscription updated', { subscriptionId: id, data });
      return { success: true, data: subscription.toObject() };
    } catch (error) {
      logger.error('Failed to update subscription', { error, id, data });
      return { success: false, error: 'Failed to update subscription' };
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    id: string,
    reason?: string,
    immediate?: boolean
  ): Promise<ApiResponse<ISubscription>> {
    try {
      const subscription = await Subscription.findById(id);
      if (!subscription) {
        return { success: false, error: 'Subscription not found' };
      }

      const previousStatus = subscription.status;

      if (immediate) {
        subscription.status = SubscriptionStatus.CANCELLED;
      } else {
        subscription.autoRenew = false;
        // Subscription will end at current period
      }

      await subscription.save();

      // Log event
      await this.logEvent(id, subscription.publisherId, SubscriptionEventType.CANCELLED, {
        previousStatus,
        reason,
        immediate
      });

      // Update metrics
      await this.updateActiveSubscriptionsMetrics();

      logger.info('Subscription cancelled', { subscriptionId: id, reason, immediate });
      return { success: true, data: subscription.toObject() };
    } catch (error) {
      logger.error('Failed to cancel subscription', { error, id });
      return { success: false, error: 'Failed to cancel subscription' };
    }
  }

  /**
   * Renew subscription
   */
  async renewSubscription(id: string): Promise<ApiResponse<ISubscription>> {
    try {
      const subscription = await Subscription.findById(id);
      if (!subscription) {
        return { success: false, error: 'Subscription not found' };
      }

      const plan = await planService.getPlanById(subscription.planId);
      if (!plan) {
        return { success: false, error: 'Plan not found' };
      }

      const previousEndDate = subscription.endDate;
      const newEndDate = this.calculateEndDate(previousEndDate, subscription.billingCycle);

      subscription.endDate = newEndDate;
      subscription.nextBillingDate = newEndDate;
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.autoRenew = true;

      await subscription.save();

      // Create renewal invoice
      await invoiceService.createInvoice({
        subscriptionId: subscription._id.toString(),
        publisherId: subscription.publisherId,
        planId: subscription.planId,
        billingPeriodStart: previousEndDate,
        billingPeriodEnd: newEndDate,
        amount: this.calculateAmount(plan, subscription.billingCycle)
      });

      // Log event
      await this.logEvent(id, subscription.publisherId, SubscriptionEventType.RENEWED, {
        previousEndDate,
        newEndDate,
        billingCycle: subscription.billingCycle
      });

      logger.info('Subscription renewed', { subscriptionId: id, newEndDate });
      return { success: true, data: subscription.toObject() };
    } catch (error) {
      logger.error('Failed to renew subscription', { error, id });
      return { success: false, error: 'Failed to renew subscription' };
    }
  }

  /**
   * Upgrade subscription
   */
  async upgradeSubscription(
    id: string,
    newPlanId: string,
    effectiveDate: 'immediate' | 'end_of_cycle' = 'immediate',
    preserveCredits: boolean = true
  ): Promise<ApiResponse<ISubscription>> {
    try {
      const subscription = await Subscription.findById(id);
      if (!subscription) {
        return { success: false, error: 'Subscription not found' };
      }

      const [currentPlan, newPlan] = await Promise.all([
        planService.getPlanById(subscription.planId),
        planService.getPlanById(newPlanId)
      ]);

      if (!currentPlan || !newPlan) {
        return { success: false, error: 'Plan not found' };
      }

      if (newPlan.price <= currentPlan.price) {
        return { success: false, error: 'New plan must be more expensive for upgrade' };
      }

      const previousPlanId = subscription.planId;

      if (effectiveDate === 'immediate') {
        subscription.planId = newPlanId;
        subscription.status = SubscriptionStatus.ACTIVE;
        await subscription.save();

        // Calculate prorated amount
        const proratedAmount = this.calculateProration(
          currentPlan,
          newPlan,
          subscription,
          preserveCredits
        );

        await invoiceService.createInvoice({
          subscriptionId: subscription._id.toString(),
          publisherId: subscription.publisherId,
          planId: newPlanId,
          billingPeriodStart: new Date(),
          billingPeriodEnd: subscription.endDate,
          amount: proratedAmount
        });
      }

      // Log event
      await this.logEvent(id, subscription.publisherId, SubscriptionEventType.UPGRADED, {
        previousPlanId,
        newPlanId,
        effectiveDate,
        preserveCredits
      });

      await this.updateActiveSubscriptionsMetrics();

      logger.info('Subscription upgraded', { subscriptionId: id, newPlanId });
      return { success: true, data: subscription.toObject() };
    } catch (error) {
      logger.error('Failed to upgrade subscription', { error, id, newPlanId });
      return { success: false, error: 'Failed to upgrade subscription' };
    }
  }

  /**
   * Downgrade subscription
   */
  async downgradeSubscription(
    id: string,
    newPlanId: string,
    effectiveDate: 'end_of_cycle' = 'end_of_cycle',
    preserveCredits: boolean = true
  ): Promise<ApiResponse<ISubscription>> {
    try {
      const subscription = await Subscription.findById(id);
      if (!subscription) {
        return { success: false, error: 'Subscription not found' };
      }

      const [currentPlan, newPlan] = await Promise.all([
        planService.getPlanById(subscription.planId),
        planService.getPlanById(newPlanId)
      ]);

      if (!currentPlan || !newPlan) {
        return { success: false, error: 'Plan not found' };
      }

      if (newPlan.price >= currentPlan.price) {
        return { success: false, error: 'New plan must be less expensive for downgrade' };
      }

      const previousPlanId = subscription.planId;

      if (effectiveDate === 'immediate') {
        subscription.planId = newPlanId;
        await subscription.save();
      } else {
        // Schedule downgrade at end of cycle
        subscription.metadata = {
          ...subscription.metadata,
          scheduledDowngrade: {
            planId: newPlanId,
            effectiveDate: subscription.endDate
          }
        };
        await subscription.save();
      }

      // Log event
      await this.logEvent(id, subscription.publisherId, SubscriptionEventType.DOWNGRADED, {
        previousPlanId,
        newPlanId,
        effectiveDate,
        preserveCredits
      });

      await this.updateActiveSubscriptionsMetrics();

      logger.info('Subscription downgraded', { subscriptionId: id, newPlanId });
      return { success: true, data: subscription.toObject() };
    } catch (error) {
      logger.error('Failed to downgrade subscription', { error, id, newPlanId });
      return { success: false, error: 'Failed to downgrade subscription' };
    }
  }

  /**
   * Get subscription events
   */
  async getSubscriptionEvents(
    subscriptionId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<ApiResponse<{ events: any[]; total: number }>> {
    try {
      const skip = (page - 1) * limit;
      const [events, total] = await Promise.all([
        SubscriptionEvent.find({ subscriptionId })
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        SubscriptionEvent.countDocuments({ subscriptionId })
      ]);

      return { success: true, data: { events, total } };
    } catch (error) {
      logger.error('Failed to get subscription events', { error, subscriptionId });
      return { success: false, error: 'Failed to get events' };
    }
  }

  // Helper methods
  private calculateEndDate(startDate: Date, billingCycle: BillingCycle): Date {
    const end = new Date(startDate);
    switch (billingCycle) {
      case BillingCycle.MONTHLY:
        end.setMonth(end.getMonth() + 1);
        break;
      case BillingCycle.QUARTERLY:
        end.setMonth(end.getMonth() + 3);
        break;
      case BillingCycle.YEARLY:
        end.setFullYear(end.getFullYear() + 1);
        break;
    }
    return end;
  }

  private calculateAmount(plan: IPlan, billingCycle: BillingCycle): number {
    let price = plan.price;
    switch (billingCycle) {
      case BillingCycle.QUARTERLY:
        price = plan.price * 3 * 0.95; // 5% discount
        break;
      case BillingCycle.YEARLY:
        price = plan.price * 12 * 0.80; // 20% discount
        break;
    }
    return Math.round(price * 100) / 100;
  }

  private calculateProration(
    currentPlan: IPlan,
    newPlan: IPlan,
    subscription: any,
    preserveCredits: boolean
  ): number {
    const currentAmount = this.calculateAmount(currentPlan, subscription.billingCycle);
    const newAmount = this.calculateAmount(newPlan, subscription.billingCycle);
    const diff = newAmount - currentAmount;

    if (preserveCredits && subscription.metadata?.credits) {
      return Math.max(0, diff - subscription.metadata.credits);
    }

    return Math.max(0, diff);
  }

  private async logEvent(
    subscriptionId: string,
    publisherId: string,
    type: SubscriptionEventType,
    data: Record<string, any>
  ): Promise<void> {
    try {
      await SubscriptionEvent.create({
        subscriptionId,
        publisherId,
        type,
        data,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Failed to log subscription event', { error, subscriptionId, type });
    }
  }

  private async updateActiveSubscriptionsMetrics(): Promise<void> {
    try {
      const [active, trial, cancelled, expired] = await Promise.all([
        Subscription.countDocuments({ status: SubscriptionStatus.ACTIVE }),
        Subscription.countDocuments({ status: SubscriptionStatus.TRIAL }),
        Subscription.countDocuments({ status: SubscriptionStatus.CANCELLED }),
        Subscription.countDocuments({ status: SubscriptionStatus.EXPIRED })
      ]);

      activeSubscriptionsGauge.set({ status: 'active' }, active);
      activeSubscriptionsGauge.set({ status: 'trial' }, trial);
      activeSubscriptionsGauge.set({ status: 'cancelled' }, cancelled);
      activeSubscriptionsGauge.set({ status: 'expired' }, expired);
    } catch (error) {
      logger.error('Failed to update metrics', { error });
    }
  }
}

export const subscriptionService = new SubscriptionService();