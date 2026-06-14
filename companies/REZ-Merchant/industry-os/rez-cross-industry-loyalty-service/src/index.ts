import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import accountsRoutes from './routes/accounts.routes';
import transactionsRoutes from './routes/transactions.routes';
import redemptionRoutes from './routes/redemption.routes';
import tiersRoutes from './routes/tiers.routes';
import campaignsRoutes from './routes/campaigns.routes';
import analyticsRoutes from './routes/analytics.routes';
import { startExpirePointsJob } from './jobs/expirePoints';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: { success: false, error: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-cross-industry-loyalty-service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health/ready', async (req, res) => {
  try {
    const mongoState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
      status: 'ready',
      mongodb: mongoState,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: 'Database connection failed'
    });
  }
});

app.get('/health/live', (req, res) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/accounts', accountsRoutes);
app.use('/api/v1/transactions', transactionsRoutes);
app.use('/api/v1/redemption', redemptionRoutes);
app.use('/api/v1/tiers', tiersRoutes);
app.use('/api/v1/campaigns', campaignsRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Error handler
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');

    // Close database connection
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    } catch (error) {
      logger.error('Error closing MongoDB connection:', error);
    }

    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    logger.info(`Connecting to MongoDB at ${config.mongodbUri}`);

    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    logger.info('Connected to MongoDB successfully');

    // Start the points expiration cron job
    startExpirePointsJob();
    logger.info('Points expiration job scheduled');

    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info(`REZ Cross-Industry Loyalty Service running on port ${config.port}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
      logger.info(`API base URL: http://localhost:${config.port}/api/v1`);
    });

    // Export server for graceful shutdown
    (global as any).server = server;

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;