/**
 * DLQ Admin API — rez-order-service
 *
 * D12: Mirrors the monolith's admin/dlqAdmin endpoints for this microservice's
 * primary queue (order-events). Jobs that exhaust their attempts land in
 * BullMQ's `failed` set — until this router existed there was no way to view
 * or replay them without Redis shell access.
 *
 *   GET    /admin/dlq                           — queue summary (failed/waiting counts)
 *   GET    /admin/dlq/jobs                      — list failed jobs (paginated)
 *   POST   /admin/dlq/jobs/:jobId/retry         — retry a single failed job
 *   POST   /admin/dlq/retry-all                 — retry all currently-failed jobs
 *   DELETE /admin/dlq/jobs/:jobId               — permanently remove a failed job
 *
 * All endpoints require x-internal-token (requireInternalToken middleware).
 */

import { Router, Request, Response } from 'express';
import { Queue, Job } from 'bullmq';
import { bullmqRedis } from '../config/redis';
import { requireInternalToken } from '../middleware/internalAuth';
import { logger } from '../config/logger';
import { QUEUE_NAME } from '../worker';

const router = Router();

// All DLQ routes require internal-service auth.
router.use(requireInternalToken);

function openQueue(): Queue {
  return new Queue(QUEUE_NAME, { connection: bullmqRedis });
}

router.get('/', async (_req: Request, res: Response) => {
  const q = openQueue();
  try {
    const [failed, waiting, active, completed] = await Promise.all([
      q.getFailedCount(),
      q.getWaitingCount(),
      q.getActiveCount(),
      q.getCompletedCount(),
    ]);
    return res.json({
      success: true,
      data: { queue: QUEUE_NAME, failed, waiting, active, completed },
    });
  } finally {
    await q.close();
  }
});

router.get('/jobs', async (req: Request, res: Response) => {
  const start = Math.max(0, parseInt(String(req.query.start ?? '0'), 10) || 0);
  const end = Math.max(start, parseInt(String(req.query.end ?? '49'), 10) || 49);
  const q = openQueue();
  try {
    const jobs = await q.getFailed(start, end);
    return res.json({
      success: true,
      data: {
        queue: QUEUE_NAME,
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

router.post('/jobs/:jobId/retry', async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const q = openQueue();
  try {
    const job = await Job.fromId(q, jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: `Job ${jobId} not found in ${QUEUE_NAME}` });
    }
    await job.retry();
    logger.info('[DLQ Admin] Job retried', { queue: QUEUE_NAME, jobId });
    return res.json({ success: true, message: `Job ${jobId} requeued`, data: { queue: QUEUE_NAME } });
  } finally {
    await q.close();
  }
});

router.post('/retry-all', async (_req: Request, res: Response) => {
  const q = openQueue();
  try {
    const failed = await q.getFailed(0, 499);
    let retried = 0;
    let skipped = 0;
    await Promise.all(
      failed.map(async (job) => {
        try {
          await job.retry();
          retried++;
        } catch {
          skipped++;
        }
      }),
    );
    logger.info('[DLQ Admin] Bulk retry', { queue: QUEUE_NAME, retried, skipped });
    return res.json({ success: true, data: { queue: QUEUE_NAME, retried, skipped } });
  } finally {
    await q.close();
  }
});

router.delete('/jobs/:jobId', async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const q = openQueue();
  try {
    const job = await Job.fromId(q, jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: `Job ${jobId} not found in ${QUEUE_NAME}` });
    }
    await job.remove();
    logger.info('[DLQ Admin] Job discarded', { queue: QUEUE_NAME, jobId });
    return res.json({ success: true, message: `Job ${jobId} removed from ${QUEUE_NAME}` });
  } finally {
    await q.close();
  }
});

export default router;
