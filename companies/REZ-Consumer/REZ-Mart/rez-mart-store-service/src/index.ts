import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import winston from 'winston';
import storeRoutes from './routes';

// ============================================
// Configuration
// ============================================

dotenv.config();

const PORT = process.env.PORT || 4103;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rezmart_stores';
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================
// Logger Setup
// ============================================

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    }),
  ],
});

// ============================================
// Express Application
// ============================================

const app = express();

// ============================================
// Middleware
// ============================================

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
}));

// ============================================
// Health Check Endpoints
// ============================================

/**
 * GET /health - Detailed health check
 */
app.get('/health', async (_req: Request, res: Response) => {
  const healthCheck = {
    service: 'rez-mart-store-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    mongodb: 'unknown',
  };

  // Check MongoDB connection
  if (mongoose.connection.readyState === 1) {
    healthCheck.mongodb = 'connected';
  } else if (mongoose.connection.readyState === 2) {
    healthCheck.mongodb = 'connecting';
  } else {
    healthCheck.mongodb = 'disconnected';
    healthCheck.status = 'degraded';
  }

  const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

/**
 * GET /ready - Readiness check
 */
app.get('/ready', async (_req: Request, res: Response) => {
  const isReady = mongoose.connection.readyState === 1;

  if (isReady) {
    res.json({
      ready: true,
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      ready: false,
      reason: 'MongoDB not connected',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET / - Root endpoint
 */
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'REZ-Mart Store Service',
    version: '1.0.0',
    description: 'Store management service for REZ-Mart quick commerce',
    endpoints: {
      health: '/health',
      ready: '/ready',
      stores: '/api/stores',
    },
  });
});

// ============================================
// API Routes
// ============================================

app.use('/api/stores', storeRoutes);

// ============================================
// 404 Handler
// ============================================

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// ============================================
// Error Handler
// ============================================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);

  res.status(500).json({
    success: false,
    error: NODE_ENV === 'production' ? 'Internal server error' : err.message,
    stack: NODE_ENV === 'production' ? undefined : err.stack,
  });
});

// ============================================
// Database Connection
// ============================================

const connectDB = async (): Promise<void> => {
  try {
    logger.info(`Connecting to MongoDB at ${MONGODB_URI}...`);

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('MongoDB connected successfully');

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

// ============================================
// Graceful Shutdown
// ============================================

const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================
// Server Start
// ============================================

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      logger.info(`REZ-Mart Store Service running on port ${PORT}`);
      logger.info(`Environment: ${NODE_ENV}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API endpoint: http://localhost:${PORT}/api/stores`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;