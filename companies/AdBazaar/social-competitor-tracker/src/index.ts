import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { collectDefaultMetrics, Registry, Counter, Histogram, Gauge } from 'prom-client';
import { logger } from './config/logger.js';
import { config } from './config/index.js';
import { competitorRoutes } from './routes/competitor.routes.js';
import { insightRoutes } from './routes/insight.routes.js';
import { authMiddleware } from './middleware/auth.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Application = express();

// Prometheus metrics registry
const register = new Registry();
collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register],
});

export const competitorsTracked = new Gauge({
  name: 'competitors_tracked_total',
  help: 'Total number of competitors being tracked',
  registers: [register],
});

export const snapshotsCreated = new Counter({
  name: 'snapshots_created_total',
  help: 'Total number of competitor snapshots created',
  labelNames: ['platform'],
  registers: [register],
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health endpoint
app.get('/health', (_req: Request, res: Response) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'social-competitor-tracker',
    version: '1.0.0',
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  };

  const isHealthy = healthStatus.mongodb === 'connected';
  res.status(isHealthy ? 200 : 503).json(healthStatus);
});

// Metrics endpoint
app.get('/metrics', async (_req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end();
  }
});

// Auth middleware for API routes
app.use('/api', authMiddleware);

// API Routes
app.use('/api/competitors', competitorRoutes);
app.use('/api/insights', insightRoutes);

// Error handling middleware
app.use(errorHandler);

// Database connection
const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = config.mongodb.uri;
    await mongoose.connect(mongoUri);

    logger.info('Connected to MongoDB', { uri: mongoUri });

    // Set up mongoose connection events
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
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    const port = config.server.port;
    app.listen(port, () => {
      logger.info(`Server started on port ${port}`, {
        env: config.server.env,
        port,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
};

startServer();

export { app, register };
