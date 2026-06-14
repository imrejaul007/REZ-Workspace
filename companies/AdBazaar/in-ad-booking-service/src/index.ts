/**
 * In-Ad Booking Service
 * Enables booking flows inside ads - users can book appointments, tables, services directly from ads
 *
 * Port: 4810
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import config from './config';
import logger from './utils/logger';
import { connectRedis, disconnectRedis } from './utils/redis';
import { bookingRoutes } from './routes';
import { apiLimiter, authLimiter, bookingLimiter } from './middleware';
import { metricsMiddleware, metricsHandler, errorHandler, notFoundHandler } from './middleware';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS - Whitelist only
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (config.cors.allowedOrigins.some(allowed => origin.includes(allowed))) {
      return callback(null, true);
    }
    callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Metrics middleware
app.use(metricsMiddleware);

// Health endpoints (no rate limiting)
app.get('/health', async (_req: Request, res: Response) => {
  const mongoOk = mongoose.connection.readyState === 1;
  res.json({
    status: mongoOk ? 'healthy' : 'degraded',
    service: 'in-ad-booking-service',
    mongodb: mongoOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

app.get('/ready', async (_req: Request, res: Response) => {
  const mongoOk = mongoose.connection.readyState === 1;
  if (!mongoOk) {
    res.status(503).json({ ready: false, error: 'MongoDB not connected' });
    return;
  }
  res.json({ ready: true });
});

// Metrics endpoint
app.get('/metrics', metricsHandler);

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// Mount routes
app.use('/api/booking', bookingRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  try {
    await disconnectRedis();
    await mongoose.connection.close();
    logger.info('All connections closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error: error instanceof Error ? error.message : 'Unknown' });
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
async function start(): Promise<void> {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri);
    logger.info(`[${new Date().toISOString()}] Connected to MongoDB at ${config.mongodb.uri}`);

    // Connect to Redis (optional - service continues without it)
    await connectRedis();

    // Start HTTP server
    app.listen(config.port, () => {
      logger.info(`[${new Date().toISOString()}] in-ad-booking-service running on port ${config.port}`);
      logger.info(`  Health: http://localhost:${config.port}/health`);
      logger.info(`  Metrics: http://localhost:${config.port}/metrics`);
      logger.info(`  API: http://localhost:${config.port}/api/booking`);
    });
  } catch (error) {
    logger.error('Startup error', { error: error instanceof Error ? error.message : 'Unknown' });
    process.exit(1);
  }
}

start();

export default app;