/**
 * REZ Loyalty Gateway - Main Entry Point
 * Federated API for coins, wallet, and loyalty systems
 */

import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { env } from './config/services.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { logger } from './utils/logger.js';
import { CoinSyncEngine } from './services/CoinSyncEngine.js';

// Routes
import balanceRoutes from './routes/balance.js';
import earnRoutes from './routes/earn.js';
import redeemRoutes from './routes/redeem.js';
import tiersRoutes from './routes/tiers.js';
import transactionsRoutes from './routes/transactions.js';
import eventsRoutes from './routes/events.js';
import healthRoutes from './routes/health.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',') || []
    : '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
  max: parseInt(env.RATE_LIMIT_MAX_REQUESTS),
  message: { success: false, error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Health routes (no auth required)
app.use('/health', healthRoutes);

// API routes
app.use('/api/v1/loyalty/balance', balanceRoutes);
app.use('/api/v1/loyalty/earn', earnRoutes);
app.use('/api/v1/loyalty/redeem', redeemRoutes);
app.use('/api/v1/loyalty/tiers', tiersRoutes);
app.use('/api/v1/loyalty/transactions', transactionsRoutes);
app.use('/api/v1/loyalty/events', eventsRoutes);
app.use('/api/v1/loyalty/sync', eventsRoutes);

//404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    path: req.path,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// Initialize services
const syncEngine = new CoinSyncEngine();

// Graceful shutdown
async function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  try {
    // Stop sync engine
    await syncEngine.stop();

    // Disconnect Redis
    await disconnectRedis();

    logger.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
async function start() {
  try {
    // Connect to Redis
    logger.info('Connecting to Redis...');
    await connectRedis();
    logger.info('Redis connected');

    // Start sync engine
    logger.info('Starting sync engine...');
    await syncEngine.start();
    logger.info('Sync engine started');

    // Start HTTP server
    const port = parseInt(env.PORT);
    

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-loyalty-gateway',
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
app.listen(port, () => {
      logger.info(`REZ Loyalty Gateway running on port ${port}`);
      logger.info(`Health check: http://localhost:${port}/health`);
      logger.info(`API base: http://localhost:${port}/api/v1/loyalty`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

start();

export default app;
