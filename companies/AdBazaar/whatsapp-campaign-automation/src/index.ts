/**
 * WhatsApp Campaign Automation Service
 * AI-powered WhatsApp campaign automation for targeted messaging
 *
 * Port: 4861
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { rateLimit } from 'express-rate-limit';
import { config } from './config';
import logger from './utils/logger';
import whatsappRoutes from './routes/whatsapp.routes';
import {
  metricsMiddleware,
  getMetrics,
  healthCheck,
  readinessCheck,
} from './middleware/metrics.middleware';

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

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (config.cors.allowedOrigins.some((allowed) => origin.includes(allowed))) {
      return callback(null, true);
    }
    callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
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

// Metrics middleware
app.use(metricsMiddleware);

// Health and readiness endpoints
app.get('/health', healthCheck);
app.get('/ready', readinessCheck);
app.get('/metrics', getMetrics);

// API routes
app.use('/api/whatsapp', whatsappRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Global error handler
function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
}

app.use(errorHandler);

// Graceful shutdown
async function shutdown(): Promise<void> {
  logger.info('Shutting down gracefully...');

  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
  }

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

    // Start listening
    app.listen(config.port, () => {
      logger.info(
        `[${new Date().toISOString()}] WhatsApp Campaign Automation running on port ${config.port}`
      );
      logger.info(`[${new Date().toISOString()}] Environment: ${config.nodeEnv}`);
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