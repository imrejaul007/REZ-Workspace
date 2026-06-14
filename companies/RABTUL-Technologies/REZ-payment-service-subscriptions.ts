/**
 * Subscription Service - Day 8-14 of World-Class Plan
 * Recurring billing with automatic renewal
 */

import { v4 as uuidv4 } from 'uuid';
import { Customer, Subscription, Price } from '../models';
import { processPayment } from './paymentService';
import { sendWebhook } from './webhookService';
import { logger } from '../config/logger';

const SUBSCRIPTION_COLLECTION = 'subscriptions';
const PRICE_COLLECTION = 'prices';

/**
 * Create subscription
 */
export async function createSubscription(data: {
  customerId: string;
  priceId: string;
  paymentMethodId: string;
}): Promise<Subscription> {
  const price = await getPrice(data.priceId);
  if (!price) throw new Error('Price not found');

  const sub: Subscription = {
    id: `sub_${uuidv4()}`,
    customerId: data.customerId,
    priceId: data.priceId,
    status: 'active',
    currentPeriodStart: new Date(),
    currentPeriodEnd: addMonths(new Date(), 1),
    cancelAtPeriodEnd: false,
    items: [{ priceId: data.priceId, quantity: 1 }],
    defaultPaymentMethodId: data.paymentMethodId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await saveSubscription(sub);
  await sendWebhook('subscription.created', sub);

  return sub;
}

/**
 * Get subscription
 */
export async function getSubscription(id: string): Promise<Subscription | null> {
  return Subscription.findById(id);
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(id: string): Promise<Subscription> {
  const sub = await Subscription.findById(id);
  if (!sub) throw new Error('Subscription not found');

  sub.cancelAtPeriodEnd = true;
  sub.status = 'canceling';
  await sub.save();

  await sendWebhook('subscription.updated', sub);
  return sub;
}

/**
 * Charge subscription (called by scheduler)
 */
export async function chargeSubscription(id: string): Promise<{ success: boolean; invoice?: Invoice }> {
  const sub = await Subscription.findById(id);
  if (!sub || sub.status !== 'active') {
    return { success: false };
  }

  const price = await getPrice(sub.priceId);
  if (!price) return { success: false };

  const invoice = await createInvoice(sub, price);

  try {
    const payment = await processPayment({
      customerId: sub.customerId,
      amount: price.unitAmount,
      currency: 'INR',
      idempotencyKey: `sub_charge_${id}_${Date.now()}`,
    });

    if (payment.success) {
      await updateSubscriptionStatus(id, 'active');
      return { success: true, invoice: payment.invoice };
    } else {
      await updateSubscriptionStatus(id, 'past_due');
      await sendWebhook('subscription.payment_failed', { subscription: sub });
      return { success: false };
    }
  } catch (error) {
    logger.error('Subscription charge failed', { subscriptionId: id, error });
    await updateSubscriptionStatus(id, 'past_due');
    return { success: false };
  }
}

/**
 * Helper: Add months to date
 */
function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
