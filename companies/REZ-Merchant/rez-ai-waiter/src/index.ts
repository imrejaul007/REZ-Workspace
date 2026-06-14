import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Routes
import apiRoutes from './routes';

// Config
import { config } from './config';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler, correlationIdMiddleware, requestLogger } from './middleware/common';

// Load environment variables
dotenv.config();

// Create Express application
const app: Express = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'X-Request-ID'],
}));

// Compression middleware
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return (
      req.headers['x-forwarded-for']?.toString() ||
      req.socket.remoteAddress ||
      'unknown'
    );
  },
});
app.use('/api/', limiter);

// Custom middleware
app.use(correlationIdMiddleware);
app.use(requestLogger);

// Health check endpoints
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      service: 'REZ AI Waiter',
      version: '1.0.0',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
    },
  });
});

app.get('/ready', async (_req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  if (mongoStatus === 'connected') {
    res.json({
      success: true,
      data: {
        status: 'ready',
        timestamp: new Date().toISOString(),
        dependencies: {
          mongodb: mongoStatus,
        },
      },
    });
  } else {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_NOT_READY',
        message: 'Service is not ready to accept requests',
      },
    });
  }
});

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Database connection
async function connectToDatabase(): Promise<void> {
  try {
    logger.info('Connecting to MongoDB...', {
      uri: config.mongodbUri.replace(/\/\/.*@/, '//<credentials>@'),
    });

    await mongoose.connect(config.mongodbUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('Successfully connected to MongoDB');

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
    logger.error('Failed to connect to MongoDB', { error: (error as Error).message });
    throw error;
  }
}

// Graceful shutdown handler
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  // Close database connection
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection', { error: (error as Error).message });
  }

  logger.info('Graceful shutdown complete');
  process.exit(0);
}

// Start server
async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectToDatabase();

    // Start HTTP server
    const { port, nodeEnv } = config;
    const host = '0.0.0.0';

    app.listen(port, host, () => {
      logger.info(`REZ AI Waiter Service started`, {
        port,
        host,
        environment: nodeEnv,
        nodeVersion: process.version,
      });
      logger.info(`\n  REZ AI Waiter Service`);
      logger.info(`  Environment: ${nodeEnv}`);
      logger.info(`  Port: ${port}`);
      logger.info(`  Health: http://localhost:${port}/health`);
      logger.info(`  API: http://localhost:${port}/api`);
      logger.info(`  WhatsApp Webhook: POST http://localhost:${port}/api/webhook/whatsapp\n`);
    });

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack,
      });
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', {
        reason: reason instanceof Error ? reason.message : String(reason),
        promise: String(promise),
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
}

// Start the application
startServer();

export default app;
