import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';
import { logger } from 'utils/logger.js';
import { metrics, collectDefaultMetrics } from './utils/metrics';
import { Consent } from './models/Consent';
import { ConsentHistory } from './models/ConsentHistory';
import { ConsentTemplate } from './models/ConsentTemplate';
import { ConsentAudit } from './models/ConsentAudit';
import { consentService } from './services/consentService';
import { historyService } from './services/historyService';
import { complianceService } from './services/complianceService';
import { auditService } from './services/auditService';
import { templateService } from './services/templateService';
import { authMiddleware } from './middleware/auth';
import { consentRoutes } from './routes/consentRoutes';

// Configuration
const PORT = process.env.PORT || 4999;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/adbazaar-consent';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Redis client
let redisClient: ReturnType<typeof createClient> | null = null;

// Initialize Redis connection
async function initRedis(): Promise<void> {
  try {
    redisClient = createClient({ url: REDIS_URL });
    redisClient.on('error', (err) => logger.error('Redis Client Error', { error: err }));
    redisClient.on('connect', () => logger.info('Redis connected successfully'));
    await redisClient.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis', { error });
 }
}

// Initialize MongoDB connection
async function initMongoDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB connected successfully', { uri: MONGODB_URI });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
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
  req.headers['x-request-id'] = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.headers['x-request-id']);
  next();
});

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      requestId: req.headers['x-request-id']
    });
  });
  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'consent-management',
    version: '1.0.0',
    uptime: process.uptime(),
    checks: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: redisClient?.isReady ? 'connected' : 'disconnected'
    }
  };

  const isHealthy = health.checks.mongodb === 'connected';
  res.status(isHealthy ? 200 : 503).json(health);
});

// Prometheus metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  res.set('Content-Type', metrics.register.contentType);
  res.end(await metrics.register.metrics());
});

// Apply auth middleware to API routes
app.use('/api', authMiddleware);

// API routes
app.use('/api/consent', consentRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    requestId: req.headers['x-request-id']
  });

  metrics.errorsTotal.inc({ type: 'unhandled' });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    requestId: req.headers['x-request-id']
  });
});

// Graceful shutdown
async function shutdown(): Promise<void> {
  logger.info('Shutting down gracefully...');

  try {
    if (redisClient) {
      await redisClient.quit();
    }
    await mongoose.connection.close();
    logger.info('All connections closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function startServer(): Promise<void> {
  try {
    // Initialize connections
    await initMongoDB();
    await initRedis();

    // Collect default metrics
    collectDefaultMetrics({ prefix: 'consent_management_' });

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Consent Management Service started`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();

export { app, redisClient };
