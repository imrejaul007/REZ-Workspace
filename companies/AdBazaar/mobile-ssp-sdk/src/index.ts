import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/index.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { routes } from './routes/index.js';
import { metricsMiddleware, getMetrics, getMetricsContentType } from './middleware/metrics.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';

const app: Express = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Metrics middleware
app.use(metricsMiddleware);

// Rate limiting
app.use(rateLimiter);

// Routes
app.use(routes);

// Metrics endpoint
app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', getMetricsContentType());
    res.send(await getMetrics());
  } catch (error) {
    res.status(500).send('Error collecting metrics');
  }
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`\nReceived ${signal}. Starting graceful shutdown...`);

  try {
    await disconnectDatabase();
    await disconnectRedis();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to databases
    await connectDatabase();
    await connectRedis();

    // Start listening
    

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'mobile-ssp-sdk',
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
      logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   AdBazaar Mobile SSP SDK                                     ║
║   Server started successfully!                               ║
║                                                               ║
║   Port: ${config.port}                                              ║
║   Environment: ${config.nodeEnv}                                   ║
║                                                               ║
║   Endpoints:                                                  ║
║   - Health:     http://localhost:${config.port}/health            ║
║   - Metrics:    http://localhost:${config.port}/metrics           ║
║   - Mobile API: http://localhost:${config.port}/api/mobile         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

startServer();

export { app };