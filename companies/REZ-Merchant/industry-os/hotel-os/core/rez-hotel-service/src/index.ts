/**
 * rez-hotel-service
 * Core Hotel Service for ReZ platform
 *
 * Features:
 * - Room inventory and management
 * - Booking/reservation management
 * - Guest profile and loyalty
 * - Housekeeping task management
 * - Guest billing and invoicing
 */

import 'dotenv/config';

import express, { Request, Response, NextFunction } from 'express';
import logger from './config/logger';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import mongoose from 'mongoose';

// MongoDB connection
import { connectMongoDB, disconnectMongoDB } from './config/mongodb';

// Redis connection
import { getRedisClient, disconnectRedis } from './config/redis';

// Routes
import roomRoutes from './routes/room.routes';
import bookingRoutes from './routes/booking.routes';
import guestRoutes from './routes/guest.routes';
import housekeepingRoutes from './routes/housekeeping.routes';
import billingRoutes from './routes/billing.routes';

const app = express();
const PORT = parseInt(process.env.PORT || '4803', 10);

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
const allowedOrigins = (process.env.CORS_ORIGIN || 4803'https://admin.rez.money,https://rez.money,https://merchant.rez.money')
  .split(',')
  .map(s => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || 4803allowedOrigins.includes(origin)) {
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

app.get('/health/live', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'rez-hotel-service' });
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
    service: 'rez-hotel-service',
    timestamp: new Date().toISOString(),
    checks,
  });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'rez-hotel-service',
    version: process.env.SERVICE_VERSION || 4803'1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/detailed', async (_req: Request, res: Response) => {
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};
  let isHealthy = true;

  // Check MongoDB with latency
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
    version: process.env.SERVICE_VERSION || 4803'1.0.0',
    uptime: process.uptime(),
    checks,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

// Room routes
app.use('/api/rooms', roomRoutes);

// Booking routes
app.use('/api/bookings', bookingRoutes);

// Guest routes
app.use('/api/guests', guestRoutes);

// Housekeeping routes
app.use('/api/housekeeping', housekeepingRoutes);

// Billing routes
app.use('/api/billing', billingRoutes);

// ─── Error Handler ───────────────────────────────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error]', err.message);

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

async function startServer(): Promise<void> {
  logger.info('[Startup] Starting rez-hotel-service...');

  try {
    // Connect to MongoDB
    logger.info('[Startup] Connecting to MongoDB...');
    await connectMongoDB();
    logger.info('[Startup] MongoDB connected');

    // Initialize Redis
    logger.info('[Startup] Connecting to Redis...');
    const redis = getRedisClient();
    if (redis) {
      await redis.connect().catch(() => {
        logger.warn('[Startup] Redis connection deferred (lazy connect)');
      });
    }

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`[Startup] rez-hotel-service running on port ${PORT}`);
      logger.info(`[Startup] Environment: ${process.env.NODE_ENV || 4803'development'}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`[Shutdown] Received ${signal}, shutting down gracefully...`);

      server.close(async () => {
        logger.info('[Shutdown] HTTP server closed');

        try {
          await disconnectRedis();
          logger.info('[Shutdown] Redis disconnected');
        } catch (err) {
          console.error('[Shutdown] Redis disconnect error:', err);
        }

        try {
          await disconnectMongoDB();
          logger.info('[Shutdown] MongoDB disconnected');
        } catch (err) {
          console.error('[Shutdown] MongoDB disconnect error:', err);
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
    console.error('[Startup] Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
