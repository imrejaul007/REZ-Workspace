import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/environment.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { internalServiceAuth } from './middleware/auth.js';
import { festivalRoutes } from './routes/index.js';
import { getMetrics, getContentType, metricsMiddleware } from './utils/metrics.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Metrics middleware
app.use(metricsMiddleware);

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.debug('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
  });
  next();
});

// Health check (no auth required)
app.get('/health', async (_req: Request, res: Response) => {
  const health = {
    status: 'ok',
    service: 'festival-graph-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  };

  try {
    // Check MongoDB connection
    const mongoose = await import('mongoose');
    health.status = mongoose.connection.readyState === 1 ? 'ok' : 'degraded';
  } catch {
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Metrics endpoint (no auth required)
app.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', getContentType());
    res.send(metrics);
  } catch (error) {
    logger.error('Failed to get metrics', { error });
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// API routes (with internal service auth)
app.use('/api/festivals', internalServiceAuth, festivalRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: config.nodeEnv === 'development' ? err.message : 'Internal server error',
    },
  });
});

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  try {
    await disconnectDatabase();
    logger.info('Database disconnected');

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
async function start(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    // Start HTTP server
    app.listen(config.port, () => {
      logger.info(`Festival Graph Service started`, {
        port: config.port,
        environment: config.nodeEnv,
        metricsEnabled: config.metrics.enabled,
        metricsPath: config.metrics.path,
      });

      logger.info('Available endpoints:', {
        health: `http://localhost:${config.port}/health`,
        metrics: `http://localhost:${config.port}/metrics`,
        festivals: `http://localhost:${config.port}/api/festivals`,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

start();

export default app;