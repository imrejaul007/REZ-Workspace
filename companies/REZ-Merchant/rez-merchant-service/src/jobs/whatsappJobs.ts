/**
 * WhatsApp BullMQ Jobs
 *
 * Queue-based message processing for reliable WhatsApp delivery:
 * - Queue: 'whatsapp-messages'
 * - Job types: sendReminderJob, sendOverdueAlert, sendStatementJob, retryFailedMessage
 *
 * Features:
 * - Retry failed sends 3 times with exponential backoff
 * - Rate limiting compliance
 * - Business hours scheduling
 * - Dead letter queue for permanently failed messages
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '../config/logger';
import { redis } from '../config/redis';
import {
  WhatsAppService,
  WhatsAppMessageStatus,
  getWhatsAppService,
} from '../services/whatsappService';
import {
  WhatsAppTemplate,
  formatAmount,
  formatDate,
} from '../services/whatsappTemplates';

// Redis connection for BullMQ (separate connection from app Redis)
const getBullMQConnection = () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

// Queue name
export const WHATSAPP_QUEUE_NAME = 'whatsapp-messages';

/**
 * Job types enum
 */
export enum WhatsAppJobTypes {
  SEND_MESSAGE = 'send_message',
  SEND_QUEUED = 'send_queued',
  SEND_REMINDER = 'send_reminder',
  SEND_OVERDUE_ALERT = 'send_overdue_alert',
  SEND_STATEMENT = 'send_statement',
  RETRY_FAILED = 'retry_failed',
  STATUS_UPDATE = 'status_update',
  SEND_BULK = 'send_bulk',
}

/**
 * Job payload interfaces
 */
export interface SendMessageJobData {
  to: string;
  template?: WhatsAppTemplate;
  params?: string[];
  message?: string;
  merchantId: string;
  referenceId?: string;
  priority?: number;
}

export interface SendQueuedJobData {
  to: string;
  template?: WhatsAppTemplate;
  params?: string[];
  message?: string;
  merchantId: string;
  referenceId?: string;
  queuedAt: number;
}

export interface SendReminderJobData {
  poId: string;
  supplierId: string;
  supplierPhone: string;
  supplierName: string;
  poNumber: string;
  amount: number;
  dueDate: Date;
  reminderType: 'gentle' | 'strong' | 'urgent' | 'today';
  merchantName: string;
  merchantId?: string;
}

export interface SendOverdueAlertJobData {
  poId: string;
  supplierId: string;
  supplierPhone: string;
  supplierName: string;
  poNumber: string;
  amount: number;
  daysOverdue: number;
  alertType: 'first' | 'escalation' | 'final' | 'legal';
  merchantName: string;
  merchantId?: string;
}

export interface SendStatementJobData {
  supplierId: string;
  supplierPhone: string;
  supplierName: string;
  totalOutstanding: number;
  dueAmount: number;
  paymentLink?: string;
  merchantName: string;
  merchantId?: string;
}

export interface RetryFailedJobData {
  originalJobId: string;
  originalData: SendMessageJobData;
  attemptCount: number;
  lastError: string;
}

export interface StatusUpdateJobData {
  messageId: string;
  merchantId: string;
  status: string;
  timestamp: number;
}

export interface SendBulkJobData {
  messages: Array<{
    to: string;
    template?: WhatsAppTemplate;
    params?: string[];
    message?: string;
  }>;
  merchantId: string;
}

/**
 * Job result interface
 */
export interface WhatsAppJobResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retryable?: boolean;
}

// Singleton queue instance
let whatsappQueue: Queue | null = null;
let whatsappWorker: Worker | null = null;
let queueEvents: QueueEvents | null = null;

/**
 * Get WhatsApp queue instance
 */
export function getWhatsAppQueue(): Queue {
  if (!whatsappQueue) {
    whatsappQueue = new Queue(WHATSAPP_QUEUE_NAME, {
      connection: getBullMQConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // Start with 5 seconds
        },
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 1000, // Keep last 1000
        },
        removeOnFail: {
          age: 86400, // Keep failed jobs for 24 hours
        },
      },
    });

    logger.info('[WhatsAppQueue] Queue initialized', { name: WHATSAPP_QUEUE_NAME });
  }

  return whatsappQueue;
}

/**
 * Initialize WhatsApp worker
 */
export async function initializeWhatsAppWorker(): Promise<void> {
  if (whatsappWorker) {
    return;
  }

  const whatsappService = getWhatsAppService();

  whatsappWorker = new Worker(
    WHATSAPP_QUEUE_NAME,
    async (job: Job) => {
      logger.info(`[WhatsAppQueue] Processing job ${job.id}`, {
        type: job.name,
        attempts: job.attemptsMade,
      });

      try {
        let result: WhatsAppJobResult;

        switch (job.name as WhatsAppJobTypes) {
          case WhatsAppJobTypes.SEND_MESSAGE:
            result = await processSendMessage(job, whatsappService);
            break;

          case WhatsAppJobTypes.SEND_QUEUED:
            result = await processSendQueued(job, whatsappService);
            break;

          case WhatsAppJobTypes.SEND_REMINDER:
            result = await processSendReminder(job, whatsappService);
            break;

          case WhatsAppJobTypes.SEND_OVERDUE_ALERT:
            result = await processSendOverdueAlert(job, whatsappService);
            break;

          case WhatsAppJobTypes.SEND_STATEMENT:
            result = await processSendStatement(job, whatsappService);
            break;

          case WhatsAppJobTypes.RETRY_FAILED:
            result = await processRetryFailed(job, whatsappService);
            break;

          case WhatsAppJobTypes.STATUS_UPDATE:
            result = await processStatusUpdate(job);
            break;

          case WhatsAppJobTypes.SEND_BULK:
            result = await processSendBulk(job, whatsappService);
            break;

          default:
            throw new Error(`Unknown job type: ${job.name}`);
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`[WhatsAppQueue] Job ${job.id} failed`, {
          error: errorMessage,
          attempts: job.attemptsMade,
        });

        // Check if error is retryable
        const isRetryable = !errorMessage.includes('Invalid phone number') &&
          !errorMessage.includes('Rate limit hit');

        if (!isRetryable && job.attemptsMade < job.opts.attempts!) {
          // Don't count this as a retry for non-retryable errors
          throw new Error(`Non-retryable: ${errorMessage}`);
        }

        throw error;
      }
    },
    {
      connection: getBullMQConnection(),
      concurrency: 10,
      limiter: {
        max: 100,
        duration: 60000, // 100 messages per minute
      },
    }
  );

  // Event handlers
  whatsappWorker.on('completed', (job: Job) => {
    logger.info(`[WhatsAppQueue] Job ${job.id} completed`, {
      type: job.name,
      duration: job.finishedOn! - job.timestamp,
    });
  });

  whatsappWorker.on('failed', (job: Job | undefined, error: Error) => {
    if (job) {
      logger.error(`[WhatsAppQueue] Job ${job.id} failed`, {
        error: error.message,
        attempts: job.attemptsMade,
        maxAttempts: job.opts.attempts,
      });

      // Add to dead letter queue if max attempts reached
      if (job.attemptsMade >= (job.opts.attempts || 3)) {
        addToDeadLetterQueue(job);
      }
    }
  });

  whatsappWorker.on('error', (error: Error) => {
    logger.error('[WhatsAppQueue] Worker error', { error: error.message });
  });

  // Initialize queue events for monitoring
  queueEvents = new QueueEvents(WHATSAPP_QUEUE_NAME, {
    connection: getBullMQConnection(),
  });

  queueEvents.on('waiting', ({ jobId }) => {
    logger.debug(`[WhatsAppQueue] Job ${jobId} waiting`);
  });

  queueEvents.on('active', ({ jobId }) => {
    logger.debug(`[WhatsAppQueue] Job ${jobId} active`);
  });

  logger.info('[WhatsAppQueue] Worker initialized');
}

/**
 * Process send message job
 */
async function processSendMessage(
  job: Job,
  whatsappService: WhatsAppService
): Promise<WhatsAppJobResult> {
  const data = job.data as SendMessageJobData;

  let result;

  if (data.template) {
    result = await whatsappService.sendMessage(data.to, data.template, data.params || []);
  } else if (data.message) {
    result = await whatsappService.sendTextMessage(data.to, data.message, {
      merchantId: data.merchantId,
      referenceId: data.referenceId,
    });
  } else {
    return { success: false, error: 'No template or message provided', retryable: false };
  }

  if (result.success) {
    // Log for tracking
    await whatsappService.logMessage(
      result.messageId!,
      data.merchantId,
      data.to,
      data.template,
      WhatsAppMessageStatus.QUEUED
    );

    return { success: true, messageId: result.messageId };
  }

  return {
    success: false,
    error: result.error,
    retryable: !result.error?.includes('Invalid phone number'),
  };
}

/**
 * Process queued message (sent during non-business hours)
 */
async function processSendQueued(
  job: Job,
  whatsappService: WhatsAppService
): Promise<WhatsAppJobResult> {
  const data = job.data as SendQueuedJobData;

  // Check if still within reasonable time window (7 days)
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - data.queuedAt > sevenDaysMs) {
    return { success: false, error: 'Message expired', retryable: false };
  }

  // Check if within business hours
  if (!whatsappService.isWithinBusinessHours()) {
    // Reschedule for next business hour
    const nextBusinessHour = getNextBusinessHour();
    await job.updateData({
      ...data,
      rescheduledAt: Date.now(),
    });

    await job.moveToDelayed(nextBusinessHour.getTime() - Date.now());

    return { success: true, error: 'Rescheduled for business hours' };
  }

  return processSendMessage(job as Job, whatsappService);
}

/**
 * Process payment reminder job
 */
async function processSendReminder(
  job: Job,
  whatsappService: WhatsAppService
): Promise<WhatsAppJobResult> {
  const data = job.data as SendReminderJobData;

  const reminderMessages: Record<string, string> = {
    gentle: `Reminder: Payment of ${formatAmount(data.amount)} for PO ${data.poNumber} is due on ${formatDate(data.dueDate)}. - ${data.merchantName}`,
    strong: `Important: Payment of ${formatAmount(data.amount)} for PO ${data.poNumber} is due soon. Please arrange funds. - ${data.merchantName}`,
    urgent: `URGENT: Payment of ${formatAmount(data.amount)} for PO ${data.poNumber} is due TOMORROW! Please confirm. - ${data.merchantName}`,
    today: `TODAY: Payment of ${formatAmount(data.amount)} for PO ${data.poNumber} is due today. Please process immediately. - ${data.merchantName}`,
  };

  const message = reminderMessages[data.reminderType] || reminderMessages.gentle;

  const result = await whatsappService.sendTextMessage(data.supplierPhone, message, {
    merchantId: data.merchantId || 'system',
    referenceId: data.poId,
  });

  if (result.success) {
    // Store scheduled message reference
    await redis.hset(`whatsapp:scheduled:${job.id}`, {
      poId: data.poId,
      supplierId: data.supplierId,
      type: 'reminder',
      reminderType: data.reminderType,
      sentAt: String(Date.now()),
      messageId: result.messageId,
    });

    return { success: true, messageId: result.messageId };
  }

  return { success: false, error: result.error, retryable: true };
}

/**
 * Process overdue alert job
 */
async function processSendOverdueAlert(
  job: Job,
  whatsappService: WhatsAppService
): Promise<WhatsAppJobResult> {
  const data = job.data as SendOverdueAlertJobData;

  const alertMessages: Record<string, string> = {
    first: `Alert: PO ${data.poNumber} payment of ${formatAmount(data.amount)} is ${data.daysOverdue} day(s) overdue. Please arrange payment. - ${data.merchantName}`,
    escalation: `Escalation: PO ${data.poNumber} payment of ${formatAmount(data.amount)} is ${data.daysOverdue} days overdue. Please contact us. - ${data.merchantName}`,
    final: `FINAL NOTICE: PO ${data.poNumber} payment of ${formatAmount(data.amount)} is ${data.daysOverdue} days overdue. Legal action may be initiated. - ${data.merchantName}`,
    legal: `Legal Notice: Outstanding payment of ${formatAmount(data.amount)} for PO ${data.poNumber} is ${data.daysOverdue} days overdue. Contact us immediately. - ${data.merchantName}`,
  };

  const message = alertMessages[data.alertType] || alertMessages.first;

  // Overdue alerts can be sent anytime
  const result = await whatsappService.sendTextMessage(data.supplierPhone, message, {
    merchantId: data.merchantId || 'system',
    referenceId: data.poId,
  });

  if (result.success) {
    await redis.hset(`whatsapp:scheduled:${job.id}`, {
      poId: data.poId,
      supplierId: data.supplierId,
      type: 'overdue_alert',
      alertType: data.alertType,
      daysOverdue: String(data.daysOverdue),
      sentAt: String(Date.now()),
      messageId: result.messageId,
    });

    return { success: true, messageId: result.messageId };
  }

  return { success: false, error: result.error, retryable: true };
}

/**
 * Process statement job
 */
async function processSendStatement(
  job: Job,
  whatsappService: WhatsAppService
): Promise<WhatsAppJobResult> {
  const data = job.data as SendStatementJobData;

  const message = `Your account statement:\nTotal Outstanding: ${formatAmount(data.totalOutstanding)}\nDue: ${formatAmount(data.dueAmount)}${data.paymentLink ? `\nPay now: ${data.paymentLink}` : ''}\n- ${data.merchantName}`;

  const result = await whatsappService.sendTextMessage(data.supplierPhone, message, {
    merchantId: data.merchantId || 'system',
  });

  if (result.success) {
    return { success: true, messageId: result.messageId };
  }

  return { success: false, error: result.error, retryable: true };
}

/**
 * Process retry failed job
 */
async function processRetryFailed(
  job: Job,
  whatsappService: WhatsAppService
): Promise<WhatsAppJobResult> {
  const data = job.data as RetryFailedJobData;

  // Only retry up to 3 times
  if (data.attemptCount >= 3) {
    return { success: false, error: 'Max retry attempts reached', retryable: false };
  }

  // Exponential backoff
  const delay = Math.pow(2, data.attemptCount) * 60000; // 1min, 2min, 4min

  await job.updateData({
    ...data,
    attemptCount: data.attemptCount + 1,
  });

  await job.moveToDelayed(delay);

  return { success: true, error: 'Rescheduled for retry' };
}

/**
 * Process status update
 */
async function processStatusUpdate(job: Job): Promise<WhatsAppJobResult> {
  const data = job.data as StatusUpdateJobData;

  // Store status update
  await redis.hset(`whatsapp:status:${data.messageId}`, {
    status: data.status,
    timestamp: String(data.timestamp),
    updatedAt: String(Date.now()),
  });

  // Publish event for real-time notifications
  await redis.publish('whatsapp:status_update', JSON.stringify(data));

  return { success: true };
}

/**
 * Process bulk send
 */
async function processSendBulk(
  job: Job,
  whatsappService: WhatsAppService
): Promise<WhatsAppJobResult> {
  const data = job.data as SendBulkJobData;
  const results: Array<{ to: string; success: boolean; messageId?: string; error?: string }> = [];

  for (const message of data.messages) {
    let result;

    if (message.template) {
      result = await whatsappService.sendMessage(message.to, message.template, message.params || []);
    } else if (message.message) {
      result = await whatsappService.sendTextMessage(message.to, message.message, {
        merchantId: data.merchantId,
      });
    } else {
      results.push({ to: message.to, success: false, error: 'No content' });
      continue;
    }

    results.push({
      to: message.to,
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    });

    // Rate limiting delay
    await new Promise((resolve) => setTimeout(resolve, 600)); // 100 msg/min = 600ms delay
  }

  const successCount = results.filter((r) => r.success).length;

  return {
    success: true,
    messageId: job.id,
    error: `${successCount}/${data.messages.length} messages sent`,
  };
}

/**
 * Get next business hour timestamp
 */
function getNextBusinessHour(): Date {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);

  // If it's Sunday, move to Monday 9 AM
  if (ist.getUTCDay() === 0) {
    ist.setUTCDate(ist.getUTCDate() + 1);
    ist.setUTCHours(3, 30, 0, 0); // 9 AM IST = 3:30 AM UTC
    return new Date(ist.getTime() - istOffset);
  }

  // If before 9 AM today, return 9 AM today
  if (ist.getUTCHours() < 3 || (ist.getUTCHours() === 3 && ist.getUTCMinutes() < 30)) {
    ist.setUTCHours(3, 30, 0, 0);
    return new Date(ist.getTime() - istOffset);
  }

  // If after 8 PM today, move to tomorrow 9 AM
  if (ist.getUTCHours() >= 20) {
    ist.setUTCDate(ist.getUTCDate() + 1);
    ist.setUTCHours(3, 30, 0, 0);
    return new Date(ist.getTime() - istOffset);
  }

  // Return now if already in business hours
  return now;
}

/**
 * Add job to dead letter queue
 */
async function addToDeadLetterQueue(job: Job): Promise<void> {
  const dlqKey = `whatsapp:dlq:${job.id}`;

  await redis.hset(dlqKey, {
    jobId: job.id,
    name: job.name,
    data: JSON.stringify(job.data),
    attemptsMade: String(job.attemptsMade),
    failedReason: job.failedReason || '',
    finishedOn: String(job.finishedOn),
    timestamp: String(Date.now()),
  });

  await redis.expire(dlqKey, 2592000); // 30 days TTL

  logger.warn('[WhatsAppQueue] Job moved to DLQ', {
    jobId: job.id,
    name: job.name,
    attempts: job.attemptsMade,
  });
}

/**
 * Add message to queue
 */
export async function queueMessage(
  data: SendMessageJobData,
  options?: { priority?: number; delay?: number }
): Promise<Job> {
  const queue = getWhatsAppQueue();

  const jobOptions: unknown = {};
  if (options?.priority) {
    jobOptions.priority = options.priority;
  }
  if (options?.delay) {
    jobOptions.delay = options.delay;
  }

  const job = await queue.add(WhatsAppJobTypes.SEND_MESSAGE, data, jobOptions);

  logger.info('[WhatsAppQueue] Message queued', { jobId: job.id, data });

  return job;
}

/**
 * Schedule reminder
 */
export async function scheduleReminder(data: SendReminderJobData, runAt: Date): Promise<Job> {
  const queue = getWhatsAppQueue();

  const delay = Math.max(0, runAt.getTime() - Date.now());

  const job = await queue.add(WhatsAppJobTypes.SEND_REMINDER, data, {
    delay,
    jobId: `reminder:${data.poId}:${data.reminderType}`,
  });

  logger.info('[WhatsAppQueue] Reminder scheduled', {
    jobId: job.id,
    poId: data.poId,
    type: data.reminderType,
    runAt: runAt.toISOString(),
  });

  return job;
}

/**
 * Schedule overdue alert
 */
export async function scheduleOverdueAlert(data: SendOverdueAlertJobData, runAt: Date): Promise<Job> {
  const queue = getWhatsAppQueue();

  const delay = Math.max(0, runAt.getTime() - Date.now());

  const job = await queue.add(WhatsAppJobTypes.SEND_OVERDUE_ALERT, data, {
    delay,
    jobId: `overdue:${data.poId}:${data.alertType}`,
  });

  logger.info('[WhatsAppQueue] Overdue alert scheduled', {
    jobId: job.id,
    poId: data.poId,
    type: data.alertType,
    runAt: runAt.toISOString(),
  });

  return job;
}

/**
 * Cancel scheduled messages for a PO
 */
export async function cancelScheduledMessages(poId: string): Promise<number> {
  const queue = getWhatsAppQueue();

  // Get all pending/completed jobs for this PO
  const jobs = await queue.getJobs(['waiting', 'delayed', 'active']);

  let cancelledCount = 0;

  for (const job of jobs) {
    const jobData = job.data as unknown;
    if (jobData?.poId === poId) {
      await job.remove();
      cancelledCount++;

      logger.info('[WhatsAppQueue] Cancelled scheduled message', {
        jobId: job.id,
        poId,
      });
    }
  }

  // Also remove from Redis
  const keys = await redis.keys(`whatsapp:scheduled:*:${poId}:*`);
  for (const key of keys) {
    await redis.del(key);
  }

  return cancelledCount;
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const queue = getWhatsAppQueue();

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

/**
 * Gracefully shutdown worker and queue
 */
export async function shutdownWhatsAppQueue(): Promise<void> {
  logger.info('[WhatsAppQueue] Shutting down...');

  if (queueEvents) {
    await queueEvents.close();
    queueEvents = null;
  }

  if (whatsappWorker) {
    await whatsappWorker.close();
    whatsappWorker = null;
  }

  if (whatsappQueue) {
    await whatsappQueue.close();
    whatsappQueue = null;
  }

  logger.info('[WhatsAppQueue] Shutdown complete');
}

export default {
  getWhatsAppQueue,
  initializeWhatsAppWorker,
  queueMessage,
  scheduleReminder,
  scheduleOverdueAlert,
  cancelScheduledMessages,
  getQueueStats,
  shutdownWhatsAppQueue,
  WhatsAppJobTypes,
};
