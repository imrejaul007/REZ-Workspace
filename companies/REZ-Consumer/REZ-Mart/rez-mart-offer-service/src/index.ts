import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger, logStream } from './utils/logger.js';
import offerRoutes from './routes/index.js';
import { AppError } from './routes/index.js';
export { AppError };

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4109;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rezmart_offers';

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging
app.use(morgan('combined', { stream: logStream }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const dbStatus = dbStatusMap[dbState] || 'unknown';

  res.status(200).json({
    status: 'healthy',
    service: 'rez-mart-offer-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      name: mongoose.connection.name,
    },
  });
});

// Readiness check endpoint
app.get('/ready', async (_req: Request, res: Response) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        ready: false,
        reason: 'Database not connected',
      });
      return;
    }

    // Ping database
    await mongoose.connection.db?.admin().ping();

    res.status(200).json({
      ready: true,
      service: 'rez-mart-offer-service',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      reason: 'Database ping failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// API routes
app.use('/api/offers', offerRoutes);

// Additional stats endpoint
app.get('/api/offers/stats', offerRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: 'The requested endpoint does not exist',
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    name: err.name,
  });

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
    return;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      message: err.message,
    });
    return;
  }

  // Handle Mongoose duplicate key errors
  if (err.name === 'MongoServerError' && (err as unknown as { code: number }).code === 11000) {
    res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      message: 'A record with this value already exists',
    });
    return;
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      message: err.message,
    });
    return;
  }

  // Default server error
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// Database connection
const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('Connected to MongoDB', { uri: MONGODB_URI });

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

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}, shutting down gracefully...`);

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

// Start server
const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(PORT, () => {
    logger.info(`REZ-Mart Offer Service started on port ${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info(`API base: http://localhost:${PORT}/api/offers`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export default app;