import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import videosRoutes from './routes/videos.routes';
import commentsRoutes from './routes/comments.routes';
import analyticsRoutes from './routes/analytics.routes';
import scheduleRoutes from './routes/schedule.routes';

const app: Express = express();
const PORT = process.env.PORT || 4785;

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.path}`, {
      requestId,
      status: res.statusCode,
      duration: `${duration}ms`,
      tenantId: req.headers['x-tenant-id'] || 'unknown',
    });
  });

  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-tiktok-integration',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/auth', authRoutes);
app.use('/videos', videosRoutes);
app.use('/comments', commentsRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/schedule', scheduleRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'REZ TikTok Integration Service',
    version: '1.0.0',
    description: 'TikTok API integration service for ReZ platform',
    endpoints: {
      health: 'GET /health',
      auth: {
        getAuthUrl: 'GET /auth/url',
        callback: 'GET /auth/callback',
        setToken: 'POST /auth/token',
        disconnect: 'DELETE /auth/disconnect',
        status: 'GET /auth/status',
      },
      videos: {
        post: 'POST /videos',
        list: 'GET /videos',
        get: 'GET /videos/:id',
        delete: 'DELETE /videos/:id',
      },
      comments: {
        list: 'GET /comments/:videoId',
        post: 'POST /comments/:videoId',
        reply: 'POST /comments/:videoId/:commentId/reply',
        like: 'POST /comments/:commentId/like',
      },
      analytics: {
        video: 'GET /analytics/video/:id',
        profile: 'GET /analytics/profile',
        overview: 'GET /analytics/overview',
      },
      schedule: {
        create: 'POST /schedule',
        list: 'GET /schedule',
        cancel: 'DELETE /schedule/:id',
      },
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: uuidv4(),
    },
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An internal server error occurred',
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: uuidv4(),
    },
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`REZ TikTok Integration Service started`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
  });
  logger.info(TikTok Integration Service running on port ${PORT}`);
});

export default app;
