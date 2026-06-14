import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import winston from 'winston';
import { analyticsRoutes } from './routes/index.js';
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config();

// Configure Winston logger
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

winston.add(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
);

const app: Application = express();
const PORT = process.env.PORT || 4525;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ssp_analytics';

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  });
  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.status(200).json({
    status: 'healthy',
    service: 'ssp-analytics-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      mongodb: mongoStatus,
      api: 'operational'
    }
  });
});

// Ready check endpoint
app.get('/ready', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1;

  if (!mongoStatus) {
    return res.status(503).json({
      status: 'not ready',
      reason: 'MongoDB not connected',
      timestamp: new Date().toISOString()
    });
  }

  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    logger.info('Connecting to MongoDB...', { uri: MONGODB_URI });

    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    logger.info('MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', { error: err instanceof Error ? err.message : String(err) });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    app.listen(PORT, () => {
      logger.info(`SSP Analytics Service running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Ready check: http://localhost:${PORT}/ready`);
      logger.info(`API base: http://localhost:${PORT}/api/analytics`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

// Start the server
startServer();

export default app;