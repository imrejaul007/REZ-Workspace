import express from 'express';
import { tracingMiddleware } from './middleware/tracing';
import cors from 'cors';
import { profileRouter } from './api/routes/profile';
import { hiddenRouter } from './api/routes/hidden';
import { featuresRouter } from './api/routes/features';
import { creatorRouter } from './api/routes/creator';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { logger } from './config/logger';
import config from './config';

const app = express();

// CORS - restrict to known origins
const allowedOrigins = (process.env.CORS_ORIGINS || 'https://rez.money,https://admin.rez.money,https://merchant.rez.money').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error('CORS blocked'));
  },
  credentials: true,
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'profile-service',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Readiness check (verifies DB connections)
app.get('/ready', async (req, res) => {
  try {
    // Check MongoDB
    const mongoose = await import('mongoose');
    const mongoOk = mongoose.connection.readyState === 1;

    // Check Redis
    let redisOk = false;
    try {
      const redis = await import('./config/redis');
      const client = (redis as { redis?: { ping: () => Promise<string> } }).redis;
      if (client) {
        await client.ping();
        redisOk = true;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[HealthCheck] Redis check failed: ${errorMessage}`);
      redisOk = false;
    }

    const ready = mongoOk && redisOk;

    res.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'not ready',
      checks: {
        mongodb: mongoOk ? 'ok' : 'disconnected',
        redis: redisOk ? 'ok' : 'disconnected',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// Routes
app.use('/profile', profileRouter);

// Extended profile routes with REE
app.use('/api/profile', require('./api/routes/profileExtended'));

// Features/REE routes
app.use('/api/features', featuresRouter);

// Creator routes (unified for Creator QR, Prive, Wallet)
app.use('/api/creator', creatorRouter);

// Persona routes (multi-persona system)
app.use('/api/personas', require('./api/routes/persona'));

// Internal routes (hidden)
app.use('/hidden', hiddenRouter);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    path: req.path,
  });
});

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    await connectDatabase();

    // Connect to Redis
    logger.info('Connecting to Redis...');
    try {
      await connectRedis();
    } catch (redisError) {
      logger.warn('Redis connection failed - rate limiting will use memory fallback', { error: redisError });
    }

    // Start HTTP server
    app.listen(config.PORT, () => {
      logger.info(`Profile Service running on port ${config.PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`REE Service URL: ${config.REE_SERVICE_URL}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  logger.info('SIGTERM received - shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received - shutting down gracefully');
  process.exit(0);
});

startServer();
