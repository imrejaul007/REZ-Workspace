import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

// Routes
import franchiseRoutes from './routes/franchise';

// Config
import { loadConfig } from './config/env';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler, requestLogger, correlationIdMiddleware } from './middleware/common';

// Services
import { InventorySyncService } from './services/inventorySync';
import { MenuSyncService } from './services/menuSync';

// Initialize configuration
const config = loadConfig();

// Create Express application
const app: Express = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-Correlation-ID', 'X-Franchise-Id']
}));

// Compression middleware
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.headers['x-forwarded-for']?.toString() ||
           req.socket.remoteAddress ||
           'unknown';
  }
});
app.use('/api/', limiter);

// Custom middleware
app.use(correlationIdMiddleware);
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.json({
    success: true,
    data: {
      service: 'REZ Franchise Management',
      version: '1.0.0',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      dependencies: {
        mongodb: mongoStatus
      }
    }
  });
});

// Readiness check endpoint
app.get('/ready', (req: Request, res: Response) => {
  const isReady = mongoose.connection.readyState === 1;

  if (isReady) {
    res.json({
      success: true,
      data: {
        status: 'ready',
        timestamp: new Date().toISOString()
      }
    });
  } else {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_NOT_READY',
        message: 'Service is not ready to accept requests'
      }
    });
  }
});

// API routes
app.use('/api/v1/franchise', franchiseRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Database connection
async function connectToDatabase(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_franchise';

  try {
    logger.info('Connecting to MongoDB...', { uri: mongoUri.replace(/\/\/.*@/, '//<credentials>@') });

    await mongoose.connect(mongoUri, {
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

// Initialize background services
function initializeBackgroundServices(): void {
  const enableAutoSync = process.env.ENABLE_AUTO_SYNC === 'true';

  if (enableAutoSync) {
    const syncInterval = parseInt(process.env.SYNC_INTERVAL_MS || '300000');

    logger.info('Starting background sync services', { intervalMs: syncInterval });

    // Start inventory sync service
    const inventorySyncService = InventorySyncService.getInstance();
    inventorySyncService.startAutoSync(syncInterval);

    // Start menu sync service
    const menuSyncService = MenuSyncService.getInstance();
    menuSyncService.startAutoSync(syncInterval);
  }
}

// Graceful shutdown handler
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  // Stop accepting new requests
  const server = app.listen();

  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Close database connection
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection', { error: (error as Error).message });
  }

  process.exit(0);
}

// Start server
async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectToDatabase();

    // Initialize background services
    initializeBackgroundServices();

    // Start HTTP server
    const port = parseInt(process.env.PORT || '4025');
    const host = process.env.HOST || '0.0.0.0';

    app.listen(port, host, () => {
      logger.info(`REZ Franchise Management Service started`, {
        port,
        host,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version
      });
      logger.info(`\n🚀 REZ Franchise Management Service`);
      logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`   Port: ${port}`);
      logger.info(`   Health: http://localhost:${port}/health`);
      logger.info(`   API: http://localhost:${port}/api/v1/franchise\n`);
    });

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack
      });
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', {
        reason: reason instanceof Error ? reason.message : String(reason),
        promise: String(promise)
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
