import { Queue } from 'bullmq';
import { getRedisBullMQConnection } from '../config/redis';

/**
 * Marketing Workflow Queues
 *
 * These queues handle async marketing automation workflows:
 * - Welcome campaign sequences via REZ-automation-service
 * - Loyalty enrollment via REZ-gamification-service
 * - Upsell recommendations via REZ-automation-service
 * - Abandonment email sequences via REZ-automation-service
 */

// Queue for triggering welcome campaign sequences
export const welcomeCampaignQueue = new Queue('mkt-welcome-campaign', {
  connection: getRedisBullMQConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { age: 7 * 86400 },
    removeOnFail: { age: 14 * 86400 },
  },
});

// Queue for loyalty program enrollment
export const loyaltyEnrollmentQueue = new Queue('mkt-loyalty-enrollment', {
  connection: getRedisBullMQConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { age: 7 * 86400 },
    removeOnFail: { age: 14 * 86400 },
  },
});

// Queue for triggering upsell recommendations
export const upsellRecommendationsQueue = new Queue('mkt-upsell-recommendations', {
  connection: getRedisBullMQConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { age: 7 * 86400 },
    removeOnFail: { age: 14 * 86400 },
  },
});

// Queue for triggering abandonment email sequences
export const abandonmentEmailQueue = new Queue('mkt-abandonment-email', {
  connection: getRedisBullMQConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { age: 7 * 86400 },
    removeOnFail: { age: 14 * 86400 },
  },
});

/**
 * Trigger welcome campaign sequence for a new customer
 */
export async function triggerWelcomeCampaign(params: {
  userId: string;
  orderId: string;
  merchantId?: string;
}): Promise<void> {
  const { userId, orderId, merchantId } = params;

  await welcomeCampaignQueue.add('welcome-campaign', {
    userId,
    orderId,
    merchantId,
    triggeredAt: new Date().toISOString(),
    source: 'conversion-event',
  });
}

/**
 * Enroll customer in loyalty program after conversion
 */
export async function triggerLoyaltyEnrollment(params: {
  userId: string;
  orderId: string;
  orderTotal: number;
  merchantId?: string;
}): Promise<void> {
  const { userId, orderId, orderTotal, merchantId } = params;

  await loyaltyEnrollmentQueue.add('loyalty-enrollment', {
    userId,
    orderId,
    orderTotal,
    merchantId,
    triggeredAt: new Date().toISOString(),
    source: 'conversion-event',
  });
}

/**
 * Trigger upsell recommendations based on purchase
 */
export async function triggerUpsellRecommendations(params: {
  userId: string;
  orderId: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  orderTotal: number;
  merchantId?: string;
}): Promise<void> {
  const { userId, orderId, items, orderTotal, merchantId } = params;

  await upsellRecommendationsQueue.add('upsell-recommendations', {
    userId,
    orderId,
    items,
    orderTotal,
    merchantId,
    triggeredAt: new Date().toISOString(),
    source: 'conversion-event',
  });
}

/**
 * Trigger abandonment email sequence for cart recovery
 */
export async function triggerAbandonmentEmail(params: {
  userId: string;
  cartId: string;
  items: Array<{ name: string; price: number }>;
  totalValue: number;
  merchantId?: string;
}): Promise<void> {
  const { userId, cartId, items, totalValue, merchantId } = params;

  await abandonmentEmailQueue.add('abandonment-email', {
    userId,
    cartId,
    items,
    totalValue,
    merchantId,
    triggeredAt: new Date().toISOString(),
    source: 'abandonment-event',
  });
}
