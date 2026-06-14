import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import mongoose from 'mongoose';
import morgan from 'morgan';

import { config, validateConfig } from './config';
import { logger } from './services/logger.service';
import { initRedis, closeRedis } from './services/redis.service';
import { metricsMiddleware } from './services/metrics.service';
import { campaignService } from './services/campaign.service';
import {
  errorHandler,
  notFoundHandler,
  globalRateLimiter,
  campaignRateLimiter,
} from './middleware';
import {
  campaignRoutes,
  channelRoutes,
  healthRoutes,
  metricsRoutes,
} from './routes';

// Validate configuration
try {
  validateConfig();
} catch (error) {
  logger.error('Configuration validation failed:', { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
}

// Create Express app
const app: Application = express();

// Trust proxy (for rate limiting behind load balancer)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB sanitization
app.use(mongoSanitize());

// Logging
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Metrics middleware
app.use(metricsMiddleware);

// Rate limiting
app.use(globalRateLimiter);

// Health routes (no auth required)
app.use('/health', healthRoutes);

// Metrics routes (no auth required)
app.use('/metrics', metricsRoutes);

// API routes
app.use('/api/campaigns', campaignRateLimiter, campaignRoutes);
app.use('/api/channels', channelRoutes);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'cross-channel-orchestrator',
    version: '1.0.0',
    description: 'Unified DSP for cross-channel campaign orchestration',
    endpoints: {
      health: '/health',
      metrics: '/metrics',
      campaigns: '/api/campaigns',
      channels: '/api/channels',
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Database connection
async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodb.uri, {
      maxPoolSize: config.mongodb.options.maxPoolSize,
      minPoolSize: config.mongodb.options.minPoolSize,
      serverSelectionTimeoutMS: config.mongodb.options.serverSelectionTimeoutMS,
      socketTimeoutMS: config.mongodb.options.socketTimeoutMS,
    });
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection failed:', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

// Redis connection
async function connectRedis(): Promise<void> {
  try {
    await initRedis();
    logger.info('Redis connection initialized');
  } catch (error) {
    logger.error('Redis connection failed:', { error: error instanceof Error ? error.message : String(error) });
    // Continue without Redis - some features may be degraded
  }
}

// Campaign scheduler (for scheduled campaigns)
let schedulerInterval: NodeJS.Timeout | null = null;

function startScheduler(): void {
  // Process scheduled campaigns every minute
  schedulerInterval = setInterval(async () => {
    try {
      await campaignService.processScheduledCampaigns();
      await campaignService.completeExpiredCampaigns();
    } catch (error) {
      logger.error('Scheduler error:', { error: error instanceof Error ? error.message : String(error) });
    }
  }, 60000);

  logger.info('Campaign scheduler started');
}

function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logger.info('Campaign scheduler stopped');
  }
}

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  // Stop scheduler
  stopScheduler();

  // Close Redis
  await closeRedis();

  // Close MongoDB
  await mongoose.connection.close();

  logger.info('Shutdown complete');
  process.exit(0);
}

// Start server
async function start(): Promise<void> {
  try {
    // Connect to databases
    await connectDatabase();
    await connectRedis();

    // Start scheduler
    startScheduler();

    // Start listening
    

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'cross-channel-orchestrator',
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
      logger.info(`Cross-Channel Orchestrator started on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
      logger.info(`Metrics: http://localhost:${config.port}/metrics`);
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Unhandled rejection handler
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Uncaught exception handler
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', { error: error instanceof Error ? error.message : String(error) });
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

// Start the application
start();

export default app;