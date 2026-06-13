import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';

// Routes
import { driverRoutes, eventRoutes } from './routes/index.js';
import { getEventEmitter } from './events/index.js';
import { logger } from './utils/index.js';

// ============================================================================
// GLOBAL ERROR HANDLERS
// ============================================================================

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack,
  });
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// ============================================================================
// APP SETUP
// ============================================================================

const app = express();
const PORT = process.env.PORT || 9047;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/driver_twin';

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'driver-twin-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
  });
});

app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'RTMN Driver Twin Service',
    description: 'Digital twin service for transport drivers',
    version: '1.0.0',
    twin_type: 'driver',
    integration: 'Transport OS',
    endpoints: {
      health: '/health',
      driver: '/api/twins/driver',
      events: '/api/events',
    },
  });
});

// ============================================================================
// API ROUTES (v1)
// ============================================================================

app.use('/api/twins/driver', driverRoutes);
app.use('/api/events', eventRoutes);

// ============================================================================
// ERROR HANDLER
// ============================================================================

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error handler', {
    message: err.message,
    stack: err.stack,
    path: req.path,
  });

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal error' : err.message,
  });
});

// ============================================================================
// 404 HANDLER
// ============================================================================

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
  });
});

// ============================================================================
// START
// ============================================================================

async function start() {
  logger.info('Starting Driver Twin Service...');

  // Connect to MongoDB
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB connected', { uri: MONGODB_URI });
  } catch (error) {
    logger.error('MongoDB connection failed', { error });
    // Continue anyway for development
  }

  // Initialize event emitter
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    getEventEmitter(redisUrl);
    logger.info('Event emitter initialized with Redis');
  } else {
    getEventEmitter();
    logger.info('Event emitter initialized (local mode)');
  }

  // Start server
  app.listen(PORT, () => {
    logger.info(`Driver Twin Service running on port ${PORT}`);
    logger.info(`Health: http://localhost:${PORT}/health`);
    logger.info(`API: http://localhost:${PORT}/api/twins`);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down...');
  const emitter = getEventEmitter();
  await emitter.close();
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Shutting down...');
  const emitter = getEventEmitter();
  await emitter.close();
  await mongoose.disconnect();
  process.exit(0);
});

start().catch((error) => {
  logger.error('Failed to start', { error });
  process.exit(1);
});

export default app;