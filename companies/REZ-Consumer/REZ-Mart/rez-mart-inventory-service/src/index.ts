import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { z } from 'zod';
import { InventoryItem } from './models/index.js';
import inventoryRoutes from './routes/index.js';

// Load environment variables
const PORT = parseInt(process.env.PORT || '4107', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rezmart_inventory';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize Express app
const app = express();

// Winston logger setup
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'rez-mart-inventory-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length > 1 ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      ),
    }),
  ],
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Morgan logging with Winston
morgan.token('message', (req: Request) => req.logMessage || '');
app.use(
  morgan((tokens, req: Request, res: Response) => {
    return [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens['response-time'](req, res),
      'ms',
    ].join(' ');
  }, {
    stream: {
      write: (message: string) => {
        logger.info(message.trim());
      },
    },
  })
);

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const healthCheck = {
    status: 'ok',
    service: 'rez-mart-inventory-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  };

  try {
    // Check MongoDB connection
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    healthCheck.mongoStatus = mongoStatus;

    if (mongoStatus !== 'connected') {
      healthCheck.status = 'degraded';
    }

    return res.status(200).json(healthCheck);
  } catch (error) {
    logger.error('Health check failed', { error });
    return res.status(503).json({
      ...healthCheck,
      status: 'unhealthy',
      error: 'Health check failed',
    });
  }
});

// Ready check endpoint
app.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        ready: false,
        reason: 'MongoDB not connected',
        timestamp: new Date().toISOString(),
      });
    }

    // Optional: perform a simple DB operation to verify
    await mongoose.connection.db?.admin().ping();

    return res.status(200).json({
      ready: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Ready check failed', { error });
    return res.status(503).json({
      ready: false,
      reason: 'Database ping failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// API routes
app.use('/api/inventory', inventoryRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  return res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    error: 'NOT_FOUND',
    path: req.path,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle Zod validation errors
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: 'VALIDATION_ERROR',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: 'VALIDATION_ERROR',
      details: err.message,
    });
  }

  // Handle Mongoose duplicate key errors
  if (err.name === 'MongoServerError' && (err as unknown as { code: number }).code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry',
      error: 'DUPLICATE_KEY',
    });
  }

  // Default error response
  return res.status(500).json({
    success: false,
    message: NODE_ENV === 'production' ? 'Internal server error' : err.message,
    error: 'INTERNAL_ERROR',
  });
});

// Database connection
async function connectToDatabase(): Promise<void> {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      logger.info('Connecting to MongoDB...', { uri: MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@') });

      await mongoose.connect(MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      logger.info('MongoDB connected successfully');

      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error', { error: err.message });
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });

      return;
    } catch (error) {
      retries++;
      logger.error('MongoDB connection failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        retry: retries,
        maxRetries,
      });

      if (retries >= maxRetries) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, retries), 30000);
      logger.info(`Retrying connection in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, starting graceful shutdown...`);

  try {
    // Close MongoDB connection
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

// Start server
async function startServer(): Promise<void> {
  try {
    await connectToDatabase();

    app.listen(PORT, () => {
      logger.info(`REZ-Mart Inventory Service started`, {
        port: PORT,
        environment: NODE_ENV,
        nodeEnv: NODE_ENV,
        pid: process.pid,
      });
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Ready check: http://localhost:${PORT}/ready`);
      logger.info(`API base: http://localhost:${PORT}/api/inventory`);
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
}

startServer();

export { app, logger };