import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

// Configuration
import { config } from './config';

// Utilities
import logger from './utils/logger';
import { connectDatabase, disconnectDatabase } from './utils/database';
import { connectRedis, disconnectRedis } from './utils/cache';
import { register, metricsHandler, httpRequestDuration, httpRequestTotal } from './utils/metrics';

// Middleware
import {
  internalServiceAuth,
  rateLimiter,
  requestLogger,
  errorHandler
} from './middleware';

// Routes
import dashboardRoutes from './routes';

// Create Express app
const app: Express = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-Publisher-Id', 'X-User-Id']
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request timing middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode.toString() },
      duration
    );
    httpRequestTotal.inc(
      { method: req.method, route, status_code: res.statusCode.toString() }
    );
  });

  next();
});

// Request logging
app.use(requestLogger);

// Rate limiting
app.use(rateLimiter(config.rateLimit.max, config.rateLimit.windowMs));

// Health check endpoint (no auth required)
app.get('/health', async (req: Request, res: Response) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'publisher-dashboard-service',
    version: '1.0.0',
    uptime: process.uptime(),
    checks: {
      database: 'unknown',
      cache: 'unknown'
    }
  };

  try {
    // Check MongoDB
    const mongoose = await import('mongoose');
    healthStatus.checks.database = mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy';
  } catch {
    healthStatus.checks.database = 'unhealthy';
  }

  try {
    // Check Redis
    const { getRedisClient } = await import('./utils/cache');
    const redis = getRedisClient();
    await redis.ping();
    healthStatus.checks.cache = 'healthy';
  } catch {
    healthStatus.checks.cache = 'unhealthy';
  }

  const isHealthy = healthStatus.checks.database === 'healthy' && healthStatus.checks.cache === 'healthy';
  healthStatus.status = isHealthy ? 'ok' : 'degraded';

  res.status(isHealthy ? 200 : 503).json(healthStatus);
});

// Metrics endpoint (no auth required)
app.get('/metrics', metricsHandler);

// API routes (auth required)
app.use('/api', internalServiceAuth, dashboardRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'publisher-dashboard-service',
    version: '1.0.0',
    description: 'AdBazaar Publisher Dashboard - Analytics and reporting for publishers',
    endpoints: {
      health: '/health',
      metrics: '/metrics',
      api: '/api/dashboard/:publisherId'
    }
  });
});

//404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use(errorHandler);

// Server instance
let server: ReturnType<Express['listen']> | null = null;

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new connections
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
    });
  }

  try {
    // Disconnect from databases
    await disconnectDatabase();
    await disconnectRedis();

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error: (error as Error).message });
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    await connectDatabase();

    // Connect to Redis
    logger.info('Connecting to Redis...');
    await connectRedis();

    // Start HTTP server
    server = app.listen(config.app.port, () => {
      logger.info(`Publisher Dashboard Service started on port ${config.app.port}`, {
        env: config.app.env,
        port: config.app.port
      });
    });

    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason, promise });
    });

  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;