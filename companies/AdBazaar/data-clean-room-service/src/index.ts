import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

import { config } from './config';
import logger, { httpLogStream } from './config/logger';
import { metricsMiddleware, getMetrics } from './services/MetricsService';
import { errorHandler, notFoundHandler } from './middleware';
import {
  dataRoutes,
  matchRoutes,
  overlapRoutes,
  activationRoutes,
  healthRoutes,
} from './routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP logging with Morgan
app.use(morgan('combined', { stream: httpLogStream }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    timestamp: new Date().toISOString(),
  },
});
app.use('/api/', limiter);

// Metrics middleware
app.use(metricsMiddleware);

// Metrics endpoint
app.get('/metrics', getMetrics);

// Health routes (no prefix)
app.use('/health', healthRoutes);

// API routes
app.use('/api/data', dataRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/overlap', overlapRoutes);
app.use('/api/activate', activationRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Connect to MongoDB and start server
async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB
    logger.info('Connecting to MongoDB...', {
      uri: config.mongodb.uri.replace(/\/\/.*@/, '//<credentials>@'), // Hide credentials
    });

    await mongoose.connect(config.mongodb.uri, config.mongodb.options);

    logger.info('MongoDB connected successfully');

    // Start server
    

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'data-clean-room-service',
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
      logger.info(`Data Clean Room Service started`, {
        port: config.port,
        nodeEnv: config.nodeEnv,
        version: '1.0.0',
      });

      logger.info(`Health check: http://localhost:${config.port}/health`);
      logger.info(`Metrics: http://localhost:${config.port}/metrics`);
      logger.info(`API Base: http://localhost:${config.port}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');

  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');

  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
});

// Start the server
startServer();

export default app;