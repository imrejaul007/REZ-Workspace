import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import { logger } from './utils/logger.js';
import inventoryRoutes from './routes/index.js';
import {
  errorHandler,
  notFoundHandler,
} from './middleware/error.middleware.js';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 4522;
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/ssp_inventory';

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health check endpoints
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'ssp-inventory-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/ready', async (_req: Request, res: Response) => {
  try {
    // Check MongoDB connection
    const mongoState = mongoose.connection.readyState;
    const isMongoReady = mongoState === 1;

    if (isMongoReady) {
      res.json({
        status: 'ready',
        service: 'ssp-inventory-service',
        dependencies: {
          mongodb: 'connected',
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        service: 'ssp-inventory-service',
        dependencies: {
          mongodb: mongoState === 0 ? 'disconnected' : 'connecting',
        },
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      service: 'ssp-inventory-service',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

// API Routes
app.use('/api/inventory', inventoryRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection
const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('Connected to MongoDB successfully');

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', { error: err instanceof Error ? err.message : String(err) });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received. Shutting down gracefully...`);

  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      logger.info(`SSP Inventory Service running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Ready check: http://localhost:${PORT}/ready`);
      logger.info(`API base: http://localhost:${PORT}/api/inventory`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

// Export for testing
export { app, connectDB };

// Start server if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}