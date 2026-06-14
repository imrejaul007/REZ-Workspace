import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import redis from 'redis';
import helmet from 'helmet';
import cors from 'cors';
import { subscriptionRoutes, planRoutes, invoiceRoutes, analyticsRoutes } from './routes/index.js';
import { internalAuth, requestLogger, securityHeaders } from './middleware/auth.js';
import { register } from './utils/metrics.js';
import logger from 'utils/logger.js';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://adbazaar.app',
    'https://adbazaar.com'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(securityHeaders);

// Prometheus metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check MongoDB connection
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    // Check Redis connection
    let redisStatus = 'disconnected';
    try {
      if (redisClient.isOpen) {
        await redisClient.ping();
        redisStatus = 'connected';
      }
    } catch (e) {
      redisStatus = 'error';
    }

    const health = {
      status: mongoStatus === 'connected' && redisStatus === 'connected' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'subscription-management',
      version: '1.0.0',
      uptime: process.uptime(),
      dependencies: {
        mongodb: mongoStatus,
        redis: redisStatus
      },
      environment: process.env.NODE_ENV || 'development'
    };

    res.status(health.status === 'healthy' ? 200 : 503).json(health);
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// Readiness check
app.get('/ready', (req: Request, res: Response) => {
  const isReady = mongoose.connection.readyState === 1;
  if (isReady) {
    res.json({ ready: true });
  } else {
    res.status(503).json({ ready: false });
  }
});

// API Routes
// Public routes (with optional auth)
app.use('/api/subscriptions', optionalInternalAuth, subscriptionRoutes);
app.use('/api/plans', optionalInternalAuth, planRoutes);
app.use('/api/invoices', optionalInternalAuth, invoiceRoutes);
app.use('/api/analytics', internalAuth, analyticsRoutes);

// Internal service routes (require auth)
app.use('/internal/subscriptions', internalAuth, subscriptionRoutes);
app.use('/internal/plans', internalAuth, planRoutes);
app.use('/internal/invoices', internalAuth, invoiceRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// Redis client
let redisClient: redis.RedisClient;

async function connectRedis() {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD || undefined
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error', { error: err });
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    await redisClient.connect();
  } catch (error) {
    logger.warn('Redis connection failed, continuing without cache', { error });
  }
}

async function connectMongoDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/adbazaar_subscriptions';

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('MongoDB connected successfully', { uri: mongoUri.replace(/\/\/.*@/, '//<credentials>@') });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB error', { error: err });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
  } catch (error) {
    logger.error('MongoDB connection failed', { error });
    throw error;
  }
}

// Graceful shutdown
function setupGracefulShutdown() {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully`);

    // Close Redis
    if (redisClient?.isOpen) {
      await redisClient.quit();
    }

    // Close MongoDB
    await mongoose.connection.close();

    logger.info('Shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Start server
async function startServer() {
  try {
    // Connect to databases
    await connectMongoDB();
    await connectRedis();

    // Initialize default plans
    const { planService } = await import('./services/index.js');
    await planService.initializeDefaultPlans();

    // Start server
    app.listen(PORT, () => {
      logger.info(`Subscription Management Service started on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Metrics: http://localhost:${PORT}/metrics`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    setupGracefulShutdown();
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();

export default app;