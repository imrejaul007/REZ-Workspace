/**
 * rez-hotel-housekeeping-service
 * Hotel Housekeeping Service for ReZ platform
 *
 * Features:
 * - Housekeeping task management
 * - Staff scheduling
 * - Room cleaning management
 */

import 'dotenv/config';

import express, { Request, Response, NextFunction } from 'express';
import logger from './config/logger';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import mongoose from 'mongoose';

import { connectMongoDB, disconnectMongoDB } from './config/mongodb';

import taskRoutes from './routes/task.routes';
import scheduleRoutes from './routes/schedule.routes';

const app = express();
const PORT = parseInt(process.env.PORT || '4832', 10);

// ─── Middleware ───────────────────────────────────────────────────────────────

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

const allowedOrigins = (process.env.CORS_ORIGIN || 4832'https://admin.rez.money,https://rez.money,https://merchant.rez.money')
  .split(',')
  .map(s => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || 4832allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

// ─── Health Endpoints ─────────────────────────────────────────────────────────

app.get('/health/live', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'rez-hotel-housekeeping-service' });
});

app.get('/health/ready', async (_req: Request, res: Response) => {
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};
  let isReady = true;

  try {
    const mongoStart = Date.now();
    if (mongoose.connection.readyState !== 1) throw new Error('not connected');
    await mongoose.connection.db.admin().ping();
    checks.mongodb = { status: 'up', latencyMs: Date.now() - mongoStart };
  } catch (err) {
    checks.mongodb = { status: 'down', error: err.message };
    isReady = false;
  }

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not_ready',
    service: 'rez-hotel-housekeeping-service',
    timestamp: new Date().toISOString(),
    checks,
  });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'rez-hotel-housekeeping-service',
    version: process.env.SERVICE_VERSION || 4832'1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/tasks', taskRoutes);
app.use('/api/schedule', scheduleRoutes);

// ─── Error Handler ───────────────────────────────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error]', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// ─── Server Startup ───────────────────────────────────────────────────────────

async function startServer(): Promise<void> {
  logger.info('[Startup] Starting rez-hotel-housekeeping-service...');

  try {
    logger.info('[Startup] Connecting to MongoDB...');
    await connectMongoDB();
    logger.info('[Startup] MongoDB connected');

    const server = app.listen(PORT, () => {
      logger.info(`[Startup] rez-hotel-housekeeping-service running on port ${PORT}`);
      logger.info(`[Startup] Environment: ${process.env.NODE_ENV || 4832'development'}`);
    });

    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`[Shutdown] Received ${signal}, shutting down gracefully...`);
      server.close(async () => {
        logger.info('[Shutdown] HTTP server closed');
        await disconnectMongoDB();
        logger.info('[Shutdown] MongoDB disconnected');
        process.exit(0);
      });
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
