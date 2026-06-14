import { QueueService } from './services/queue.service';
import { RetryService } from './services/retry.service';
import { RetryStrategy, RETRY_PRESETS } from './models/retry-job.model';

// ─── Structured Logger ─────────────────────────────────────────────────────────
const SERVICE_NAME = 'REZ-retry-service';

function log(level: 'INFO' | 'WARN' | 'ERROR', message: string, meta?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    service: SERVICE_NAME,
    level,
    message,
    ...meta,
  };
  console.log(JSON.stringify(logEntry));
}

const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log('INFO', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('WARN', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('ERROR', message, meta),
};

// Redis connection configuration - SECURITY: Validate required env vars
const redisConnection = (() => {
  const host = process.env.REDIS_HOST || process.env.REDIS_URL?.replace('redis://', '').split(':')[0];
  const port = parseInt(process.env.REDIS_PORT || process.env.REDIS_URL?.split(':')[2] || '6379', 10);
  const password = process.env.REDIS_PASSWORD;

  // Validate required configuration
  if (!host) {
    const error = '[RETRY-SERVICE] CRITICAL: REDIS_HOST or REDIS_URL environment variable is required';
    logger.error(error);
    throw new Error(error);
  }

  if (process.env.NODE_ENV === 'production' && !password) {
    const error = '[RETRY-SERVICE] CRITICAL: REDIS_PASSWORD is required in production';
    logger.error(error);
    throw new Error(error);
  }

  // Warn about localhost in production
  if (process.env.NODE_ENV === 'production' && (host === 'localhost' || host === '127.0.0.1')) {
    logger.warn('[RETRY-SERVICE] WARNING: Using localhost Redis in production is not recommended');
  }

  return { host, port, password: password || undefined };
})();

// Initialize services
const queueService = new QueueService(redisConnection);
const retryService = new RetryService(queueService);

// Define job processors
const jobProcessors: Record<string, (data: Record<string, unknown>) => Promise<unknown>> = {
  'example-job': async (data) => {
    logger.info('Processing example job', { data });
    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { processed: true, data };
  },

  'email-job': async (data) => {
    logger.info('Sending email', { data });
    // Email sending logic here
    return { sent: true, recipient: data.email };
  },

  'payment-job': async (data) => {
    logger.info('Processing payment', { data });
    // Payment processing logic here
    return { processed: true, transactionId: data.transactionId };
  },
};

// Create workers for each queue
async function startWorkers() {
  const queues = ['default', 'http-retries', 'error-retries', 'rate-limited'];

  for (const queueName of queues) {
    const worker = queueService.createWorker(queueName, async (job) => {
      const processor = jobProcessors[job.name] || jobProcessors['example-job'];

      logger.info('Processing job', { jobId: job.id, queueName, jobData: job.data });

      try {
        const result = await processor(job.data);
        logger.info('Job completed successfully', { jobId: job.id, queueName });
        return result;
      } catch (error) {
        const err = error as Error;
        logger.error('Job failed', { jobId: job.id, queueName, error: err.message });

        // Let BullMQ handle retries automatically based on job options
        throw error;
      }
    }, {
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 1000,
      },
    });

    // Set up event listeners
    queueService.setupEventListeners(queueName, {
      onJobComplete: (job) => {
        logger.info('Job completed', { jobId: job.id, queueName });
      },
      onJobFailed: (job, error) => {
        logger.error('Job failed permanently', { jobId: job.id, queueName, error: error.message });
      },
      onJobRetrying: (job) => {
        logger.warn('Job retrying', { jobId: job.id, queueName, attempt: job.attemptsMade });
      },
    });

    logger.info('Worker started', { queueName });
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down workers');
  await queueService.closeAll();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down workers');
  await queueService.closeAll();
  process.exit(0);
});

// Start the workers
logger.info('Starting REZ Retry Worker');
startWorkers().catch((error) => {
  logger.error('Failed to start workers', { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});

logger.info('Worker is running and waiting for jobs');
