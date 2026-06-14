import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import { register, httpRequestDuration, httpRequestTotal, logger, initRedis, closeRedis } from './utils';
import { conferenceRoutes, targetingRoutes } from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Load environment variables
const PORT = parseInt(process.env.PORT || '4884');
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/conference-graph';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Express app
const app: Express = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Service-Token', 'X-Service-Id']
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging and metrics
app.use((req: Request, res: Response, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path;

    // Log request
    logger.http(`${req.method} ${req.path}`, {
      statusCode: res.statusCode,
      duration: `${duration.toFixed(3)}s`,
      ip: req.ip
    });

    // Record metrics
    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode.toString() },
      duration
    );
    httpRequestTotal.inc({ method: req.method, route, status_code: res.statusCode.toString() });
  });

  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    service: 'conference-graph-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: 'checking...'
    }
  };

  try {
    const redis = (await import('./utils')).getRedisClient();
    health.checks.redis = redis ? 'connected' : 'disconnected';
  } catch {
    health.checks.redis = 'disconnected';
  }

  const allHealthy = Object.values(health.checks).every(v => v === 'connected' || v === 'connected');
  health.status = allHealthy ? 'ok' : 'degraded';

  res.status(allHealthy ? 200 : 503).json(health);
});

// Readiness probe
app.get('/ready', async (req: Request, res: Response) => {
  const ready = mongoose.connection.readyState === 1;

  if (ready) {
    res.json({ ready: true });
  } else {
    res.status(503).json({ ready: false, reason: 'MongoDB not connected' });
  }
});

// Metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  } catch (error) {
    logger.error('Error getting metrics', { error });
    res.status(500).send('Error getting metrics');
  }
});

// API routes
app.use('/api/conferences', conferenceRoutes);
app.use('/api/targeting', targetingRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection
const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    logger.info('MongoDB connected', { uri: MONGODB_URI.replace(/\/\/.*@/, '//***@') });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  // Stop accepting new requests
  server.close(() => {
    logger.info('HTTP server closed');
  });

  try {
    // Close Redis
    await closeRedis();

    // Close MongoDB
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
};

// Start server
let server: ReturnType<Express['listen']>;

const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();

    // Initialize Redis
    await initRedis();

    // Start HTTP server
    server = app.listen(PORT, () => {
      logger.info(`Conference Graph Service started`, {
        port: PORT,
        env: NODE_ENV,
        nodeVersion: process.version
      });

      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Metrics: http://localhost:${PORT}/metrics`);
      logger.info(`API: http://localhost:${PORT}/api/conferences`);
    });

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection', { reason });
 });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    process.exit(1);
  }
};

startServer();

export default app;
