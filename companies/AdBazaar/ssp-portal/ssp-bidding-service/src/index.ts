import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import { errorHandler, notFoundHandler } from './middleware';
import biddingRoutes from './routes';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4523;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ssp_bidding';

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'ssp-bidding-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Readiness check endpoint
app.get('/ready', async (_req: Request, res: Response) => {
  try {
    // Check MongoDB connection
    const mongoState = mongoose.connection.readyState;
    const isMongoConnected = mongoState === 1;

    if (!isMongoConnected) {
      res.status(503).json({
        status: 'not ready',
        service: 'ssp-bidding-service',
        checks: {
          mongodb: isMongoConnected ? 'connected' : 'disconnected',
        },
      });
      return;
    }

    res.status(200).json({
      status: 'ready',
      service: 'ssp-bidding-service',
      checks: {
        mongodb: 'connected',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      service: 'ssp-bidding-service',
      error: (error as Error).message,
    });
  }
});

// API routes
app.use('/api/bidding', biddingRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Database connection
const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('Connected to MongoDB', { uri: MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@') });

    // Handle connection events
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
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');

    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error: (error as Error).message });
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(PORT, () => {
    logger.info(`SSP Bidding Service running on port ${PORT}`, {
      port: PORT,
      env: process.env.NODE_ENV || 'development',
      mongoUri: MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@'),
    });
  });
};

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer().catch((error) => {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  });
}

export default app;