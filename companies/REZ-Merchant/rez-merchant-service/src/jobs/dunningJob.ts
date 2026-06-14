/**
 * Dunning BullMQ Jobs
 *
 * Background job definitions for dunning automation:
 * - evaluateTriggersJob: Runs hourly to check for trigger matches
 * - executeScheduledSteps: Runs every 15 minutes to send pending reminders
 * - sendEscalations: Runs daily to handle escalations
 * - pauseCompletedSequences: Runs daily to cleanup old sequences
 */

import { Queue, Worker, Job, QueueEvents, CronPattern } from 'bullmq';
import { Types } from 'mongoose';
import { getRedisConnection } from '../config/redis';
import { logger } from '../config/logger';
import { DunningService } from '../services/dunningService';
import { DunningSequence } from '../models/DunningSequence';
import { DunningConfig } from '../models/DunningConfig';

// ── Queue Names ────────────────────────────────────────────────────────────────

export const DUNNING_QUEUE = 'dunning';
export const ESCALATION_QUEUE = 'escalation';

// ── Job Types ─────────────────────────────────────────────────────────────────

export interface IEvaluateTriggersJob {
  type: 'evaluateTriggers';
  merchantId?: string;
}

export interface IExecuteScheduledStepsJob {
  type: 'executeScheduledSteps';
  sequenceId?: string;
}

export interface ISendEscalationsJob {
  type: 'sendEscalations';
  level?: number;
}

export interface ICleanupSequencesJob {
  type: 'cleanupSequences';
  daysOld?: number;
}

export type DunningJobData = IEvaluateTriggersJob | IExecuteScheduledStepsJob | ISendEscalationsJob | ICleanupSequencesJob;

// ── Queue Instance ─────────────────────────────────────────────────────────────

let dunningQueue: Queue<DunningJobData> | null = null;
let escalationQueue: Queue<DunningJobData> | null = null;

/**
 * Get or create the dunning queue
 */
export function getDunningQueue(): Queue<DunningJobData> {
  if (!dunningQueue) {
    const connection = getRedisConnection();

    dunningQueue = new Queue<DunningJobData>(DUNNING_QUEUE, {
      connection,
      defaultJobOptions: {
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 1000, // Keep last 1000
        },
        removeOnFail: {
          age: 86400, // Keep failed jobs for 24 hours
          count: 500,
        },
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // Start with 5 second delay
        },
      },
    });

    dunningQueue.on('error', (error) => {
      logger.error('[DunningQueue] Error', { error: error.message });
    });

    logger.info('[DunningQueue] Initialized');
  }

  return dunningQueue;
}

/**
 * Get or create the escalation queue
 */
export function getEscalationQueue(): Queue<DunningJobData> {
  if (!escalationQueue) {
    const connection = getRedisConnection();

    escalationQueue = new Queue<DunningJobData>(ESCALATION_QUEUE, {
      connection,
      defaultJobOptions: {
        removeOnComplete: {
          age: 3600,
          count: 500,
        },
        removeOnFail: {
          age: 86400,
          count: 100,
        },
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 60000, // 1 minute delay for escalations
        },
      },
    });

    escalationQueue.on('error', (error) => {
      logger.error('[EscalationQueue] Error', { error: error.message });
    });

    logger.info('[EscalationQueue] Initialized');
  }

  return escalationQueue;
}

// ── Job Definitions ───────────────────────────────────────────────────────────

/**
 * Add evaluate triggers job to queue
 */
export async function scheduleEvaluateTriggers(merchantId?: string): Promise<Job<DunningJobData>> {
  const queue = getDunningQueue();

  const job = await queue.add('evaluateTriggers', {
    type: 'evaluateTriggers',
    merchantId,
  } as IEvaluateTriggersJob, {
    jobId: `evaluate-${Date.now()}`,
  });

  logger.info('[DunningQueue] Scheduled evaluateTriggers job', { jobId: job.id });
  return job;
}

/**
 * Add execute scheduled steps job to queue
 */
export async function scheduleExecuteScheduledSteps(sequenceId?: string): Promise<Job<DunningJobData>> {
  const queue = getDunningQueue();

  const job = await queue.add('executeScheduledSteps', {
    type: 'executeScheduledSteps',
    sequenceId,
  } as IExecuteScheduledStepsJob, {
    jobId: sequenceId ? `execute-${sequenceId}` : `execute-all-${Date.now()}`,
  });

  logger.info('[DunningQueue] Scheduled executeScheduledSteps job', { jobId: job.id });
  return job;
}

/**
 * Add send escalations job to queue
 */
export async function scheduleEscalations(level?: number): Promise<Job<DunningJobData>> {
  const queue = getEscalationQueue();

  const job = await queue.add('sendEscalations', {
    type: 'sendEscalations',
    level,
  } as ISendEscalationsJob, {
    jobId: `escalate-${level || 'all'}-${Date.now()}`,
  });

  logger.info('[EscalationQueue] Scheduled sendEscalations job', { jobId: job.id, level });
  return job;
}

/**
 * Add cleanup job to queue
 */
export async function scheduleCleanup(daysOld?: number): Promise<Job<DunningJobData>> {
  const queue = getDunningQueue();

  const job = await queue.add('cleanupSequences', {
    type: 'cleanupSequences',
    daysOld: daysOld || 90,
  } as ICleanupSequencesJob, {
    jobId: `cleanup-${Date.now()}`,
  });

  logger.info('[DunningQueue] Scheduled cleanupSequences job', { jobId: job.id });
  return job;
}

// ── Job Processors ────────────────────────────────────────────────────────────

/**
 * Process evaluate triggers job
 */
async function processEvaluateTriggers(job: Job<IEvaluateTriggersJob>): Promise<{
  sequencesEvaluated: number;
  stepsExecuted: number;
  errors: string[];
}> {
  const startTime = Date.now();

  logger.info('[DunningJob] Starting evaluateTriggers', { jobId: job.id });

  try {
    const result = await DunningService.evaluateTriggers();

    const duration = Date.now() - startTime;
    logger.info('[DunningJob] Completed evaluateTriggers', {
      jobId: job.id,
      duration,
      ...result,
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[DunningJob] Failed evaluateTriggers', { jobId: job.id, error: message });
    throw error;
  }
}

/**
 * Process execute scheduled steps job
 */
async function processExecuteScheduledSteps(job: Job<IExecuteScheduledStepsJob>): Promise<{
  stepsExecuted: number;
  errors: string[];
}> {
  const startTime = Date.now();

  logger.info('[DunningJob] Starting executeScheduledSteps', { jobId: job.id, sequenceId: job.data.sequenceId });

  try {
    const result = {
      stepsExecuted: 0,
      errors: [] as string[],
    };

    if (job.data.sequenceId) {
      // Execute for specific sequence
      const sequence = await DunningSequence.findById(job.data.sequenceId);
      if (sequence && sequence.status === 'active') {
        const pendingSteps = sequence.steps.filter(
          (step) => step.status === 'scheduled' && new Date(step.scheduledAt) <= new Date()
        );

        for (const step of pendingSteps) {
          try {
            await DunningService.executeStep(sequence._id as Types.ObjectId, step.stepNumber, step.channel);
            result.stepsExecuted++;
          } catch (error) {
            result.errors.push(
              `Step ${step.stepNumber}/${step.channel}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      }
    } else {
      // Execute all due steps
      const sequences = await DunningSequence.find({
        status: 'active',
      });

      for (const sequence of sequences) {
        const config = await DunningConfig.findById(sequence.configId);
        if (!config || !config.isWithinBusinessHours()) {
          continue;
        }

        const pendingSteps = sequence.steps.filter(
          (step) => step.status === 'scheduled' && new Date(step.scheduledAt) <= new Date()
        );

        for (const step of pendingSteps) {
          try {
            await DunningService.executeStep(sequence._id as Types.ObjectId, step.stepNumber, step.channel);
            result.stepsExecuted++;
          } catch (error) {
            result.errors.push(
              `Sequence ${sequence.sequenceNumber} Step ${step.stepNumber}/${step.channel}: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`
            );
          }
        }
      }
    }

    const duration = Date.now() - startTime;
    logger.info('[DunningJob] Completed executeScheduledSteps', {
      jobId: job.id,
      duration,
      ...result,
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[DunningJob] Failed executeScheduledSteps', { jobId: job.id, error: message });
    throw error;
  }
}

/**
 * Process send escalations job
 */
async function processSendEscalations(job: Job<ISendEscalationsJob>): Promise<{
  escalationsSent: number;
  errors: string[];
}> {
  const startTime = Date.now();

  logger.info('[DunningJob] Starting sendEscalations', { jobId: job.id, level: job.data.level });

  try {
    const result = {
      escalationsSent: 0,
      errors: [] as string[],
    };

    // Find sequences needing escalation
    const query: Record<string, unknown> = {
      status: 'active',
      escalationLevel: { $gt: 0 },
    };

    if (job.data.level !== undefined) {
      query.escalationLevel = job.data.level;
    }

    const sequences = await DunningSequence.find(query);

    for (const sequence of sequences) {
      try {
        // Check if enough time has passed since last escalation
        if (sequence.lastEscalationAt) {
          const hoursSinceEscalation = (Date.now() - new Date(sequence.lastEscalationAt).getTime()) / (1000 * 60 * 60);
          if (hoursSinceEscalation < 24) {
            continue; // Only escalate once per day
          }
        }

        await DunningService.escalate(sequence._id as Types.ObjectId);
        result.escalationsSent++;
      } catch (error) {
        result.errors.push(
          `Sequence ${sequence.sequenceNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    const duration = Date.now() - startTime;
    logger.info('[DunningJob] Completed sendEscalations', {
      jobId: job.id,
      duration,
      ...result,
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[DunningJob] Failed sendEscalations', { jobId: job.id, error: message });
    throw error;
  }
}

/**
 * Process cleanup sequences job
 */
async function processCleanupSequences(job: Job<ICleanupSequencesJob>): Promise<{
  sequencesCleaned: number;
  errors: string[];
}> {
  const startTime = Date.now();
  const daysOld = job.data.daysOld || 90;

  logger.info('[DunningJob] Starting cleanupSequences', { jobId: job.id, daysOld });

  try {
    const cleaned = await DunningService.cleanupOldSequences(daysOld);

    const duration = Date.now() - startTime;
    logger.info('[DunningJob] Completed cleanupSequences', {
      jobId: job.id,
      duration,
      sequencesCleaned: cleaned,
    });

    return {
      sequencesCleaned: cleaned,
      errors: [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[DunningJob] Failed cleanupSequences', { jobId: job.id, error: message });
    throw error;
  }
}

// ── Worker Setup ──────────────────────────────────────────────────────────────

let dunningWorker: Worker<DunningJobData> | null = null;
let escalationWorker: Worker<DunningJobData> | null = null;

/**
 * Start the dunning worker
 */
export async function startDunningWorker(): Promise<void> {
  if (dunningWorker) {
    logger.warn('[DunningWorker] Already running');
    return;
  }

  const connection = getRedisConnection();

  dunningWorker = new Worker<DunningJobData>(
    DUNNING_QUEUE,
    async (job) => {
      switch (job.data.type) {
        case 'evaluateTriggers':
          return processEvaluateTriggers(job as Job<IEvaluateTriggersJob>);
        case 'executeScheduledSteps':
          return processExecuteScheduledSteps(job as Job<IExecuteScheduledStepsJob>);
        case 'cleanupSequences':
          return processCleanupSequences(job as Job<ICleanupSequencesJob>);
        default:
          throw new Error(`Unknown job type: ${(job.data as DunningJobData).type}`);
      }
    },
    {
      connection,
      concurrency: 2,
      limiter: {
        max: 10,
        duration: 1000, // Max 10 jobs per second
      },
    }
  );

  // Event handlers
  dunningWorker.on('completed', (job, result) => {
    logger.info('[DunningWorker] Job completed', {
      jobId: job.id,
      type: job.data.type,
      result,
    });
  });

  dunningWorker.on('failed', (job, error) => {
    logger.error('[DunningWorker] Job failed', {
      jobId: job?.id,
      type: job?.data?.type,
      error: error.message,
    });
  });

  dunningWorker.on('error', (error) => {
    logger.error('[DunningWorker] Worker error', { error: error.message });
  });

  logger.info('[DunningWorker] Started');
}

/**
 * Start the escalation worker
 */
export async function startEscalationWorker(): Promise<void> {
  if (escalationWorker) {
    logger.warn('[EscalationWorker] Already running');
    return;
  }

  const connection = getRedisConnection();

  escalationWorker = new Worker<DunningJobData>(
    ESCALATION_QUEUE,
    async (job) => {
      switch (job.data.type) {
        case 'sendEscalations':
          return processSendEscalations(job as Job<ISendEscalationsJob>);
        default:
          throw new Error(`Unknown job type: ${(job.data as DunningJobData).type}`);
      }
    },
    {
      connection,
      concurrency: 1, // Run one at a time to avoid duplicate escalations
    }
  );

  // Event handlers
  escalationWorker.on('completed', (job, result) => {
    logger.info('[EscalationWorker] Job completed', {
      jobId: job.id,
      type: job.data.type,
      result,
    });
  });

  escalationWorker.on('failed', (job, error) => {
    logger.error('[EscalationWorker] Job failed', {
      jobId: job?.id,
      type: job?.data?.type,
      error: error.message,
    });
  });

  escalationWorker.on('error', (error) => {
    logger.error('[EscalationWorker] Worker error', { error: error.message });
  });

  logger.info('[EscalationWorker] Started');
}

/**
 * Stop all workers
 */
export async function stopWorkers(): Promise<void> {
  const promises: Promise<void>[] = [];

  if (dunningWorker) {
    promises.push(dunningWorker.close());
    dunningWorker = null;
  }

  if (escalationWorker) {
    promises.push(escalationWorker.close());
    escalationWorker = null;
  }

  await Promise.all(promises);
  logger.info('[DunningWorkers] All workers stopped');
}

/**
 * Close all queues
 */
export async function closeQueues(): Promise<void> {
  const promises: Promise<void>[] = [];

  if (dunningQueue) {
    promises.push(dunningQueue.close());
    dunningQueue = null;
  }

  if (escalationQueue) {
    promises.push(escalationQueue.close());
    escalationQueue = null;
  }

  await Promise.all(promises);
  logger.info('[DunningQueues] All queues closed');
}

// ── Recurring Job Scheduling ──────────────────────────────────────────────────

/**
 * Schedule recurring jobs using cron patterns
 */
export async function scheduleRecurringJobs(): Promise<void> {
  const queue = getDunningQueue();
  const escalationQueueInstance = getEscalationQueue();

  // Evaluate triggers - every hour
  await queue.add(
    'recurring-evaluateTriggers',
    { type: 'evaluateTriggers' } as IEvaluateTriggersJob,
    {
      repeat: {
        pattern: '0 * * * *', // Every hour at minute 0
      },
      jobId: 'recurring-evaluateTriggers',
    }
  );

  // Execute scheduled steps - every 15 minutes
  await queue.add(
    'recurring-executeScheduledSteps',
    { type: 'executeScheduledSteps' } as IExecuteScheduledStepsJob,
    {
      repeat: {
        pattern: '*/15 * * * *', // Every 15 minutes
      },
      jobId: 'recurring-executeScheduledSteps',
    }
  );

  // Cleanup - once per day at midnight
  await queue.add(
    'recurring-cleanup',
    { type: 'cleanupSequences', daysOld: 90 } as ICleanupSequencesJob,
    {
      repeat: {
        pattern: '0 0 * * *', // Every day at midnight
      },
      jobId: 'recurring-cleanup',
    }
  );

  // Escalations - once per day at 9 AM
  await escalationQueueInstance.add(
    'recurring-escalations',
    { type: 'sendEscalations' } as ISendEscalationsJob,
    {
      repeat: {
        pattern: '0 9 * * *', // Every day at 9 AM
      },
      jobId: 'recurring-escalations',
    }
  );

  logger.info('[DunningScheduler] Recurring jobs scheduled');
}

/**
 * Remove all recurring jobs
 */
export async function removeRecurringJobs(): Promise<void> {
  const queue = getDunningQueue();
  const escalationQueueInstance = getEscalationQueue();

  const recurringJobIds = [
    'recurring-evaluateTriggers',
    'recurring-executeScheduledSteps',
    'recurring-cleanup',
  ];

  const escalationJobIds = ['recurring-escalations'];

  for (const jobId of recurringJobIds) {
    const job = await queue.getJob(jobId);
    if (job) {
      await job.remove();
    }
  }

  for (const jobId of escalationJobIds) {
    const job = await escalationQueueInstance.getJob(jobId);
    if (job) {
      await job.remove();
    }
  }

  logger.info('[DunningScheduler] Recurring jobs removed');
}

// ── Health Check ─────────────────────────────────────────────────────────────

/**
 * Get queue health status
 */
export async function getQueueHealth(): Promise<{
  dunning: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
  escalation: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
}> {
  const [dunningCounts, escalationCounts] = await Promise.all([
    getDunningQueue().getJobCounts(),
    getEscalationQueue().getJobCounts(),
  ]);

  return {
    dunning: {
      waiting: dunningCounts.waiting || 0,
      active: dunningCounts.active || 0,
      completed: dunningCounts.completed || 0,
      failed: dunningCounts.failed || 0,
    },
    escalation: {
      waiting: escalationCounts.waiting || 0,
      active: escalationCounts.active || 0,
      completed: escalationCounts.completed || 0,
      failed: escalationCounts.failed || 0,
    },
  };
}

// ── Initialize ──────────────────────────────────────────────────────────────

/**
 * Initialize dunning jobs system
 */
export async function initializeDunningJobs(): Promise<void> {
  logger.info('[DunningJobs] Initializing...');

  try {
    // Start workers
    await startDunningWorker();
    await startEscalationWorker();

    // Schedule recurring jobs
    await scheduleRecurringJobs();

    logger.info('[DunningJobs] Initialization complete');
  } catch (error) {
    logger.error('[DunningJobs] Initialization failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Shutdown dunning jobs system gracefully
 */
export async function shutdownDunningJobs(): Promise<void> {
  logger.info('[DunningJobs] Shutting down...');

  try {
    await stopWorkers();
    await closeQueues();
    logger.info('[DunningJobs] Shutdown complete');
  } catch (error) {
    logger.error('[DunningJobs] Shutdown failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export default {
  getDunningQueue,
  getEscalationQueue,
  scheduleEvaluateTriggers,
  scheduleExecuteScheduledSteps,
  scheduleEscalations,
  scheduleCleanup,
  startDunningWorker,
  startEscalationWorker,
  stopWorkers,
  closeQueues,
  scheduleRecurringJobs,
  removeRecurringJobs,
  getQueueHealth,
  initializeDunningJobs,
  shutdownDunningJobs,
};
