import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

// Utils
import { logger } from './utils/logger';
import { register, httpRequestsTotal, httpRequestDuration } from './utils/metrics';

// Middleware
import { serviceAuth, auditLog } from './middleware';

// Routes
import { mmmRoutes } from './routes';

// Config
const PORT = process.env.PORT || 4974;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/media-mix-modeling';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Express app
const app = express();

// Trust proxy (for accurate IP logging behind load balancer)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Audit logging
app.use(auditLog);

// Prometheus metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
});

// Health check
app.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'media-mix-modeling',
    version: '1.0.0',
    port: PORT,
    uptime: process.uptime(),
    checks: {
      mongodb: 'unknown',
      redis: 'unknown'
    }
  };

  // Check MongoDB
  try {
    if (mongoose.connection.readyState === 1) {
      health.checks.mongodb = 'connected';
    } else {
      health.checks.mongodb = 'disconnected';
    }
  } catch {
    health.checks.mongodb = 'error';
  }

  // Check Redis
  try {
    const redisClient = await getRedisClient();
    if (redisClient.isOpen) {
      health.checks.redis = 'connected';
    } else {
      health.checks.redis = 'disconnected';
    }
  } catch {
    health.checks.redis = 'error';
  }

  const isHealthy = health.checks.mongodb === 'connected';
  res.status(isHealthy ? 200 : 503).json(health);
});

// Readiness check
app.get('/ready', (req: Request, res: Response) => {
  if (mongoose.connection.readyState === 1) {
    res.json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready' });
  }
});

// Request metrics middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path;

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status: res.statusCode.toString()
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status: res.statusCode.toString()
      },
      duration
    );
  });

  next();
});

// API routes with authentication
app.use('/api', serviceAuth, mmmRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'Media Mix Modeling Service',
    version: '1.0.0',
    description: 'Nielsen/Meta MMA competitor for advertising attribution and optimization',
    endpoints: {
      health: '/health',
      metrics: '/metrics',
      api: '/api'
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
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({ url: REDIS_URL });

    redisClient.on('error', (err) => {
      logger.error('Redis client error', { error: err.message });
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    await redisClient.connect();
  }
  return redisClient;
}

// Connect to MongoDB
async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    logger.info('Connected to MongoDB', { uri: MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@') });

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
}

// Connect to Redis
async function connectRedis(): Promise<void> {
  try {
    await getRedisClient();
    logger.info('Connected to Redis', { url: REDIS_URL });
  } catch (error) {
    logger.error('Failed to connect to Redis', { error });
    // Continue without Redis - it's optional
  }
}

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully`);

  // Close Redis
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }

  // Close MongoDB
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');

  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
async function start(): Promise<void> {
  try {
    // Connect to databases
    await connectMongoDB();
    await connectRedis();

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`Media Mix Modeling Service started`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version
      });

      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Metrics: http://localhost:${PORT}/metrics`);
      logger.info(`API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the application
start().catch((error) => {
  logger.error('Application startup failed', { error });
  process.exit(1);
});

export default app;