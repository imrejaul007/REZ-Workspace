import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { connectRedis } from './config/redis';
import { config } from './config/env';
import packageRoutes from './routes/packages.routes';
import membershipRoutes from './routes/membership.routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

const app: Express = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'rez-salon-membership-service' });
});

// Routes
app.use('/api/v1/packages', packageRoutes);
app.use('/api/v1/memberships', membershipRoutes);

// Error handler
app.use(errorHandler);

// Database connection
export async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Connect to Redis
    await connectRedis();
    logger.info('Connected to Redis');

    // Start server
    app.listen(config.PORT, () => {
      logger.info(`Salon Membership Service running on port ${config.PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

startServer();

export { app };
