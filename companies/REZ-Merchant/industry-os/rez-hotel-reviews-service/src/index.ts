/**
 * REZ Hotel Reviews Service
 * Port: 4023
 *
 * Express server with endpoints for:
 * - Review submission
 * - Star ratings (1-5)
 * - Sentiment analysis
 * - Response management
 * - Moderation
 * - Analytics
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Import routes and services
import reviewRoutes from './routes/review.routes';
import { ReviewModel } from './models/Review';

const app = express();
const PORT = parseInt(process.env.PORT || '4023', 10);
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/rez_hotel_reviews';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', async (_req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const reviewCount = await ReviewModel.countDocuments().catch(() => 0);

  res.json({
    status: dbStatus === 'connected' ? 'healthy' : 'degraded',
    service: 'rez-hotel-reviews-service',
    port: PORT,
    database: dbStatus,
    reviewCount,
    timestamp: new Date().toISOString(),
  });
});

// Health checks
app.get('/health/live', (_req: Request, res: Response) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

app.get('/health/ready', async (_req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ status: 'not_ready', reason: 'Database not connected' });
  }
  res.json({ status: 'ready', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/reviews', reviewRoutes);
app.use('/api', reviewRoutes); // Also mount at root for /api/reviews/:hotelId/rating etc

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ReviewsService Error]', err);

  res.status(500).json({
    success: false,
    error: {
      code: 'ERROR',
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    },
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down REZ Hotel Reviews Service...');
  await mongoose.disconnect();
  console.log('MongoDB disconnected');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function start() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to MongoDB');

    // Create indexes
    await ReviewModel.createIndexes();

    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║       REZ Hotel Reviews Service Started            ║
╠══════════════════════════════════════════════════════════╣
║  Port:        ${PORT}                                 ║
║  MongoDB:     Connected                           ║
║  Database:    ${MONGO_URL.split('@')[1] || 'localhost'}         ║
╚══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export default app;
