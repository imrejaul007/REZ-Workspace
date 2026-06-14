import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import config from './config/index.js';
import logger from './config/logger.js';
import { connectDatabase, isConnected } from './config/database.js';
import { createIndexes } from './models/index.js';
import routes from './routes/index.js';
import { internalServiceAuth } from './middleware/auth.js';
import { metricsMiddleware, metricsHandler } from './middleware/metrics.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { HealthCheckResponse } from './types/index.js';

const appLogger = logger.child({ component: 'App' });

// Create Express app
const app: Express = express();

// Trust proxy (for load balancers)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable for API
}));

// CORS
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-API-Key']
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => appLogger.info(message.trim())
  }
}));

// Metrics middleware
app.use(metricsMiddleware);

// Health check endpoint (no auth required)
app.get('/health', (_req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  const memoryUsageMB = {
    rss: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100,
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
    external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100
  };

  const response: HealthCheckResponse = {
    status: isConnected() ? 'ok' : 'degraded',
    service: config.serviceName,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    checks: {
      database: isConnected() ? 'ok' : 'error',
      memory: memoryUsageMB.heapUsed < 500 ? 'ok' : 'error'
    }
  };

  const statusCode = response.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(response);
});

// Metrics endpoint
if (config.metrics.enabled) {
  app.get(config.metrics.path, metricsHandler);
}

// API routes with internal service auth
app.use('/api', internalServiceAuth, routes);

// API documentation endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    service: 'event-graph-service',
    version: '1.0.0',
    description: 'Event Intelligence Network - Track events and predict impact on nearby merchants',
    endpoints: {
      health: 'GET /health',
      metrics: 'GET /metrics',
      events: {
        create: 'POST /api/events',
        list: 'GET /api/events',
        nearby: 'GET /api/events/nearby',
        graph: 'GET /api/events/graph/:type',
        stats: 'GET /api/events/stats',
        get: 'GET /api/events/:id',
        update: 'PATCH /api/events/:id',
        delete: 'DELETE /api/events/:id',
        impact: 'GET /api/events/:id/impact',
        suggestions: 'GET /api/events/:id/suggestions'
      },
      impact: {
        analyze: 'GET /api/impact/:id/impact',
        suggestions: 'GET /api/impact/:id/suggestions',
        compare: 'GET /api/impact/compare',
        predict: 'POST /api/impact/predict'
      }
    },
    eventTypes: ['wedding', 'festival', 'conference', 'sports', 'religious', 'community', 'corporate', 'entertainment', 'political', 'other']
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Create indexes
    await createIndexes();

    // Start listening
    const server = app.listen(config.port, () => {
      appLogger.info(`Event Graph Service started`, {
        port: config.port,
        env: config.nodeEnv,
        pid: process.pid
      });

      appLogger.info('Available endpoints:', {
        health: `http://localhost:${config.port}/health`,
        metrics: `http://localhost:${config.port}${config.metrics.path}`,
        api: `http://localhost:${config.port}/api`
      });
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      appLogger.info(`Received ${signal}, shutting down gracefully...`);

      server.close(() => {
        appLogger.info('HTTP server closed');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        appLogger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      appLogger.error('Uncaught exception', { error });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      appLogger.error('Unhandled rejection', { reason, promise });
    });

  } catch (error) {
    appLogger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Export for testing
export { app };

// Start server if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}