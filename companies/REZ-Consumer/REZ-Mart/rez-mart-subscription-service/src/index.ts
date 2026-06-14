import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import winston from 'winston';

// Load environment variables
dotenv.config();

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'rez-mart-subscription-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Import routes
import subscriptionRoutes from './routes';

// Create Express app
const app = express();

// Get configuration
const PORT = process.env.PORT || 4110;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rezmart_subscriptions';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware configuration
app.use(helmet());
app.use(cors());
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    service: 'rez-mart-subscription-service',
    version: '1.0.0'
  };
  res.status(200).json(healthcheck);
});

// Ready check endpoint
app.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check MongoDB connection
    const mongoState = mongoose.connection.readyState;
    const mongoStates: { [key: number]: string } = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    if (mongoState === 1) {
      res.status(200).json({
        status: 'ready',
        mongodb: mongoStates[mongoState],
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        mongodb: mongoStates[mongoState],
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Service not ready',
      timestamp: new Date().toISOString()
    });
  }
});

// API routes
app.use('/api/subscriptions', subscriptionRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(NODE_ENV === 'development' && { message: err.message, stack: err.stack })
  });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    logger.info('Connecting to MongoDB...');
    logger.info(`MONGODB_URI: ${MONGODB_URI}`);

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    logger.info('Successfully connected to MongoDB');

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

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`REZ-Mart Subscription Service running on port ${PORT}`);
      logger.info(`Environment: ${NODE_ENV}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Ready check: http://localhost:${PORT}/ready`);
      logger.info(`API base: http://localhost:${PORT}/api/subscriptions`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);

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

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();

export default app;