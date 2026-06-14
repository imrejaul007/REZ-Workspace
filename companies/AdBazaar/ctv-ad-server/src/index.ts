import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/index.js';
import { databaseService, redisService } from './services/index.js';
import { metricsMiddleware, errorHandler, notFoundHandler } from './middleware/index.js';
import { vastRoutes, decisionRoutes, trackRoutes, campaignRoutes, pacingRoutes, healthRoutes } from './routes/index.js';
import { logger } from './utils/index.js';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['X-Request-Id'],
  credentials: true,
  maxAge: 86400,
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Prometheus metrics middleware
app.use(metricsMiddleware);

// Trust proxy for accurate IP logging
app.set('trust proxy', 1);

// Health routes (no prefix)
app.use('/health', healthRoutes);

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  const { getMetrics, getContentType } = await import('./middleware/metrics.middleware.js');
  const metrics = await getMetrics();
  res.set('Content-Type', getContentType());
  res.send(metrics);
});

// API routes
app.use('/api/vast', vastRoutes);
app.use('/api/decision', decisionRoutes);
app.use('/api/track', trackRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/pacing', pacingRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Graceful shutdown handler
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
    });
  }

  // Close database connections
  await Promise.all([
    databaseService.disconnect(),
    redisService.disconnect(),
  ]);

  logger.info('Graceful shutdown completed');
  process.exit(0);
};

// Server instance
let server: ReturnType<typeof app.listen>;

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to databases
    logger.info('Connecting to databases...');
    await databaseService.connect();
    await redisService.connect();

    // Start HTTP server
    server = 

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ctv-ad-server',
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
      logger.info(`CTV Ad Server started on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`VAST Version: ${config.vast.version}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
      logger.info(`Metrics: http://localhost:${config.port}/metrics`);
    });

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', { error: error instanceof Error ? error.message : String(error) });
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', reason);
      gracefulShutdown('unhandledRejection');
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

// Export app for testing
export { app };

// Start server if this is the main module
startServer();