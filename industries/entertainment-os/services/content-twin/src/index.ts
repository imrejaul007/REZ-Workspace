import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';

import { contentRoutes } from './routes/index.js';
import { logger } from './utils/index.js';

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', { message: error.message, stack: error.stack });
  if (process.env.NODE_ENV === 'production') process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 8105;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/content_twin';

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'content-twin',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'Entertainment OS - Content Twin Service',
    description: 'Digital twin service for entertainment content with performance metrics',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      content: '/api/twins/content',
      stats: '/api/twins/content/stats/summary',
    },
  });
});

app.use('/api/twins/content', contentRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error handler', { message: err.message, stack: err.stack, path: req.path });
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal error' : err.message,
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

async function start() {
  logger.info('Starting Content Twin Service...');
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB connected', { uri: MONGODB_URI });
  } catch (error) {
    logger.error('MongoDB connection failed', { error });
  }
  app.listen(PORT, () => {
    logger.info(`Content Twin Service running on port ${PORT}`);
    logger.info(`Health: http://localhost:${PORT}/health`);
    logger.info(`API: http://localhost:${PORT}/api/twins/content`);
  });
}

process.on('SIGTERM', async () => {
  logger.info('Shutting down...');
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Shutting down...');
  await mongoose.disconnect();
  process.exit(0);
});

start().catch((error) => {
  logger.error('Failed to start', { error });
  process.exit(1);
});

export default app;