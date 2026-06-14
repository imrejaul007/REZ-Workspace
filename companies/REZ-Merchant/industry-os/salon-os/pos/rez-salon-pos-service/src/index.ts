import express, { Express, Request, Response } from 'express';
import logger from './utils/logger';
import cors from 'cors';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import { config } from './config';
import { errorHandler, requestLogger, rateLimiter } from './middleware';

// Import routes
import billingRoutes from './routes/billing.routes';
import inventoryRoutes from './routes/inventory.routes';
import invoiceRoutes from './routes/invoice.routes';

// Import models for Mongoose registration
import './models/Transaction';
import './models/Invoice';
import './models/Product';
import './models/Expense';

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(rateLimiter(100, 60000)); // 100 requests per minute

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'salon-pos-service',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/billing', billingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/invoices', invoiceRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Redis connection
let redis: Redis | null = null;

const connectRedis = async (): Promise<void> => {
  try {
    redis = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.warn('Redis connection failed, continuing without Redis');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });

    redis.on('connect', () => {
      logger.info('Connected to Redis');
    });

    redis.on('error', (err) => {
      console.error('Redis error:', err.message);
    });
  } catch (error) {
    logger.warn('Redis initialization failed, continuing without Redis');
  }
};

// Database connection
const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodb.uri);
    logger.info('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (): Promise<void> => {
  logger.info('Shutting down gracefully...');

  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    }

    if (redis) {
      await redis.quit();
      logger.info('Redis connection closed');
    }
  } catch (error) {
    console.error('Error during shutdown:', error);
  }

  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const startServer = async (): Promise<void> => {
  await connectDatabase();
  await connectRedis();

  app.listen(config.port, () => {
    logger.info(`Salon POS Service running on port ${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Health check: http://localhost:${config.port}/health`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export { app, redis };
