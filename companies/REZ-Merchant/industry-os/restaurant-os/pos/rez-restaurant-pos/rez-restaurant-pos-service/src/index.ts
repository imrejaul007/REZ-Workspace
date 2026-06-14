import express from 'express';
import logger from './utils/logger';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import { config } from './config';
import { billingRoutes, paymentRoutes, invoiceRoutes, splitRoutes } from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import new route handlers
import inventoryRoutes from './routes/inventory.routes';
import staffRoutes from './routes/staff.routes';
import deliveryRoutes from './routes/delivery.routes';
import multiOutletRoutes from './routes/multioutlet.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'rez-restaurant-pos-service' });
});

// Existing routes
app.use('/api/v1/bills', billingRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/splits', splitRoutes);

// New routes
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/delivery', deliveryRoutes);
app.use('/api/v1/outlets', multiOutletRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function connectToMongoDB(): Promise<void> {
  try {
    await mongoose.connect(config.mongodb.uri);
    logger.info('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

async function connectToRedis(): Promise<Redis> {
  const redis = new Redis(config.redis.url);

  redis.on('connect', () => {
    logger.info('Connected to Redis');
  });

  redis.on('error', (error) => {
    console.error('Redis connection error:', error);
  });

  return redis;
}

async function startServer(): Promise<void> {
  try {
    await connectToMongoDB();

    const redis = await connectToRedis();

    const server = app.listen(config.port, () => {
      logger.info(`Restaurant POS Service running on port ${config.port}`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');
        await mongoose.disconnect();
        logger.info('MongoDB disconnected');
        redis.disconnect();
        logger.info('Redis disconnected');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

export { app, startServer };
