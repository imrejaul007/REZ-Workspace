/**
 * REZ Try Service
 * Product Trials & Sampling - Port 3001
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { config } from './config';
import { logger } from './config/logger';
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rateLimit';

// Routes
import trialRoutes from './routes/trialRoutes';
import bookingRoutes from './routes/bookingRoutes';
import explorerRoutes from './routes/explorerRoutes';
import campaignRoutes from './routes/campaignRoutes';
import coinRoutes from './routes/coinRoutes';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-try-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/trials', trialRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/explorer', explorerRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/coins', coinRoutes);

// Webhook routes (for integrations)
import webhookRoutes from './routes/webhookRoutes';
app.use('/webhooks', webhookRoutes);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', { error: err.message, stack: err.stack });
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' ? err.message : undefined,
  });
});

// Database connection
async function connectDB() {
  try {
    await mongoose.connect(config.mongodbUri);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Start server
async function start() {
  await connectDB();

  app.listen(config.port, () => {
    logger.info(`REZ Try Service running on port ${config.port}`);
    logger.info(`Health: http://localhost:${config.port}/health`);
  });
}

start();

export default app;
