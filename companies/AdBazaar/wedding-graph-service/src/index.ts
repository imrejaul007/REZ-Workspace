import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createClient } from 'redis';
import { register, Counter, Histogram, Gauge } from 'prom-client';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

// Import routes
import weddingRoutes from './routes/weddingRoutes';
import guestRoutes from './routes/guestRoutes';
import vendorRoutes from './routes/vendorRoutes';

// Import models
import './models/Wedding';
import './models/Guest';
import './models/Vendor';
import './models/WeddingAnalytics';

// Import middleware
import { authMiddleware } from './middleware/auth';

// Initialize Winston logger
const logger = winston.create({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Prometheus metrics
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status']
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.1, 0.3, 0.5, 1, 3, 5, 10]
});

const activeWeddingCount = new Gauge({
  name: 'active_wedding_count',
  help: 'Number of active weddings'
});

const totalGuestCount = new Gauge({
  name: 'total_guest_count',
  help: 'Total number of guests across all weddings'
});

// Environment variables
const PORT = process.env.PORT || 4881;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wedding-graph';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'wedding-graph-internal-token';

// Redis client
let redisClient: ReturnType<typeof createClient>;

async function connectRedis(): Promise<void> {
  try {
    redisClient = createClient({ url: REDIS_URL });
    redisClient.on('error', (err) => logger.error('Redis Client Error:', { error: err instanceof Error ? err.message : String(err) }));
    await redisClient.connect();
    logger.info('Connected to Redis');
  } catch (error) {
    logger.error('Failed to connect to Redis:', { error: error instanceof Error ? error.message : String(error) });
  }
}

async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

// Create Express app
const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  (req as any).requestId = uuidv4();
  res.setHeader('X-Request-ID', (req as any).requestId);
  next();
});

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestsTotal.inc({
      method: req.method,
      path: req.path,
      status: res.statusCode.toString()
    });
    httpRequestDuration.observe(
      {
        method: req.method,
        path: req.path,
        status: res.statusCode.toString()
      },
      duration
    );
    logger.info('HTTP Request', {
      requestId: (req as any).requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(3)}s`
    });
  });
  next();
});

// Health check endpoint (public)
app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const redisStatus = redisClient?.isOpen ? 'connected' : 'disconnected';

  const health = {
    status: mongoStatus === 'connected' && redisStatus === 'connected' ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    service: 'wedding-graph-service',
    version: '1.0.0',
    port: PORT,
    checks: {
      mongodb: mongoStatus,
      redis: redisStatus
    }
  };

  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

// Prometheus metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    // Update gauges before returning metrics
    const Wedding = mongoose.model('Wedding');
    const Guest = mongoose.model('Guest');

    const weddingCount = await Wedding.countDocuments({ status: { $ne: 'cancelled' } });
    const guestCount = await Guest.countDocuments();

    activeWeddingCount.set(weddingCount);
    totalGuestCount.set(guestCount);

    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Error generating metrics:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).end();
  }
});

// API routes with authentication
app.use('/api/weddings', authMiddleware(INTERNAL_SERVICE_TOKEN), weddingRoutes);
app.use('/api/weddings', authMiddleware(INTERNAL_SERVICE_TOKEN), guestRoutes);
app.use('/api/weddings', authMiddleware(INTERNAL_SERVICE_TOKEN), vendorRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    requestId: (req as any).requestId
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', {
    requestId: (req as any).requestId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    requestId: (req as any).requestId
  });
});

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');

    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis connection closed');
    }

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
async function startServer(): Promise<void> {
  try {
    await connectMongoDB();
    await connectRedis();

    app.listen(PORT, () => {
      logger.info(`Wedding Graph Service started on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Metrics: http://localhost:${PORT}/metrics`);
      logger.info(`API Base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

startServer();

export { app, logger };