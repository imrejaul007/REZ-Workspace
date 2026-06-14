/**
 * ReZ Prive Service
 *
 * Premium Loyalty Service with 6-Pillar Eligibility Engine
 *
 * This microservice provides:
 * - 6-Pillar eligibility scoring
 * - Prive tier management
 * - Engagement signal processing
 * - Ecosystem integrations (Creator QR, AdBazaar, DOOH, Karma)
 *
 * Port: 4070
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { tracingMiddleware } from './middleware/tracing';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';

import { logger } from './config/logger';
import { rateLimiter } from './middleware/rateLimiter';
import { requireAuth } from './middleware/auth';

// Routes
import eligibilityRoutes from './routes/eligibilityRoutes';
import coinRoutes from './routes/coinRoutes';
import campaignRoutes from './routes/campaignRoutes';
import engagementRoutes from './routes/engagementRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import ecosystemRoutes from './routes/ecosystemRoutes';

// Models
import './models/PriveAccess';
import './models/PriveEngagement';
import './models/PriveTier';

const app = express();
const PORT = parseInt(process.env.PORT || '4070', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_prive';

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Logging
if (NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Health check (no auth required)
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-prive-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Rate limiting
app.use(rateLimiter);

// Authentication (apply to all routes below)
app.use(requireAuth);

// API Routes
app.use('/api/eligibility', eligibilityRoutes);
app.use('/api/coins', coinRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/engagement', engagementRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ecosystem', ecosystemRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Database connection
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB', { uri: MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@') });
  } catch (error) {
    logger.error('MongoDB connection failed:', { error });
    process.exit(1);
  }
}

// Start server
async function start() {
  await connectDB();

  app.listen(PORT, () => {
    logger.info(`ReZ Prive Service started`, {
      port: PORT,
      env: NODE_ENV,
      url: `http://localhost:${PORT}`,
    });
  });
}

start();

export default app;
