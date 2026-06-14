import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { logger, requestLogger } from 'utils/logger.js';
import { metrics, httpRequestDuration } from './utils/metrics';
import { internalAuth } from './middleware/auth';
import fillRateRoutes from './routes/fillRateRoutes';
import { FillRateService } from './services/fillRateService';
import { v4 as uuidv4 } from 'uuid';

// Environment variables
const PORT = process.env.PORT || 4981;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fill-rate-optimizer';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const app: Express = express();

// Redis client
let redisClient: ReturnType<typeof createClient> | null = null;

// Services
let fillRateService: FillRateService | null = null;

// Trust proxy for accurate IP logging
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-Request-ID']
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.headers['x-request-id']);
  next();
});

// Request logging
app.use(requestLogger);

// Prometheus metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', metrics.register.contentType);
    res.end(await metrics.register.metrics());
  } catch (error) {
    res.status(500).end();
  }
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'fill-rate-optimizer',
    version: '1.0.0',
    port: PORT,
    uptime: process.uptime(),
    checks: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: redisClient?.isOpen ? 'connected' : 'disconnected'
    }
  };

  const isHealthy = health.checks.mongodb === 'connected';
  res.status(isHealthy ? 200 : 503).json(health);
});

// Readiness check
app.get('/ready', async (req: Request, res: Response) => {
  const isReady = mongoose.connection.readyState === 1 && redisClient?.isOpen;
  if (isReady) {
    res.json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready' });
  }
});

// Internal API routes (protected)
app.use('/api/fill-rate', internalAuth, fillRateRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.headers['x-request-id']
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id']
  });
});

// Connect to MongoDB
async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB', { uri: MONGODB_URI.replace(/\/\/.*@/, '//***@') });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    throw error;
  }
}

// Connect to Redis
async function connectRedis(): Promise<void> {
  try {
    redisClient = createClient({
      url: REDIS_URL
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error', { error: err.message });
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis', { url: REDIS_URL });
    });

    await redisClient.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis', { error });
    // Continue without Redis - graceful degradation
    redisClient = null;
  }
}

// Initialize services
async function initializeServices(): Promise<void> {
  fillRateService = new FillRateService(redisClient);
  await fillRateService.initialize();
  logger.info('Fill rate service initialized');
}

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  try {
    // Close Redis
    if (redisClient?.isOpen) {
      await redisClient.quit();
      logger.info('Redis connection closed');
    }

    // Close MongoDB
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
}

// Start server
async function start(): Promise<void> {
  try {
    // Connect to databases
    await connectMongoDB();
    await connectRedis();

    // Initialize services
    await initializeServices();

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`Fill Rate Optimizer started`, {
        port: PORT,
        env: process.env.NODE_ENV || 'development',
        mongodb: MONGODB_URI.replace(/\/\/.*@/, '//***@'),
        redis: REDIS_URL
      });
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Export for testing
export { app, fillRateService, redisClient };

// Start server if running directly
if (require.main === module) {
  start();
}
