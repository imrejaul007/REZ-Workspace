import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';

import config from './config/index.js';
import logger from './config/logger.js';
import routes from './routes/index.js';
import {
  metricsMiddleware,
  metricsHandler,
  healthCheckHandler,
  internalAuthMiddleware,
  rateLimitMiddleware,
  notFoundHandler,
  errorHandler,
} from './middleware/index.js';

// Create Express app
const app: Express = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-Merchant-Id'],
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Metrics middleware
app.use(metricsMiddleware);

// Health check (before auth)
app.get('/health', healthCheckHandler);

// Metrics endpoint
if (config.metrics.enabled) {
  app.get(config.metrics.path, metricsHandler);
}

// API routes
app.use('/api', internalAuthMiddleware, rateLimitMiddleware(100, 60000), routes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Database connection
async function connectToDatabase(): Promise<void> {
  try {
    const mongoUri = config.mongodb.uri;
    logger.info('Connecting to MongoDB...', { uri: mongoUri.replace(/\/\/.*@/, '//***@') });

    await mongoose.connect(mongoUri, {
      maxPoolSize: config.mongodb.options.maxPoolSize,
      serverSelectionTimeoutMS: config.mongodb.options.serverSelectionTimeoutMS,
      socketTimeoutMS: config.mongodb.options.socketTimeoutMS,
    });

    logger.info('Connected to MongoDB successfully');
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    throw error;
  }
}

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    // Close database connection
    await mongoose.connection.close();
    logger.info('Database connection closed');

    // Log final metrics
    const memUsage = process.memoryUsage();
    logger.info('Final memory usage', {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    });

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
}

// Handle shutdown signals
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

// Start server
async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectToDatabase();

    // Start listening
    app.listen(config.port, () => {
      logger.info(`Merchant Insights OS started`, {
        port: config.port,
        nodeEnv: config.nodeEnv,
        version: process.env.npm_package_version || '1.0.0',
      });

      logger.info('Available endpoints:', {
        health: `http://localhost:${config.port}/health`,
        metrics: `http://localhost:${config.port}${config.metrics.path}`,
        api: `http://localhost:${config.port}/api`,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;