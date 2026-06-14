/**
 * Merchant Twin Service - Main Entry Point
 *
 * Behavioral twins for merchants to help advertisers understand merchant audiences
 */

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import config from './config';
import logger from 'utils/logger.js';
import merchantTwinRoutes from './routes/merchant-twin.routes';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { metricsMiddleware, metricsHandler } from './middleware/metrics';

const app = express();

// CORS Configuration
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

// Security headers
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

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { success: false, error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Prometheus metrics middleware
app.use(metricsMiddleware);

// Health check endpoints
app.get('/health', async (_req: Request, res: Response) => {
  const mongoOk = mongoose.connection.readyState === 1;
  res.json({
    status: mongoOk ? 'healthy' : 'degraded',
    service: 'merchant-twin-service',
    version: '1.0.0',
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

// Prometheus metrics endpoint
app.get('/metrics', metricsHandler);

// API routes
app.use('/api/merchant-twin', merchantTwinRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Graceful shutdown
async function shutdown(): Promise<void> {
  logger.info('Shutting down merchant-twin-service...');
  await mongoose.connection.close();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function start(): Promise<void> {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri);
    logger.info(`[${new Date().toISOString()}] Connected to MongoDB`);

    // Start HTTP server
    app.listen(config.port, () => {
      logger.info(`[${new Date().toISOString()}] merchant-twin-service running on port ${config.port}`);
      logger.info(`[${new Date().toISOString()}] Health check: http://localhost:${config.port}/health`);
      logger.info(`[${new Date().toISOString()}] Metrics: http://localhost:${config.port}/metrics`);
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    process.exit(1);
  }
}

start();

export default app;