import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Local imports
import { logger } from 'utils/logger.js';
import { metrics, httpRequestDuration } from './utils/metrics.js';
import { internalAuth } from './middleware/auth.js';
import { federatedRouter } from './routes/federated.js';
import { mpcRouter } from './routes/mpc.js';
import { differentialPrivacyRouter } from './routes/differentialPrivacy.js';
import { secureAggregationRouter } from './routes/secureAggregation.js';
import { validateRouter } from './routes/validate.js';
import { AuditLog } from './models/AuditLog.js';
import { Computation } from './models/Computation.js';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 4951;

// Redis client
let redisClient: ReturnType<typeof createClient> | null = null;

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/privacy-preserving-compute';

// Redis connection
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });

    // Record metrics
    httpRequestDuration.labels(req.method, req.path, res.statusCode.toString()).observe(duration / 1000);
    metrics.httpRequestsTotal.labels(req.method, req.path, res.statusCode.toString()).inc();
  });

  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'privacy-preserving-compute',
    version: '1.0.0',
    port: PORT,
    uptime: process.uptime(),
    checks: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: redisClient?.isReady ? 'connected' : 'disconnected'
    }
  };

  const isHealthy = healthStatus.checks.mongodb === 'connected';
  res.status(isHealthy ? 200 : 503).json(healthStatus);
});

// Metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  res.set('Content-Type', metrics.register.contentType);
  res.end(await metrics.register.metrics());
});

// API routes with internal auth
app.use('/api/compute/federated', internalAuth, federatedRouter);
app.use('/api/compute/mpc', internalAuth, mpcRouter);
app.use('/api/compute/differential-privacy', internalAuth, differentialPrivacyRouter);
app.use('/api/compute/secure-aggregation', internalAuth, secureAggregationRouter);
app.use('/api/compute/validate', internalAuth, validateRouter);

// Public result endpoints
app.get('/api/compute/results/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const computation = await Computation.findById(id);
    if (!computation) {
      return res.status(404).json({ error: 'Computation not found' });
    }

    res.json({
      id: computation._id,
      type: computation.type,
      status: computation.status,
      result: computation.result,
      privacyParams: computation.privacyParams,
      createdAt: computation.createdAt,
      completedAt: computation.completedAt
    });
  } catch (error) {
    logger.error('Error fetching computation results', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/compute/audit/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const auditLogs = await AuditLog.find({ computationId: id })
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({
      computationId: id,
      logs: auditLogs,
      count: auditLogs.length
    });
  } catch (error) {
    logger.error('Error fetching audit trail', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Connect to MongoDB
async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB', { uri: MONGODB_URI });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    throw error;
  }
}

// Connect to Redis
async function connectRedis(): Promise<void> {
  try {
    redisClient = createClient({ url: REDIS_URL });

    redisClient.on('error', (err) => {
      logger.error('Redis error', { error: err.message });
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis', { url: REDIS_URL });
    });

    await redisClient.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis', { error });
    // Redis is optional, continue without it
    redisClient = null;
  }
}

// Graceful shutdown
async function shutdown(): Promise<void> {
  logger.info('Shutting down gracefully...');

  try {
    if (redisClient) {
      await redisClient.quit();
    }
    await mongoose.connection.close();
    logger.info('All connections closed');
 process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function startServer(): Promise<void> {
  try {
    await connectMongoDB();
    await connectRedis();

    app.listen(PORT, () => {
      logger.info(`Privacy-Preserving Compute Service started`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
      });

      metrics.serviceInfo.labels('privacy-preserving-compute', '1.0.0').set(1);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();

export { app, redisClient };
