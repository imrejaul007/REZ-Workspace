/**
 * DLQ Admin API — rez-payment-service
 *
 * D12: Parity with the monolith's admin/dlqAdmin endpoints. Operates on
 * this service's primary queues (wallet-credit, monolith-sync) so an
 * operator can inspect and replay failed financial jobs without Redis
 * shell access.
 *
 *   GET    /admin/dlq                         — summary of known queues
 *   GET    /admin/dlq/:queue/jobs             — list failed jobs (paginated)
 *   POST   /admin/dlq/:queue/jobs/:jobId/retry
 *   POST   /admin/dlq/:queue/retry-all
 *   DELETE /admin/dlq/:queue/jobs/:jobId
 *
 * All endpoints require x-internal-token.
 */

import { Router, Request, Response } from 'express';
import { Queue, Job } from 'bullmq';
import { redisHost, redisPort } from '../config/redis';
import { requireInternalToken } from '../middleware/internalAuth';
import { createServiceLogger } from '../config/logger';

const logger = createServiceLogger('dlq-admin');
const router = Router();

router.use(requireInternalToken);

// Queues this service owns. Hard-coded so a caller can't point the admin
// API at an arbitrary Redis key.
const KNOWN_QUEUES = ['wallet-credit', 'monolith-sync'] as const;
type KnownQueue = (typeof KNOWN_QUEUES)[number];

function isKnownQueue(name: string): name is KnownQueue {
  return (KNOWN_QUEUES as readonly string[]).includes(name);
}

function openQueue(name: KnownQueue): Queue {
  // PAY-009 FIX: Use redisHost/redisPort exported directly from config/redis.ts
  // instead of (redis as any).options, which bypasses IORedis public type definitions.
  return new Queue(name, {
    connection: { host: redisHost, port: redisPort },
  });
}

router.get('/', async (_req: Request, res: Response) => {
  const results = await Promise.all(
    KNOWN_QUEUES.map(async (name) => {
      const q = openQueue(name);
      try {
        const [failed, waiting, active, completed] = await Promise.all([
          q.getFailedCount(),
          q.getWaitingCount(),
          q.getActiveCount(),
          q.getCompletedCount(),
        ]);
        return { queue: name, failed, waiting, active, completed };
      } catch {
        return { queue: name, failed: -1, waiting: -1, active: -1, completed: -1 };
      } finally {
        await q.close();
      }
    }),
  );
  return res.json({ success: true, data: results });
});

router.get('/:queue/jobs', async (req: Request, res: Response) => {
  const queueName = req.params.queue;
  if (!isKnownQueue(queueName)) {
    return res.status(404).json({ success: false, message: `Unknown queue: ${queueName}` });
  }
  const start = Math.max(0, parseInt(String(req.query.start ?? '0'), 10) || 0);
  const end = Math.max(start, parseInt(String(req.query.end ?? '49'), 10) || 49);
  const q = openQueue(queueName);
  try {
    const jobs = await q.getFailed(start, end);
    return res.json({
      success: true,
      data: {
        queue: queueName,
        failed: jobs.map((j) => ({
          id: j.id,
          name: j.name,
          data: j.data,
          attemptsMade: j.attemptsMade,
          failedReason: j.failedReason,
          timestamp: j.timestamp,
          processedOn: j.processedOn,
          finishedOn: j.finishedOn,
        })),
      },
    });
  } finally {
    await q.close();
  }
});

router.post('/:queue/jobs/:jobId/retry', async (req: Request, res: Response) => {
  const queueName = req.params.queue;
  if (!isKnownQueue(queueName)) {
    return res.status(404).json({ success: false, message: `Unknown queue: ${queueName}` });
  }
  const { jobId } = req.params;
  const q = openQueue(queueName);
  try {
    const job = await Job.fromId(q, jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: `Job ${jobId} not found in ${queueName}` });
    }
    await job.retry();
    logger.info('[DLQ Admin] Job retried', { queue: queueName, jobId });
    return res.json({ success: true, message: `Job ${jobId} requeued`, data: { queue: queueName } });
  } finally {
    await q.close();
  }
});

router.post('/:queue/retry-all', async (req: Request, res: Response) => {
  const queueName = req.params.queue;
  if (!isKnownQueue(queueName)) {
    return res.status(404).json({ success: false, message: `Unknown queue: ${queueName}` });
  }
  const q = openQueue(queueName);
  try {
    const failed = await q.getFailed(0, 499);
    let retried = 0;
    let skipped = 0;

    // M10 FIX: Retry with bounded concurrency to avoid overwhelming downstream services.
    // Previously used Promise.all() which fired all retries simultaneously — risk of
    // DB pool exhaustion and downstream overload when hundreds of jobs fail at once.
    const CONCURRENCY = 10;
    for (let i = 0; i < failed.length; i += CONCURRENCY) {
      const batch = failed.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async (job) => {
          try {
            await job.retry();
            retried++;
          } catch {
            skipped++;
          }
        }),
      );
    }

    logger.info('[DLQ Admin] Bulk retry', { queue: queueName, retried, skipped });
    return res.json({ success: true, data: { queue: queueName, retried, skipped } });
  } finally {
    await q.close();
  }
});

router.delete('/:queue/jobs/:jobId', async (req: Request, res: Response) => {
  const queueName = req.params.queue;
  if (!isKnownQueue(queueName)) {
    return res.status(404).json({ success: false, message: `Unknown queue: ${queueName}` });
  }
  const { jobId } = req.params;
  const q = openQueue(queueName);
  try {
    const job = await Job.fromId(q, jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: `Job ${jobId} not found in ${queueName}` });
    }
    await job.remove();
    logger.info('[DLQ Admin] Job discarded', { queue: queueName, jobId });
    return res.json({ success: true, message: `Job ${jobId} removed from ${queueName}` });
  } finally {
    await q.close();
  }
});

export default router;
