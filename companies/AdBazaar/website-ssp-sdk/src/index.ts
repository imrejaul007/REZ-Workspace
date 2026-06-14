import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import { connectRedis } from './config/redis.js';
import routes from './routes/index.js';
import { metricsMiddleware } from './middleware/metrics.middleware.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { logger } from './utils/logger.js';

async function startServer(): Promise<void> {
  try {
    // Connect to databases
    await connectDatabase();
    await connectRedis();

    // Create Express app
    const app = express();

    // Security middleware
    app.use(helmet());

    // CORS
    app.use(cors({
      origin: '*', // In production, restrict to specific origins
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    }));

    // Compression
    app.use(compression());

    // Body parsing
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Metrics middleware
    app.use(metricsMiddleware);

    // Request logging
    app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.debug(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
      });
      next();
    });

    // Mount routes
    app.use(routes);

    // Error handling
    app.use(notFoundHandler);
    app.use(errorHandler);

    // Start server
    

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'website-ssp-sdk',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
app.listen(config.port, () => {
      logger.info(`Website SSP SDK service running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Metrics: ${config.metrics.enabled ? 'enabled' : 'disabled'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

startServer();

export { startServer };
