import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { collectDefaultMetrics, register } from 'prom-client';
import routes from './routes';
import { logger } from 'utils/logger.js';
import { httpRequestsTotal, httpRequestDuration } from './utils/metrics';

const app = express();
const PORT = process.env.PORT || 5055;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request metrics middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestsTotal.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode.toString()
    });
    httpRequestDuration.observe(
      {
        method: req.method,
        route: req.route?.path || req.path
      },
      duration
    );
  });

  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'sequence-automation',
    timestamp: new Date().toISOString()
  });
});

// Prometheus metrics
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
});

// API routes
app.use('/api', routes);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sequence-automation';

async function connectMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error', { error });
    process.exit(1);
  }
}

// Redis connection
let redisClient: ReturnType<typeof createClient> | null = null;

async function connectRedis() {
  try {
    const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = createClient({ url: REDIS_URL });

    redisClient.on('error', (err) => {
      logger.error('Redis error', { error: err.message });
    });

    await redisClient.connect();
    logger.info('Connected to Redis');
  } catch (error) {
    logger.warn('Redis connection failed, continuing without Redis', { error });
    redisClient = null;
  }
}

// Start server
async function startServer() {
  try {
    collectDefaultMetrics({ prefix: 'sequence_automation_' });

    await connectMongoDB();
    await connectRedis();

    app.listen(PORT, () => {
      logger.info(`Sequence Automation running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  if (redisClient) {
    await redisClient.quit();
  }
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  if (redisClient) {
    await redisClient.quit();
  }
  await mongoose.disconnect();
  process.exit(0);
});

startServer();

export { app, redisClient };