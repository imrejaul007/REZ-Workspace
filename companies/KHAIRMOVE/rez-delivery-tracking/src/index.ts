// REZ Delivery Tracking Service
// Real-time driver tracking, GPS, ETAs

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import trackingRoutes from './routes/tracking';
import { globalLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 4023;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_delivery_tracking';

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(express.json());

// Rate limiting
app.use('/api/', globalLimiter);

// Routes
app.use('/api/tracking', trackingRoutes);

// Health check with dependency status
app.get('/health', async (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({
    status: 'ok',
    service: 'delivery-tracking',
    timestamp: new Date().toISOString(),
    dependencies: {
      mongodb: mongoStatus,
    },
  });
});

// Readiness probe
app.get('/ready', (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ ready: false, reason: 'MongoDB not connected' });
  }
  res.json({ ready: true });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Connect to MongoDB and start server
async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');
    
    app.listen(PORT, () => {
      logger.info(`Delivery Tracking Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    // In production, you might want to exit or retry
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    // For development, start without MongoDB (will fail on data operations)
    app.listen(PORT, () => {
      logger.warn(`Delivery Tracking Service running on port ${PORT} WITHOUT MongoDB`);
    });
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

start();

export default app;
