import { Worker, Job } from 'bullmq';
import axios from 'axios';
import { getRedisBullMQConnection } from '../config/redis';
import { logger } from '../config/logger';

/**
 * Marketing Workflow Worker
 *
 * Processes marketing automation jobs from the following queues:
 * - mkt-welcome-campaign: Triggers welcome campaign sequences via REZ-automation-service
 * - mkt-loyalty-enrollment: Enrolls users in loyalty program via REZ-gamification-service
 * - mkt-upsell-recommendations: Triggers upsell recommendations via REZ-automation-service
 * - mkt-abandonment-email: Triggers abandonment email sequences via REZ-automation-service
 */

// Service URLs from environment
const AUTOMATION_SERVICE_URL = process.env.AUTOMATION_SERVICE_URL || 'http://localhost:4010';
const GAMIFICATION_SERVICE_URL = process.env.GAMIFICATION_SERVICE_URL || 'http://localhost:4011';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

// Helper to make authenticated internal service calls
async function callService(url: string, payload: Record<string, unknown>): Promise<void> {
  try {
    await axios.post(url, payload, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
        'X-Internal-Service': 'rez-marketing-service',
      },
    });
  } catch (err) {
    // Re-throw so BullMQ can retry
    throw new Error(`Service call failed: ${err.message}`);
  }
}

// ── Welcome Campaign Worker ────────────────────────────────────────────────────

export const welcomeCampaignWorker = new Worker(
  'mkt-welcome-campaign',
  async (job: Job) => {
    const { userId, orderId, merchantId, triggeredAt } = job.data;

    logger.info('[Workflow:Welcome] Processing welcome campaign', { userId, orderId });

    await callService(`${AUTOMATION_SERVICE_URL}/api/workflows/trigger/welcome-campaign`, {
      userId,
      orderId,
      merchantId,
      triggeredAt,
      source: 'marketing-service',
    });

    logger.info('[Workflow:Welcome] Welcome campaign triggered successfully', { userId, orderId });
    return { success: true, userId, orderId };
  },
  {
    connection: getRedisBullMQConnection(),
    concurrency: 5,
    removeOnComplete: { age: 7 * 86400 },
    removeOnFail: { age: 30 * 86400 },
  },
);

welcomeCampaignWorker.on('error', (err) => {
  logger.error('[Workflow:Welcome] Worker error', { error: err.message });
});

welcomeCampaignWorker.on('failed', (job, err) => {
  logger.error('[Workflow:Welcome] Job failed', {
    jobId: job?.id,
    userId: job?.data?.userId,
    error: err.message,
  });
});

// ── Loyalty Enrollment Worker ──────────────────────────────────────────────────

export const loyaltyEnrollmentWorker = new Worker(
  'mkt-loyalty-enrollment',
  async (job: Job) => {
    const { userId, orderId, orderTotal, merchantId, triggeredAt } = job.data;

    logger.info('[Workflow:Loyalty] Processing loyalty enrollment', { userId, orderId });

    await callService(`${GAMIFICATION_SERVICE_URL}/api/loyalty/enroll`, {
      userId,
      orderId,
      orderTotal,
      merchantId,
      triggeredAt,
      source: 'marketing-service',
    });

    logger.info('[Workflow:Loyalty] Loyalty enrollment triggered successfully', { userId, orderId });
    return { success: true, userId, orderId };
  },
  {
    connection: getRedisBullMQConnection(),
    concurrency: 5,
    removeOnComplete: { age: 7 * 86400 },
    removeOnFail: { age: 30 * 86400 },
  },
);

loyaltyEnrollmentWorker.on('error', (err) => {
  logger.error('[Workflow:Loyalty] Worker error', { error: err.message });
});

loyaltyEnrollmentWorker.on('failed', (job, err) => {
  logger.error('[Workflow:Loyalty] Job failed', {
    jobId: job?.id,
    userId: job?.data?.userId,
    error: err.message,
  });
});

// ── Upsell Recommendations Worker ─────────────────────────────────────────────

export const upsellRecommendationsWorker = new Worker(
  'mkt-upsell-recommendations',
  async (job: Job) => {
    const { userId, orderId, items, orderTotal, merchantId, triggeredAt } = job.data;

    logger.info('[Workflow:Upsell] Processing upsell recommendations', { userId, orderId });

    await callService(`${AUTOMATION_SERVICE_URL}/api/workflows/trigger/upsell-recommendations`, {
      userId,
      orderId,
      items,
      orderTotal,
      merchantId,
      triggeredAt,
      source: 'marketing-service',
    });

    logger.info('[Workflow:Upsell] Upsell recommendations triggered successfully', { userId, orderId });
    return { success: true, userId, orderId };
  },
  {
    connection: getRedisBullMQConnection(),
    concurrency: 5,
    removeOnComplete: { age: 7 * 86400 },
    removeOnFail: { age: 30 * 86400 },
  },
);

upsellRecommendationsWorker.on('error', (err) => {
  logger.error('[Workflow:Upsell] Worker error', { error: err.message });
});

upsellRecommendationsWorker.on('failed', (job, err) => {
  logger.error('[Workflow:Upsell] Job failed', {
    jobId: job?.id,
    userId: job?.data?.userId,
    error: err.message,
  });
});

// ── Abandonment Email Worker ───────────────────────────────────────────────────

export const abandonmentEmailWorker = new Worker(
  'mkt-abandonment-email',
  async (job: Job) => {
    const { userId, cartId, items, totalValue, merchantId, triggeredAt } = job.data;

    logger.info('[Workflow:Abandonment] Processing abandonment email sequence', { userId, cartId });

    await callService(`${AUTOMATION_SERVICE_URL}/api/workflows/trigger/abandonment-email`, {
      userId,
      cartId,
      items,
      totalValue,
      merchantId,
      triggeredAt,
      source: 'marketing-service',
    });

    logger.info('[Workflow:Abandonment] Abandonment email sequence triggered successfully', { userId, cartId });
    return { success: true, userId, cartId };
  },
  {
    connection: getRedisBullMQConnection(),
    concurrency: 5,
    removeOnComplete: { age: 7 * 86400 },
    removeOnFail: { age: 30 * 86400 },
  },
);

abandonmentEmailWorker.on('error', (err) => {
  logger.error('[Workflow:Abandonment] Worker error', { error: err.message });
});

abandonmentEmailWorker.on('failed', (job, err) => {
  logger.error('[Workflow:Abandonment] Job failed', {
    jobId: job?.id,
    userId: job?.data?.userId,
    cartId: job?.data?.cartId,
    error: err.message,
  });
});

// Export all workers for graceful shutdown
export const marketingWorkflowWorkers = [
  welcomeCampaignWorker,
  loyaltyEnrollmentWorker,
  upsellRecommendationsWorker,
  abandonmentEmailWorker,
];

export async function closeAllWorkflowWorkers(): Promise<void> {
  await Promise.all(marketingWorkflowWorkers.map((w) => w.close()));
}
