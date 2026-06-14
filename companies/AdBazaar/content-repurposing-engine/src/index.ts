import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import { logger } from 'utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { getMetrics, register } from './middleware/metrics.js';
import { repurposingRoutes, templateRoutes, platformRoutes } from './routes/index.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`, {
    query: req.query,
    ip: req.ip,
  });
  next();
});

// Health endpoint
app.get('/health', async (_req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'content-repurposing-engine',
    version: '1.0.0',
  };

  try {
    // Check MongoDB connection
    const mongoose = await import('mongoose');
    health.database = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  } catch {
    health.database = 'unknown';
  }

  res.json(health);
});

// Metrics endpoint
app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await getMetrics());
  } catch (error) {
    logger.error('Failed to get metrics', { error });
    res.status(500).end();
  }
});

// API Routes
app.use('/api/repurpose', repurposingRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/platforms', platformRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  try {
    const mongoose = await import('mongoose');
    await mongoose.disconnect();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error during shutdown', { error });
  }

  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
async function start(): Promise<void> {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Start HTTP server
    app.listen(config.port, () => {
      logger.info(`Content Repurposing Engine started on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Health: http://localhost:${config.port}/health`);
      logger.info(`Metrics: http://localhost:${config.port}/metrics`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

start();

export default app;