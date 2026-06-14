/**
 * Brand Partnership Portal - Main Entry Point
 * Self-service portal for brands to connect with influencers
 *
 * Port: 5112
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { rateLimit } from 'express-rate-limit';
import { collectDefaultMetrics, Registerer } from 'prom-client';

import { PORT, MONGODB_URI, ALLOWED_ORIGINS, RATE_LIMIT as RATE_LIMIT_CONFIG } from './config';
import logger from 'utils/logger.js';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware';

// Initialize Prometheus metrics
const register = new Registerer();
collectDefaultMetrics({ register });

const app = express();

// CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.some(allowed => origin.includes(allowed))) {
      return callback(null, true);
    }
    callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Internal-Token', 'X-User-Id'],
  credentials: true
}));

// Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.MAX,
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  const mongoOk = mongoose.connection.readyState === 1;
  res.json({
    status: mongoOk ? 'healthy' : 'degraded',
    service: 'brand-partnership-portal',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    mongodb: mongoOk ? 'connected' : 'disconnected'
  });
});

// Readiness check
app.get('/ready', async (_req: Request, res: Response) => {
  const mongoOk = mongoose.connection.readyState === 1;
  if (!mongoOk) {
    res.status(503).json({ ready: false, error: 'MongoDB not connected' });
    return;
  }
  res.json({ ready: true });
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (_req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
});

// API Routes
app.use('/api', routes);

// 404 Handler
app.use(notFoundHandler);

// Error Handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

// Start server
async function start(): Promise<void> {
  try {
    // Connect to MongoDB
    logger.info(`Connecting to MongoDB at ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB connected successfully');

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`==============================================`);
      logger.info(`Brand Partnership Portal`);
      logger.info(`Port: ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`MongoDB: ${MONGODB_URI}`);
      logger.info(`==============================================`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

start();

export default app;