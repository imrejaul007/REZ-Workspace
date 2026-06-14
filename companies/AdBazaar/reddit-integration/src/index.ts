import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { config } from './config/env';
import { logger } from './config/logger';
import { metricsMiddleware, metrics } from './config/metrics';
import { authMiddleware } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rateLimitMiddleware } from './middleware/rateLimit';

// Routes
import authRoutes from './routes/auth';
import subredditRoutes from './routes/subreddits';
import postRoutes from './routes/posts';
import commentRoutes from './routes/comments';
import analyticsRoutes from './routes/analytics';
import scheduleRoutes from './routes/schedule';

// Models for connection check
import './models/RedditAccount';
import './models/RedditPost';
import './models/RedditComment';
import './models/RedditSubreddit';
import './models/ScheduledPost';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Metrics middleware
app.use(metricsMiddleware);

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip
    });
  });
  next();
});

// Rate limiting
app.use(rateLimitMiddleware);

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.json({
    status: 'healthy',
    service: 'reddit-integration',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoStatus
  });
});

// Metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  res.set('Content-Type', metrics.getContentType());
  res.send(await metrics.getMetrics());
});

// Auth routes (no auth required)
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/subreddits', authMiddleware, subredditRoutes);
app.use('/api/posts', authMiddleware, postRoutes);
app.use('/api/comments', authMiddleware, commentRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/schedule', authMiddleware, scheduleRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection
const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info('Connected to MongoDB', { uri: config.mongodb.uri });
  } catch (error) {
    logger.error('MongoDB connection error', { error });
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(config.port, () => {
    logger.info(`Reddit Integration Service started`, {
      port: config.port,
      env: config.env,
      nodeEnv: process.env.NODE_ENV
    });
  });
};

startServer().catch((error) => {
  logger.error('Failed to start server', { error });
  process.exit(1);
});

export default app;