/**
 * Affiliate Tracking Service
 * AdBazaar - Track affiliate conversions and commissions
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import logger from 'utils/logger.js';
import { metricsMiddleware, metricsHandler } from './utils/metrics';
import affiliateRoutes from './routes/affiliateRoutes';
import conversionRoutes from './routes/conversionRoutes';
import commissionRoutes from './routes/commissionRoutes';

const app = express();
const PORT = parseInt(process.env.PORT || '5060', 10);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/affiliate-tracking';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Metrics middleware
app.use(metricsMiddleware);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'affiliate-tracking-service',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Metrics endpoint
app.get('/metrics', metricsHandler);

// API Routes
app.use('/api/affiliates', affiliateRoutes);
app.use('/api/conversions', conversionRoutes);
app.use('/api/commissions', commissionRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
  });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Database connection and server start
async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB', { uri: MONGODB_URI });

    app.listen(PORT, () => {
      logger.info(`[${new Date().toISOString()}] Affiliate Tracking Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

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

startServer();

export default app;