import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';

import { config } from './config/index.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import routes from './routes/index.js';
import { metricsMiddleware, getMetrics, getContentType } from './middleware/metrics.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Metrics middleware
app.use(metricsMiddleware);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'ott-streaming-sdk',
    port: config.port,
    timestamp: new Date().toISOString(),
  });
});

// Metrics endpoint
app.get('/metrics', async (_req, res) => {
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', getContentType());
    res.send(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// API routes
app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
async function shutdown(): Promise<void> {
  logger.info('Shutting down...');
  await disconnectDatabase();
  await disconnectRedis();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start server
async function start(): Promise<void> {
  try {
    // Connect to databases
    await connectDatabase();
    await connectRedis();

    // Start Express server
    app.listen(config.port, () => {
      logger.info(`OTT Streaming SDK service running on port ${config.port}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
      logger.info(`Metrics: http://localhost:${config.port}/metrics`);
      logger.info(`API: http://localhost:${config.port}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

start();

export default app;
