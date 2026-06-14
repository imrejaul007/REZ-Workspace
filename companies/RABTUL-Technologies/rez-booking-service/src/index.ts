/**
 * ReZ Booking Service
 * Unified Booking Management Service
 *
 * Central service for:
 * - Cross-service booking orchestration
 * - Booking state management
 * - Booking history and analytics
 * - Cancellation and refunds
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { logger } from './utils/logger';
import { tracingMiddleware } from './middleware/tracing';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import mongoose from 'mongoose';

// Sentry initialization
import * as Sentry from '@sentry/node';
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 0.1,
});

// Routes
import bookingRoutes from './routes/bookingRoutes';
import hotelBookingRoutes from './routes/hotelBookingRoutes';
import travelBookingRoutes from './routes/travelBookingRoutes';
import cancellationRoutes from './routes/cancellationRoutes';

const app = express();
const PORT = parseInt(process.env.PORT || '4020', 10);

// Service name
process.env.SERVICE_NAME = 'rez-booking-service';

// ─── Middleware ───────────────────────────────────────────────────────────────

app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// CORS
const allowedOrigins = (process.env.CORS_ORIGIN || 'https://admin.rez.money,https://rez.money,https://rez-app.vercel.app')
  .split(',')
  .map(s => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB sanitize (prevent NoSQL injection)
app.use(mongoSanitize());

// Request logging
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

// ─── Health Endpoints ─────────────────────────────────────────────────────────

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'rez-booking-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/live', (_req: Request, res: Response) => {
  res.json({ status: 'alive', uptime: process.uptime() });
});

app.get('/health/ready', async (_req: Request, res: Response) => {
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};
  let isReady = true;

  // Check MongoDB
  try {
    const mongoStart = Date.now();
    if (mongoose.connection.readyState !== 1) {
      throw new Error('not connected');
    }
    await mongoose.connection.db.admin().ping();
    checks.mongodb = { status: 'up', latencyMs: Date.now() - mongoStart };
  } catch (err) {
    checks.mongodb = { status: 'down', error: err.message };
    isReady = false;
  }

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not_ready',
    service: 'rez-booking-service',
    timestamp: new Date().toISOString(),
    checks,
  });
});

app.get('/health/detailed', async (_req: Request, res: Response) => {
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};
  let isHealthy = true;

  // Check MongoDB
  try {
    const mongoStart = Date.now();
    if (mongoose.connection.readyState !== 1) {
      throw new Error('not connected');
    }
    await mongoose.connection.db.admin().ping();
    checks.database = { status: 'up', latencyMs: Date.now() - mongoStart };
  } catch (err) {
    checks.database = { status: 'down', error: err.message };
    isHealthy = false;
  }

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.SERVICE_VERSION || '1.0.0',
    uptime: process.uptime(),
    checks,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

// Unified booking management
app.use('/api/bookings', bookingRoutes);

// Hotel booking integration
app.use('/api/bookings/hotels', hotelBookingRoutes);

// Travel booking integration
app.use('/api/bookings/travel', travelBookingRoutes);

// Cancellation management
app.use('/api/bookings/cancellations', cancellationRoutes);

// ─── Error Handler ───────────────────────────────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('[Error]', err.message);

  Sentry.captureException(err);

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// ─── Server Startup ───────────────────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_booking';

async function startServer(): Promise<void> {
  logger.info('[Startup] Starting rez-booking-service...');

  try {
    // Connect to MongoDB
    logger.info('[Startup] Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    logger.info('[Startup] MongoDB connected');

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`[Startup] rez-booking-service running on port ${PORT}`);
      logger.info(`[Startup] Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info('[Startup] Routes available:');
      logger.info('  - GET  /health');
      logger.info('  - GET  /api/bookings');
      logger.info('  - POST /api/bookings/hotels');
      logger.info('  - POST /api/bookings/travel');
      logger.info('  - POST /api/bookings/cancellations');
    });

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`[Shutdown] Received ${signal}, shutting down gracefully...`);

      server.close(async () => {
        logger.info('[Shutdown] HTTP server closed');

        try {
          await mongoose.connection.close();
          logger.info('[Shutdown] MongoDB disconnected');
        } catch (err) {
          logger.error('[Shutdown] MongoDB disconnect error:', err);
        }

        process.exit(0);
      });

      // Force exit after 30 seconds
      setTimeout(() => {
        logger.error('[Shutdown] Forcing exit after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('[Startup] Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
