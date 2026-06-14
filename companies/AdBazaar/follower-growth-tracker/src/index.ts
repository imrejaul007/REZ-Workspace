import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';
import { register } from './utils/metrics.js';
import { authMiddleware, errorHandler, notFoundHandler, zodErrorHandler, metricsMiddleware } from './middleware/index.js';
import { growthRoutes, adminRoutes } from './routes/index.js';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Metrics middleware
app.use(metricsMiddleware);

// Health check endpoint (no auth required)
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'follower-growth-tracker',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Metrics endpoint (no auth required)
app.get('/metrics', async (_req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
});

// API routes
app.use('/api/growth', growthRoutes);
app.use('/api', adminRoutes);

// Error handling
app.use(notFoundHandler);
app.use(zodErrorHandler);
app.use(errorHandler);

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  try {
    // Close database connection
    await new Promise((resolve) => setTimeout(resolve, 1000));
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
async function start(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    app.listen(config.port, () => {
      logger.info(`Follower Growth Tracker service started on port ${config.port}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
      logger.info(`Metrics: http://localhost:${config.port}/metrics`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

start();

export default app;