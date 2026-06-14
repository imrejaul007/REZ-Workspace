import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createClient } from 'redis';

import logger from 'utils/logger.js';
import { register, httpRequestsTotal, httpRequestDuration } from './utils/metrics';
import { webhookRoutes } from './routes';
import { webhookService } from './services';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5040;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestsTotal.labels(req.method, req.path, res.statusCode.toString()).inc();
    httpRequestDuration.labels(req.method, req.path, res.statusCode.toString()).observe(duration);
  });
  next();
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'webhook-service',
    timestamp: new Date().toISOString(),
  });
});

app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
});

app.use('/api/webhooks', webhookRoutes);

app.post('/api/trigger', async (req: Request, res: Response) => {
  try {
    const { event, payload } = req.body;
    if (!event || !payload) {
      res.status(400).json({ error: 'event and payload are required' });
      return;
    }
    await webhookService.triggerWebhooks(event, payload);
    res.json({ message: 'Webhooks triggered', event });
  } catch (error) {
    logger.error('Error triggering webhooks', { error });
    res.status(500).json({ error: 'Failed to trigger webhooks' });
  }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

async function startServer(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/adbazaar_webhooks';
    await mongoose.connect(mongoUri);
    logger.info('MongoDB connected');

    await webhookService.initialize();

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      const redisClient = createClient({ url: redisUrl });
      await redisClient.connect();
      logger.info('Redis connected');
    } catch (redisError) {
      logger.warn('Redis not available, continuing without Redis');
    }

    app.listen(PORT, () => {
      logger.info(`Webhook service running on port ${PORT}`);
    });

    setInterval(() => {
      webhookService.retryFailedWebhooks().catch((err) => {
        logger.error('Error retrying failed webhooks', { error: err });
      });
    }, 60000);

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await webhookService.cleanup();
  await mongoose.disconnect();
  process.exit(0);
});

startServer();

export default app;