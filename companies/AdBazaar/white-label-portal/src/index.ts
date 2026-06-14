import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { logger } from 'utils/logger.js';
import { getMetrics, getMetricsContentType, metricsMiddleware } from './utils/metrics';
import { serviceAuth } from './middleware/auth';
import { portalRoutes } from './routes';

// Environment variables
const PORT = process.env.PORT || 5012;
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/white-label-portal';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Service-Token', 'X-Agency-Id', 'X-Service-Id'],
  credentials: true,
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Metrics middleware
app.use(metricsMiddleware);

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'white-label-portal',
    version: '1.0.0',
    uptime: process.uptime(),
    environment: NODE_ENV,
    checks: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: redisClient.isReady ? 'connected' : 'disconnected',
    },
  };

  const isHealthy = health.checks.mongodb === 'connected';

  res.status(isHealthy ? 200 : 503).json(health);
});

// Metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', getMetricsContentType());
    res.send(metrics);
  } catch (error) {
    logger.error('Error getting metrics', { error });
    res.status(500).send('Error getting metrics');
  }
});

// API routes
app.use('/api/portals', serviceAuth, portalRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'white-label-portal',
    version: '1.0.0',
    description: 'AdBazaar White Label Portal - Customizable agency branding',
    documentation: '/api/docs',
    health: '/health',
    metrics: '/metrics',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
});

// Redis client
let redisClient: ReturnType<typeof createClient>;

async function connectRedis(): Promise<void> {
  try {
    redisClient = createClient({
      url: REDIS_URL,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis error', { error: err.message });
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected', { url: REDIS_URL });
    });

    await redisClient.connect();
  } catch (error) {
    logger.warn('Redis connection failed, continuing without cache', { error });
 // Create a mock redis client for when Redis is unavailable
    redisClient = {
      isReady: false,
      isOpen: false,
      connect: async () => {},
      get: async () => null,
      set: async () => 'OK',
      del: async () => 1,
      quit: async () => {},
    } as unknown as ReturnType<typeof createClient>;
  }
}

async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB connected', { uri: MONGODB_URI });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
  } catch (error) {
    logger.error('MongoDB connection failed', { error });
    throw error;
  }
}

async function startServer(): Promise<void> {
  try {
    // Connect to databases
    await connectRedis();
    await connectMongoDB();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`White Label Portal started`, {
        port: PORT,
        environment: NODE_ENV,
        nodeVersion: process.version,
        pid: process.pid,
      });
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Metrics: http://localhost:${PORT}/metrics`);
      logger.info(`API: http://localhost:${PORT}/api/portals`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await mongoose.connection.close();
          logger.info('MongoDB connection closed');

          if (redisClient.isReady) {
            await redisClient.quit();
            logger.info('Redis connection closed');
          }

          logger.info('Graceful shutdown complete');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', { error });
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason, promise });
    });

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the server
startServer();

export { app };
