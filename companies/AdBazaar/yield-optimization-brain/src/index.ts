import express, { Express } from 'express';
import mongoose from 'mongoose';
import { config } from './config/index.js';
import logger from './config/logger.js';
import { yieldRoutes, strategyRoutes } from './routes/index.js';
import { corsMiddleware, internalAuth, errorHandler, notFoundHandler } from './middleware/auth.js';
import { metricsMiddleware, metricsHandler } from './middleware/metrics.js';

const app: Express = express();

// Trust proxy (for correct IP detection behind load balancers)
app.set('trust proxy', 1);

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(corsMiddleware);

// Metrics middleware
app.use(metricsMiddleware);

// Health check (no auth required)
app.get('/health', (req, res) => {
  const uptime = process.uptime();
  const memUsage = process.memoryUsage();

  res.json({
    status: 'ok',
    service: 'yield-optimization-brain',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime),
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024),
    },
  });
});

// Metrics endpoint (Prometheus format)
app.get('/metrics', metricsHandler);

// API routes (with internal auth)
app.use('/api', internalAuth, yieldRoutes);
app.use('/api', internalAuth, strategyRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Connect to MongoDB
async function connectToMongoDB(): Promise<void> {
  try {
    logger.info('Connecting to MongoDB...', { uri: config.mongodb.uri });

    await mongoose.connect(config.mongodb.uri, config.mongodb.options);

    logger.info('Connected to MongoDB successfully');
  } catch (error) {
    logger.error('Failed to connect to MongoDB', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  try {
    // Close MongoDB connection
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');

    // Exit process
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
  process.exit(1);
});

// Start server
async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB
    await connectToMongoDB();

    // Start HTTP server
    const server = app.listen(config.service.port, () => {
      logger.info(`Yield Optimization Brain started`, {
        port: config.service.port,
        env: config.service.env,
        nodeVersion: process.version,
      });

      logger.info('Available endpoints:', {
        health: `GET http://localhost:${config.service.port}/health`,
        metrics: `GET http://localhost:${config.service.port}/metrics`,
        yieldDecide: `POST http://localhost:${config.service.port}/api/yield/decide`,
        floorPrice: `GET http://localhost:${config.service.port}/api/yield/floor/:inventoryId`,
        bidLandscape: `GET http://localhost:${config.service.port}/api/yield/landscape`,
        revenueAttribution: `GET http://localhost:${config.service.port}/api/yield/attribution`,
        yieldPrediction: `GET http://localhost:${config.service.port}/api/yield/predict`,
        strategies: `GET/POST http://localhost:${config.service.port}/api/strategies`,
        tests: `GET/POST http://localhost:${config.service.port}/api/tests`,
      });
    });

    // Handle server errors
    server.on('error', (error: Error) => {
      logger.error('Server error', { error: error.message });
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;