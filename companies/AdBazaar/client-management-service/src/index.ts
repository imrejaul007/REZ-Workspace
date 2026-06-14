import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import { clientRoutes } from './routes';
import { logger, metricsMiddleware, register, createRedisClient, closeRedisConnection } from './utils';
import { errorHandler, requestLogger, rateLimit } from './middleware/auth';

// Configuration
const PORT = process.env.PORT || 5011;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/adbazaar-clients';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create Express app
const app: Express = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Service-Token', 'X-Agency-Id', 'X-User-Id', 'X-User-Name', 'X-User-Role'],
  credentials: true,
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Prometheus metrics middleware
app.use(metricsMiddleware);

// Rate limiting
app.use(rateLimit(60000, 100));

// Health check endpoint (before auth)
app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.json({
    success: true,
    data: {
      service: 'client-management-service',
      version: '1.0.0',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: NODE_ENV,
      port: PORT,
      dependencies: {
        mongodb: mongoStatus,
        redis: 'checking...',
      },
    },
  });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Failed to get metrics', { error });
    res.status(500).end();
  }
});

// API routes
app.use('/', clientRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Error handler
app.use(errorHandler);

// Database connection
const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('MongoDB connected successfully', { uri: MONGODB_URI.replace(/\/\/.*@/, '//***@') });

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error', { error });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    throw error;
  }
};

// Redis connection
const connectRedis = async (): Promise<void> => {
  try {
    await createRedisClient();
    logger.info('Redis connection initialized');
  } catch (error) {
    logger.warn('Redis connection failed, continuing without cache', { error });
    // Don't throw - Redis is optional
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  try {
    // Close Redis
    await closeRedisConnection();

    // Close MongoDB
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');

    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error });
    process.exit(1);
  }
};

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to databases
    await connectDatabase();
    await connectRedis();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`Client Management Service started`, {
        port: PORT,
        environment: NODE_ENV,
        nodeVersion: process.version,
        pid: process.pid,
      });

      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Metrics: http://localhost:${PORT}/metrics`);
      logger.info(`API: http://localhost:${PORT}/api/clients`);
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
        process.exit(1);
      }
      throw error;
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Unhandled rejection handler
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason, promise });
    });

    // Uncaught exception handler
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error });
      gracefulShutdown('uncaughtException');
    });

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;