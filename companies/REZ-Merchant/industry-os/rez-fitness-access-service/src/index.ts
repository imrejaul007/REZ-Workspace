/**
 * Fitness Access Service
 * QR-based gym access and check-in system
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { accessRoutes } from './routes/access.routes';
import { memberRoutes } from './routes/member.routes';
import { statsRoutes } from './routes/stats.routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './config/logger';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4015;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fitness-access';

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CORS_ORIGIN?.split(',')
    : ['http://localhost:3000', 'http://localhost:4008'],
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'rez-fitness-access-service', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/access', accessRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/stats', statsRoutes);

// Error handling
app.use(errorHandler);

// Database connection
async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    app.listen(PORT, () => {
      logger.info(`Fitness Access service running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

start();

export default app;
