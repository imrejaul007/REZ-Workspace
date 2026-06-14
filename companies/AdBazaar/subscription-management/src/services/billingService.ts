import axios from 'axios';
import { Subscription, Invoice } from '../models/index.js';
import {
  SubscriptionStatus,
  BillingCycle,
  InvoiceStatus,
  SubscriptionEventType
} from '../types/index.js';
import { subscriptionService } from './subscriptionService.js';
import { invoiceService } from './invoiceService.js';
import logger from 'utils/logger.js';

export class BillingService {
  private readonly walletServiceUrl: string;
  private readonly notificationServiceUrl: string;

  constructor() {
    this.walletServiceUrl = process.env.REZ_WALLET_SERVICE_URL || 'http://localhost:4004';
    this.notificationServiceUrl = process.env.REZ_NOTIFICATION_SERVICE_URL || 'http://localhost:4011';
  }

  /**
   * Process subscription renewal billing
   */
  async processRenewal(subscriptionId: string): Promise<{
    success: boolean;
    error?: string;
    invoiceId?: string;
  }> {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        return { success: false, error: 'Subscription not found' };
      }

      // Calculate billing amount
      const billingAmount = await this.calculateBillingAmount(subscription);
      if (billingAmount === 0) {
        // Free tier or credits cover cost
        await subscriptionService.renewSubscription(subscriptionId);
        return { success: true };
      }

      // Create invoice
      const invoiceResult = await invoiceService.createInvoice({
        subscriptionId: subscription._id.toString(),
        publisherId: subscription.publisherId,
        planId: subscription.planId,
        billingPeriodStart: subscription.endDate,
        billingPeriodEnd: this.calculateNewEndDate(subscription.endDate, subscription.billingCycle),
        amount: billingAmount
      });

      if (!invoiceResult.success || !invoiceResult.data) {
        return { success: false, error: 'Failed to create invoice' };
      }

      // Process payment
      const paymentResult = await this.processPayment(
        subscription.publisherId,
        billingAmount,
        'INR',
        invoiceResult.data._id.toString()
      );

      if (paymentResult.success) {
        // Mark invoice as paid and renew subscription
        await invoiceService.payInvoice(invoiceResult.data._id.toString());
        await subscriptionService.renewSubscription(subscriptionId);

        // Send notification
        await this.sendNotification(subscription.publisherId, 'subscription_renewed', {
          subscriptionId: subscription._id,
          amount: billingAmount,
          nextBillingDate: subscription.nextBillingDate
        });

        return { success: true, invoiceId: invoiceResult.data._id.toString() };
      } else {
        // Payment failed - log event
        await this.logBillingEvent(subscription, SubscriptionEventType.PAYMENT_FAILED, {
          invoiceId: invoiceResult.data._id.toString(),
          amount: billingAmount,
          error: paymentResult.error
        });

        return { success: false, error: paymentResult.error };
      }
    } catch (error) {
      logger.error('Failed to process renewal', { error, subscriptionId });
      return { success: false, error: 'Failed to process renewal' };
    }
  }

  /**
   * Process payment through wallet service
   */
  async processPayment(
    publisherId: string,
    amount: number,
    currency: string,
    invoiceId: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // Call wallet service to deduct payment
      const response = await axios.post(
        `${this.walletServiceUrl}/api/wallet/deduct`,
        {
          userId: publisherId,
          amount,
          currency,
          reason: `Subscription renewal - Invoice: ${invoiceId}`
        },
        {
          headers: {
            'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
          },
          timeout: 30000
        }
      );

      if (response.data.success) {
        return {
          success: true,
          transactionId: response.data.transactionId
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Payment failed'
        };
      }
    } catch (error: any) {
      logger.error('Payment processing error', { error, publisherId, amount });
      return {
        success: false,
        error: error.response?.data?.error || 'Payment service unavailable'
      };
    }
  }

  /**
   * Handle trial expiration
   */
  async handleTrialExpiration(subscriptionId: string): Promise<{
    success: boolean;
    action: 'converted' | 'expired' | 'failed';
    error?: string;
  }> {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        return { success: false, action: 'failed', error: 'Subscription not found' };
      }

      if (subscription.status !== SubscriptionStatus.TRIAL) {
        return { success: false, action: 'failed', error: 'Subscription is not in trial' };
      }

      // Check if trial has actually expired
      if (subscription.trialEndDate && new Date() < subscription.trialEndDate) {
        return { success: false, action: 'failed', error: 'Trial has not expired yet' };
      }

      // Attempt to process payment for first billing period
      const billingResult = await this.processRenewal(subscriptionId);

      if (billingResult.success) {
        // Trial converted to paid subscription
        await this.logBillingEvent(subscription, SubscriptionEventType.TRIAL_ENDED, {
          converted: true
        });

        await this.sendNotification(subscription.publisherId, 'trial_converted', {
          subscriptionId: subscription._id
        });

        return { success: true, action: 'converted' };
      } else {
        // Trial expired without conversion
        subscription.status = SubscriptionStatus.EXPIRED;
        await subscription.save();

        await this.logBillingEvent(subscription, SubscriptionEventType.TRIAL_ENDED, {
          converted: false,
          reason: billingResult.error
        });

        await this.sendNotification(subscription.publisherId, 'trial_expired', {
          subscriptionId: subscription._id
        });

        return { success: true, action: 'expired' };
      }
    } catch (error) {
      logger.error('Failed to handle trial expiration', { error, subscriptionId });
      return { success: false, action: 'failed', error: 'Failed to process trial expiration' };
    }
  }

  /**
   * Calculate billing amount based on plan and billing cycle
   */
  async calculateBillingAmount(subscription: any): Promise<number> {
    try {
      const response = await axios.get(
        `${process.env.PLAN_SERVICE_URL || 'http://localhost:5002'}/api/plans/${subscription.planId}`,
        {
          headers: {
            'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
          }
        }
      );

      const plan = response.data.data;
      let price = plan.price;

      switch (subscription.billingCycle) {
        case BillingCycle.QUARTERLY:
          price = plan.price * 3 * 0.95;
          break;
        case BillingCycle.YEARLY:
          price = plan.price * 12 * 0.80;
          break;
      }

      // Apply any credits
      const credits = subscription.metadata?.credits || 0;
      return Math.max(0, Math.round((price - credits) * 100) / 100);
    } catch (error) {
      logger.error('Failed to calculate billing amount', { error, subscriptionId: subscription._id });
      return 0;
    }
  }

  /**
   * Calculate new end date
   */
  private calculateNewEndDate(currentEndDate: Date, billingCycle: BillingCycle): Date {
    const newEndDate = new Date(currentEndDate);
    switch (billingCycle) {
      case BillingCycle.MONTHLY:
        newEndDate.setMonth(newEndDate.getMonth() + 1);
        break;
      case BillingCycle.QUARTERLY:
        newEndDate.setMonth(newEndDate.getMonth() + 3);
        break;
      case BillingCycle.YEARLY:
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        break;
    }
    return newEndDate;
  }

  /**
   * Log billing event
   */
  private async logBillingEvent(
    subscription: any,
    type: SubscriptionEventType,
    data: Record<string, any>
  ): Promise<void> {
    try {
      const { SubscriptionEvent } = await import('../models/index.js');
      await SubscriptionEvent.create({
        subscriptionId: subscription._id.toString(),
        publisherId: subscription.publisherId,
        type,
        data,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Failed to log billing event', { error });
    }
  }

  /**
   * Send notification
   */
  private async sendNotification(
    publisherId: string,
    type: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      await axios.post(
        `${this.notificationServiceUrl}/api/notifications`,
        {
          userId: publisherId,
          type,
          data,
          channels: ['email', 'push']
        },
        {
          headers: {
            'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
          },
          timeout: 5000
        }
      );
    } catch (error) {
      // Non-critical, log only
      logger.warn('Failed to send notification', { error, publisherId, type });
    }
  }

  /**
   * Get upcoming renewals
   */
  async getUpcomingRenewals(days: number = 7): Promise<any[]> {
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const subscriptions = await Subscription.find({
        status: SubscriptionStatus.ACTIVE,
        autoRenew: true,
        nextBillingDate: {
          $gte: now,
          $lte: futureDate
        }
      })
        .populate('planId')
        .lean();

      return subscriptions;
    } catch (error) {
      logger.error('Failed to get upcoming renewals', { error });
      return [];
    }
  }

  /**
   * Process batch renewals
   */
  async processBatchRenewals(): Promise<{
    processed: number;
    successful: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    try {
      // Get all subscriptions due for renewal
      const subscriptions = await Subscription.find({
        status: SubscriptionStatus.ACTIVE,
        autoRenew: true,
        nextBillingDate: { $lte: new Date() }
      });

      for (const subscription of subscriptions) {
        results.processed++;
        const result = await this.processRenewal(subscription._id.toString());

        if (result.success) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push(`${subscription._id}: ${result.error}`);
        }
      }

      logger.info('Batch renewal processing complete', results);
      return results;
    } catch (error) {
      logger.error('Batch renewal processing failed', { error });
      return results;
    }
  }
}

export const billingService = new BillingService();