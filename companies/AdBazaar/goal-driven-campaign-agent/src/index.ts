import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import config, { validateConfig } from './config/index.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { createRedisClient, disconnectRedis } from './config/redis.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { logger } from './utils/logger.js';
import { getMetrics, getMetricsContentType } from './utils/metrics.js';
import { agentService } from './services/agent.service.js';

// Create Express app
const app: Express = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression
app.use(compression());

// Request logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Prometheus metrics endpoint
app.get('/metrics', async (_req: Request, res: Response) => {
  try {
    res.set('Content-Type', getMetricsContentType());
    res.end(await getMetrics());
  } catch (error) {
    logger.error('Error getting metrics', { error });
    res.status(500).end();
  }
});

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'goal-driven-campaign-agent',
    version: '1.0.0',
    description: 'Autonomous AI agent for goal-driven advertising campaigns',
    endpoints: {
      health: '/api/health',
      metrics: '/metrics',
      campaigns: '/api/agent/campaign',
      actions: '/api/agent/campaign/:id/actions',
      logs: '/api/agent/campaign/:id/logs'
    }
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Graceful shutdown handler
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    // Stop all running agents
    await agentService.stopAllAgents();
    logger.info('All agents stopped');

    // Disconnect from Redis
    await disconnectRedis();
    logger.info('Redis disconnected');

    // Disconnect from MongoDB
    await disconnectDatabase();
    logger.info('MongoDB disconnected');

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error });
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
});

// Start server
async function startServer(): Promise<void> {
  try {
    // Validate configuration
    validateConfig();
    logger.info('Configuration validated');

    // Connect to MongoDB
    await connectDatabase();

    // Initialize Redis
    createRedisClient();

    // Start HTTP server
    const server = 

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'goal-driven-campaign-agent',
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
      logger.info(`Server started on port ${config.port}`, {
        nodeEnv: config.nodeEnv,
        port: config.port
      });
      logger.info('Goal-driven campaign agent is ready');
    });

    // Server timeout
    server.timeout = 30000;

    // Error handling for server
    server.on('error', (error) => {
      logger.error('Server error', { error });
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;