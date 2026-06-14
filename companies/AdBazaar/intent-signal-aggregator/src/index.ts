import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { config, validateConfig } from './config';
import { connectDatabase, disconnectDatabase, getConnectionStatus } from './config/database';
import { getRedisClient, disconnectRedis } from './config/redis';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import signalRoutes from './routes/signalRoutes';
import { register, metrics } from './services/metrics';

// Validate configuration
validateConfig();

const app: Express = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Service-Key'],
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next) => {
  const start = Date.now();
  _res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path}`, {
      status: _res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });

    // Record HTTP metrics
    metrics.httpRequestsTotal.inc({
      method: req.method,
      route: req.path,
      status_code: _res.statusCode,
    });
  });
  next();
});

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  const dbStatus = getConnectionStatus();
  const redis = getRedisClient();
  const redisStatus = redis.status === 'ready' ? 'connected' : 'disconnected';

  const isHealthy = dbStatus === 'connected' && redisStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: dbStatus,
      redis: redisStatus,
    },
    uptime: process.uptime(),
  });
});

// Readiness check
app.get('/ready', async (_req: Request, res: Response) => {
  const dbStatus = getConnectionStatus();

  if (dbStatus === 'connected') {
    res.json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready', reason: 'Database not connected' });
  }
});

// Liveness check
app.get('/live', (_req: Request, res: Response) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

// Prometheus metrics endpoint
app.get('/metrics', async (_req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Failed to get metrics', { error });
    res.status(500).end();
  }
});

// API routes
app.use('/api/signals', signalRoutes);

// API info
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'Intent Signal Aggregator',
    version: '1.0.0',
    description: 'Collects, normalizes, and enriches intent signals from REZ ecosystem',
    endpoints: {
      ingest: 'POST /api/signals/ingest',
      batch: 'POST /api/signals/batch',
      stats: 'GET /api/signals/stats',
      userSignals: 'GET /api/signals/user/:userId',
      signalById: 'GET /api/signals/:signalId',
      signalsBySource: 'GET /api/signals/source/:source',
    },
    sources: [
      'buzzlocal',
      'airzy',
      'rez-menu-qr',
      'rez-now',
      'risacare',
      'corpperks',
    ],
  });
});

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
  });

  try {
    // Close database connection
    await disconnectDatabase();
    await disconnectRedis();
    logger.info('All connections closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
}

// Start server
let server: ReturnType<Express['listen']>;

async function start(): Promise<void> {
  try {
    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    await connectDatabase();

    // Initialize Redis
    logger.info('Connecting to Redis...');
    getRedisClient();

    // Start HTTP server
    server = app.listen(config.port, () => {
      logger.info(`Intent Signal Aggregator started`, {
        port: config.port,
        env: config.nodeEnv,
        nodeVersion: process.version,
      });
      logger.info(`Health check: http://localhost:${config.port}/health`);
      logger.info(`Metrics: http://localhost:${config.port}/metrics`);
    });

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection', { reason });
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

start();

export { app };