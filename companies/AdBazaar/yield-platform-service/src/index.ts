import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { register } from './utils/metrics';
import logger from 'utils/logger.js';
import yieldRoutes from './routes/yieldRoutes';
import { internalServiceAuth, requestLogger, errorHandler } from './middleware/auth';

// Environment variables
const PORT = parseInt(process.env.PORT || '4980', 10);
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/yield-platform';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create Express app
const app: Express = express();

// Global Redis client
let redisClient: Redis | null = null;

// Initialize Redis connection
const initRedis = async (): Promise<Redis> => {
  logger.info('Connecting to Redis', { url: REDIS_URL });

  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      if (times > 3) {
        logger.error('Redis connection failed after 3 retries');
        return null;
      }
      return Math.min(times * 100, 3000);
    },
    lazyConnect: true
  });

  client.on('connect', () => {
    logger.info('Redis connected successfully');
  });

  client.on('error', (err) => {
    logger.error('Redis connection error', { error: err.message });
  });

  try {
    await client.connect();
    return client;
  } catch (error) {
    logger.warn('Redis connection failed, continuing without cache', { error });
    return client;
  }
};

// Initialize MongoDB connection
const initMongoDB = async (): Promise<void> => {
  logger.info('Connecting to MongoDB', { uri: MONGO_URI });

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    logger.info('MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    throw error;
  }
};

// Middleware setup
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-Service-Id', 'X-Applied-By']
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Health check endpoint (no auth required)
app.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'yield-platform-service',
    version: '1.0.0',
    uptime: process.uptime(),
    checks: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: redisClient?.status === 'ready' ? 'connected' : 'disconnected'
    }
  };

  const isHealthy = health.checks.mongodb === 'connected';
  res.status(isHealthy ? 200 : 503).json(health);
});

// Readiness probe
app.get('/ready', (req: Request, res: Response) => {
  const isReady = mongoose.connection.readyState === 1;
  res.status(isReady ? 200 : 503).json({
    ready: isReady,
    timestamp: new Date().toISOString()
  });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Failed to get metrics', { error });
    res.status(500).end();
  }
});

// API routes (with internal service auth)
app.use('/api/yield', internalServiceAuth, yieldRoutes);

// API info endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'Yield Platform Service',
    version: '1.0.0',
    description: 'Central yield optimization service for AdBazaar',
    endpoints: {
      health: 'GET /health',
      metrics: 'GET /metrics',
      summary: 'GET /api/yield/summary',
      inventory: 'GET /api/yield/inventory',
      optimize: 'POST /api/yield/optimize',
      recommendations: 'GET /api/yield/recommendations',
      trends: 'GET /api/yield/trends',
      forecast: 'GET /api/yield/forecast',
      compare: 'GET /api/yield/compare',
      backtest: 'POST /api/yield/backtest',
      dashboard: 'GET /api/yield/dashboard'
    }
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received, shutting down gracefully`);

  // Close Redis connection
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }

  // Close MongoDB connection
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Initialize Redis
    redisClient = await initRedis();

    // Initialize MongoDB
    await initMongoDB();

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Yield Platform Service started`, {
        port: PORT,
        environment: NODE_ENV,
        mongodb: 'connected',
        redis: redisClient?.status === 'ready' ? 'connected' : 'disconnected'
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Start the server
startServer();

export { app, redisClient };