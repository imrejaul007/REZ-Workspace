import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import { logger } from './utils/logger';
import { errorHandler, rateLimiter } from './middleware/auth';
import whatsappRoutes from './routes/whatsappRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import notificationRoutes from './routes/notificationRoutes';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4745;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimiter(100, 60000));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'whatsapp-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/whatsapp', subscriptionRoutes);
app.use('/api/whatsapp', notificationRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// Error handler
app.use(errorHandler);

// Database connection
const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpperks-whatsapp';

  try {
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    // Don't exit in dev mode, allow service to start without DB
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Start server
const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(PORT, () => {
    logger.info(`WhatsApp service running on port ${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info(`Webhook URL: http://localhost:${PORT}/api/whatsapp/webhook`);
  });
};

// Graceful shutdown
const gracefulShutdown = (): void => {
  logger.info('Shutting down gracefully...');
  mongoose.connection.close().then(() => {
    logger.info('MongoDB connection closed');
    process.exit(0);
  }).catch(() => {
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
