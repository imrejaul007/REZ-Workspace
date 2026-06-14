import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import config from './config';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware';
import { metricsMiddleware, getMetrics } from './middleware/metrics';
import { connectMongoDB, disconnectMongoDB, connectRedis, disconnectRedis } from './config/database';
import logger from 'utils/logger.js';

const app: Express = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
});
app.use('/api', limiter);

// Metrics middleware
if (config.metrics.enabled) {
  app.use(metricsMiddleware);
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'sponsored-products-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Readiness check endpoint
app.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check MongoDB connection
    const mongoose = await import('mongoose');
    const mongoReady = mongoose.connection.readyState === 1;

    res.json({
      status: mongoReady ? 'ready' : 'degraded',
      service: 'sponsored-products-service',
      mongodb: mongoReady ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unavailable',
      service: 'sponsored-products-service',
      error: 'Service not ready',
    });
  }
});

// Prometheus metrics endpoint
app.get('/metrics', getMetrics);

// API routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Graceful shutdown handler
async function shutdown(signal: string) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  try {
    // Disconnect from databases
    await disconnectMongoDB();
    await disconnectRedis();

    logger.info('All connections closed. Exiting.');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
async function startServer() {
  try {
    logger.info('Starting Sponsored Products Service...');

    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    await connectMongoDB();

    // Connect to Redis
    logger.info('Connecting to Redis...');
    await connectRedis();

    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
      logger.info(`Metrics: http://localhost:${config.port}/metrics`);
    });

    // Handle server errors
    server.on('error', (error: Error) => {
      logger.error('Server error:', { error: error instanceof Error ? error.message : String(error) });
      process.exit(1);
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;