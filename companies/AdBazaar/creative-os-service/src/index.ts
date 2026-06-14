import express, { Application, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import winston from 'winston';
import promClient from 'prom-client';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { creativeRoutes } from './routes/creativeRoutes';
import { authMiddleware } from './middleware/auth';
import { logger } from 'utils/logger.js';
import { metrics, httpRequestDuration } from './utils/metrics';

// Initialize Winston logger
const log = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      serviceId?: string;
    }
  }
}

const app: Application = express();
const PORT = process.env.PORT || 5020;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/creative-os';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Redis client
let redisClient: ReturnType<typeof createClient>;

async function connectRedis(): Promise<void> {
  try {
    redisClient = createClient({ url: REDIS_URL });
    redisClient.on('error', (err) => log.error('Redis Client Error', err));
    await redisClient.connect();
    log.info('Connected to Redis');
  } catch (error) {
    log.error('Failed to connect to Redis', error);
  }
}

async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    log.info('Connected to MongoDB');
  } catch (error) {
    log.error('Failed to connect to MongoDB', error);
    throw error;
  }
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Prometheus metrics middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDuration.labels(req.method, req.route?.path || 'unknown', res.statusCode.toString()).observe(duration / 1000);
  });
  next();
});

// Health check endpoint (no auth required)
app.get('/health', async (req: Request, res: Response) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'creative-os-service',
    version: '1.0.0',
    port: PORT,
    checks: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: redisClient?.isOpen ? 'connected' : 'disconnected'
    }
  };

  const isHealthy = healthStatus.checks.mongodb === 'connected';
  res.status(isHealthy ? 200 : 503).json(healthStatus);
});

// Prometheus metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

// Auth middleware for API routes
app.use('/api', authMiddleware);

// API Routes
app.use('/api/creatives', creativeRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  log.error('Unhandled error:', err);
  metrics.httpErrorsTotal.inc({ endpoint: req.path, method: req.method });
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Endpoint not found',
      code: 'NOT_FOUND'
    }
  });
});

// Start server
async function startServer(): Promise<void> {
  try {
    await connectMongoDB();
    await connectRedis();

    app.listen(PORT, () => {
      log.info(`Creative OS Service running on port ${PORT}`);
      log.info(`Health check: http://localhost:${PORT}/health`);
      log.info(`Metrics: http://localhost:${PORT}/metrics`);
    });
  } catch (error) {
    log.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  log.info('SIGTERM received, shutting down gracefully');
  await mongoose.connection.close();
  await redisClient?.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  log.info('SIGINT received, shutting down gracefully');
  await mongoose.connection.close();
  await redisClient?.quit();
  process.exit(0);
});

startServer();

export { app, redisClient };