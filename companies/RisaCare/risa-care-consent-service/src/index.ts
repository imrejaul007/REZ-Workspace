import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import consentRoutes from './routes/consentRoutes';
import { recordConsentService } from './services/recordConsentService';
import logger from './utils/logger';

const app = express();
const PORT = process.env.PORT || 4706;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa-care-consents';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query
  });
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'risa-care-consent-service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/consent', consentRoutes);

// Background job: Expire old record consents every hour
setInterval(async () => {
  try {
    const expiredCount = await recordConsentService.expireOldConsents();
    if (expiredCount > 0) {
      logger.info('Background: Expired old record consents', { count: expiredCount });
    }
  } catch (error) {
    logger.error('Background: Failed to expire old consents', { error });
  }
}, 60 * 60 * 1000); // Every hour

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not found'
  });
});

// Database connection
async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB', { uri: MONGODB_URI });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    logger.warn('Running without database connection');
  }
}

// Start server
async function startServer(): Promise<void> {
  await connectDatabase();

  app.listen(PORT, () => {
    logger.info(`RisaCare Consent Service started`, {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      mongodb: MONGODB_URI
    });
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server', { error });
  process.exit(1);
});

export default app;
